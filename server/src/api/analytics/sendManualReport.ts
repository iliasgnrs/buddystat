import type { FastifyReply, FastifyRequest } from "fastify";
import { weeklyReportService } from "../../services/weekyReports/weeklyReportService.js";

export async function sendManualReport(
  request: FastifyRequest<{
    Params: { organizationId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { organizationId } = request.params;

    const result = await weeklyReportService.generateAndSendManualReport(organizationId);

    if (result.success) {
      return reply.send({ success: true, message: result.message });
    } else {
      return reply.code(400).send({ success: false, error: result.message });
    }
  } catch (error) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send manual report";
    return reply.code(500).send({ success: false, error: errorMessage });
  }
}
