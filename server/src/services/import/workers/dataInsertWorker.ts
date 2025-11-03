import { IJobQueue } from "../queues/jobQueue.js";
import { UmamiImportMapper } from "../mappings/umami.js";
import { DataInsertJob, DATA_INSERT_QUEUE } from "./jobs.js";
import { clickhouse } from "../../../db/clickhouse/clickhouse.js";
import { updateImportStatus, updateImportProgress } from "../importStatusManager.js";
import { createServiceLogger } from "../../../lib/logger/logger.js";

const logger = createServiceLogger("import:data-insert");

const getImportDataMapping = (platform: string) => {
  switch (platform) {
    case "umami":
      return UmamiImportMapper;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

const safeUpdateStatusToFailed = async (importId: string, errorMessage: string) => {
  try {
    await updateImportStatus(importId, "failed", errorMessage);
  } catch (updateError) {
    logger.error({ importId, error: updateError }, "Could not update status to failed");
  }
};

export async function createDataInsertWorker(jobQueue: IJobQueue) {
  await jobQueue.work<DataInsertJob>(DATA_INSERT_QUEUE, async job => {
    const { site, importId, platform, chunk, allChunksSent } = job;

    try {
      if (allChunksSent) {
        await updateImportStatus(importId, "completed");
        logger.info({ importId }, "Import completed successfully");
        return;
      }

      const dataMapper = getImportDataMapping(platform);
      const transformedRecords = dataMapper.transform(chunk, site, importId);

      await clickhouse.insert({
        table: "events",
        values: transformedRecords,
        format: "JSONEachRow",
      });

      logger.debug({ importId, recordCount: transformedRecords.length }, "Inserted chunk to ClickHouse");

      // Update progress (non-critical - log if fails but don't crash)
      try {
        await updateImportProgress(importId, transformedRecords.length);
      } catch (progressError) {
        logger.warn(
          { importId, error: progressError instanceof Error ? progressError.message : progressError },
          "Progress update failed (data inserted successfully)"
        );
        // Don't throw - data is safely in ClickHouse, progress can be off slightly
      }
    } catch (error) {
      logger.error({ importId, error }, "Worker processing failed");

      const errorMessage = allChunksSent ? "Failed to complete import" : "Data insertion failed due to unknown error";
      await safeUpdateStatusToFailed(importId, errorMessage);

      logger.error({ importId }, "Import operation failed, worker continuing");
    }
  });
}
