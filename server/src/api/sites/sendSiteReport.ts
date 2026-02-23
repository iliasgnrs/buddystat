import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { weeklyReportService } from "../../services/weekyReports/weeklyReportService.js";

export async function sendSiteReport(
  request: FastifyRequest<{
    Params: { siteId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const siteId = Number(request.params.siteId);

    // Fetch the site to get organization ID and report emails
    const [site] = await db.select().from(sites).where(eq(sites.siteId, siteId));

    if (!site) {
      return reply.code(404).send({ success: false, error: "Site not found" });
    }

    if (!site.reportEmails || site.reportEmails.length === 0) {
      return reply.code(400).send({
        success: false,
        error: "No email recipients configured for this site. Please add email addresses in Site Settings.",
      });
    }

    // Generate and send the manual report for this specific site
    const result = await weeklyReportService.generateAndSendSiteReport(
      site.organizationId,
      siteId,
      site.name,
      site.domain,
      site.reportEmails
    );

    if (result.success) {
      return reply.send({ success: true, message: result.message });
    } else {
      return reply.code(400).send({ success: false, error: result.message });
    }
  } catch (error) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send site report";
    return reply.code(500).send({ success: false, error: errorMessage });
  }
}
