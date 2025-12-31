import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { toNodeHandler } from "better-auth/node";
import Fastify from "fastify";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { collectTelemetry } from "./api/admin/collectTelemetry.js";
import { getAdminOrganizations } from "./api/admin/getAdminOrganizations.js";
import { getAdminServiceEventCount } from "./api/admin/getAdminServiceEventCount.js";
import { getAdminSites } from "./api/admin/getAdminSites.js";
import { getEventNames } from "./api/analytics/events/getEventNames.js";
import { getEventProperties } from "./api/analytics/events/getEventProperties.js";
import { getEvents } from "./api/analytics/events/getEvents.js";
import { getOutboundLinks } from "./api/analytics/events/getOutboundLinks.js";
import { createFunnel } from "./api/analytics/funnels/createFunnel.js";
import { deleteFunnel } from "./api/analytics/funnels/deleteFunnel.js";
import { getFunnel } from "./api/analytics/funnels/getFunnel.js";
import { getFunnelStepSessions } from "./api/analytics/funnels/getFunnelStepSessions.js";
import { getFunnels } from "./api/analytics/funnels/getFunnels.js";
import { getErrorBucketed } from "./api/analytics/getErrorBucketed.js";
import { getErrorEvents } from "./api/analytics/getErrorEvents.js";
import { getErrorNames } from "./api/analytics/getErrorNames.js";
import { getJourneys } from "./api/analytics/getJourneys.js";
import { getSessionLocations } from "./api/analytics/getSessionLocations.js";
import { getLiveUsercount } from "./api/analytics/getLiveUsercount.js";
import { getOrgEventCount } from "./api/analytics/getOrgEventCount.js";
import { getOverview } from "./api/analytics/getOverview.js";
import { getOverviewBucketed } from "./api/analytics/getOverviewBucketed.js";
import { getPageTitles } from "./api/analytics/getPageTitles.js";
import { getRetention } from "./api/analytics/getRetention.js";
import { getSession } from "./api/analytics/getSession.js";
import { getSessions } from "./api/analytics/getSessions.js";
import { getMetric } from "./api/analytics/getMetric.js";
import { getUserInfo } from "./api/analytics/getUserInfo.js";
import { getUserSessionCount } from "./api/analytics/getUserSessionCount.js";
import { getUsers } from "./api/analytics/getUsers.js";
import { createGoal } from "./api/analytics/goals/createGoal.js";
import { deleteGoal } from "./api/analytics/goals/deleteGoal.js";
import { getGoals } from "./api/analytics/goals/getGoals.js";
import { getGoalSessions } from "./api/analytics/goals/getGoalSessions.js";
import { updateGoal } from "./api/analytics/goals/updateGoal.js";
import { getPerformanceByDimension } from "./api/analytics/performance/getPerformanceByDimension.js";
import { getPerformanceOverview } from "./api/analytics/performance/getPerformanceOverview.js";
import { getPerformanceTimeSeries } from "./api/analytics/performance/getPerformanceTimeSeries.js";
import { getConfig } from "./api/getConfig.js";
import { getSessionReplayEvents } from "./api/sessionReplay/getSessionReplayEvents.js";
import { getSessionReplays } from "./api/sessionReplay/getSessionReplays.js";
import { recordSessionReplay } from "./api/sessionReplay/recordSessionReplay.js";
import { deleteSessionReplay } from "./api/sessionReplay/deleteSessionReplay.js";
import { addSite } from "./api/sites/addSite.js";
import { updateSiteConfig } from "./api/sites/updateSiteConfig.js";
import { deleteSite } from "./api/sites/deleteSite.js";
import { getSite } from "./api/sites/getSite.js";
import { getSiteExcludedIPs } from "./api/sites/getSiteExcludedIPs.js";
import { getSiteExcludedCountries } from "./api/sites/getSiteExcludedCountries.js";
import { getSiteHasData } from "./api/sites/getSiteHasData.js";
import { getSiteIsPublic } from "./api/sites/getSiteIsPublic.js";
import { getSitesFromOrg } from "./api/sites/getSitesFromOrg.js";
import { createCheckoutSession } from "./api/stripe/createCheckoutSession.js";
import { createPortalSession } from "./api/stripe/createPortalSession.js";
import { getSubscription } from "./api/stripe/getSubscription.js";
import { previewSubscriptionUpdate } from "./api/stripe/previewSubscriptionUpdate.js";
import { updateSubscription } from "./api/stripe/updateSubscription.js";
import { handleWebhook } from "./api/stripe/webhook.js";
import { addUserToOrganization } from "./api/user/addUserToOrganization.js";
import { getUserOrganizations } from "./api/user/getUserOrganizations.js";
import { listOrganizationMembers } from "./api/user/listOrganizationMembers.js";
import { updateAccountSettings } from "./api/user/updateAccountSettings.js";
import { listApiKeys } from "./api/user/listApiKeys.js";
import { createApiKey } from "./api/user/createApiKey.js";
import { deleteApiKey } from "./api/user/deleteApiKey.js";
import { initializeClickhouse } from "./db/clickhouse/clickhouse.js";
import { initPostgres } from "./db/postgres/initPostgres.js";
import { mapHeaders } from "./lib/auth-utils.js";
import { auth } from "./lib/auth.js";
import { IS_CLOUD } from "./lib/const.js";
import { siteConfig } from "./lib/siteConfig.js";
import { trackEvent } from "./services/tracker/trackEvent.js";
import { handleIdentify } from "./services/tracker/identifyService.js";
// need to import telemetry service here to start it
import { telemetryService } from "./services/telemetryService.js";
import { weeklyReportService } from "./services/weekyReports/weeklyReportService.js";
import { getTrackingConfig } from "./api/sites/getTrackingConfig.js";
import { updateSitePrivateLinkConfig } from "./api/sites/updateSitePrivateLinkConfig.js";
import { getSitePrivateLinkConfig } from "./api/sites/getSitePrivateLinkConfig.js";
import { connectGSC } from "./api/gsc/connect.js";
import { gscCallback } from "./api/gsc/callback.js";
import { getGSCStatus } from "./api/gsc/status.js";
import { disconnectGSC } from "./api/gsc/disconnect.js";
import { getGSCData } from "./api/gsc/getData.js";
import { selectGSCProperty } from "./api/gsc/selectProperty.js";
import { getSiteImports } from "./api/sites/getSiteImports.js";
import { createSiteImport } from "./api/sites/createSiteImport.js";
import { batchImportEvents } from "./api/sites/batchImportEvents.js";
import { deleteSiteImport } from "./api/sites/deleteSiteImport.js";
import {
  requireAuth,
  requireAdmin,
  requireSiteAccess,
  requireSiteAdminAccess,
  allowPublicSiteAccess,
  requireOrgMember,
  requireOrgAdminFromParams,
  resolveSiteId,
} from "./lib/auth-middleware.js";

// Pre-composed middleware chains for common auth patterns
// Cast as any to work around Fastify's type inference limitations with preHandler
const publicSite = { preHandler: [resolveSiteId, allowPublicSiteAccess] as any };
const authSite = { preHandler: [resolveSiteId, requireSiteAccess] as any };
const adminSite = { preHandler: [resolveSiteId, requireSiteAdminAccess] as any };
const authOnly = { preHandler: [requireAuth] as any };
const adminOnly = { preHandler: [requireAdmin] as any };
const orgMember = { preHandler: [requireOrgMember] as any };
const orgAdminParams = { preHandler: [requireOrgAdminFromParams] as any };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hasAxiom = !!(process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN);

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "development" ? "debug" : "info"),
    transport:
      process.env.NODE_ENV === "production" && IS_CLOUD && hasAxiom
        ? {
            targets: [
              // Send to Axiom
              {
                target: "@axiomhq/pino",
                level: process.env.LOG_LEVEL || "info",
                options: {
                  dataset: process.env.AXIOM_DATASET,
                  token: process.env.AXIOM_TOKEN,
                },
              },
              // Pretty print to stdout for Docker logs
              {
                target: "pino-pretty",
                level: process.env.LOG_LEVEL || "info",
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: "HH:MM:ss",
                  ignore: "pid,hostname,name",
                  destination: 1, // stdout
                },
              },
            ],
          }
        : process.env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                singleLine: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname,name",
              },
            }
          : undefined, // Production without Axiom - plain JSON to stdout
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          path: request.url,
          parameters: request.params,
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
  },
  maxParamLength: 1500,
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024, // 10MB limit for session replay data
});

server.register(cors, {
  origin: (_origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-captcha-response", "x-private-key"],
  credentials: true,
});

// Serve static files
server.register(fastifyStatic, {
  root: join(__dirname, "../public"),
  prefix: "/", // or whatever prefix you need
});

server.register(
  async (fastify, options) => {
    await fastify.register(fastify => {
      const authHandler = toNodeHandler(options.auth);

      fastify.addContentTypeParser(
        "application/json",
        /* c8 ignore next 3 */
        (_request, _payload, done) => {
          done(null, null);
        }
      );

      fastify.all("/api/auth/*", async (request, reply: any) => {
        reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
        await authHandler(request.raw, reply.raw);
      });
      fastify.all("/auth/*", async (request, reply: any) => {
        reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
        await authHandler(request.raw, reply.raw);
      });
    });
  },
  { auth: auth! }
);

// Serve analytics scripts with generic names to avoid ad-blocker detection
server.get("/api/script.js", async (_, reply) => reply.sendFile("script.js"));
server.get("/api/replay.js", async (_, reply) => reply.sendFile("rrweb.min.js"));
server.get("/api/metrics.js", async (_, reply) => reply.sendFile("web-vitals.iife.js"));

// WEB & PRODUCT ANALYTICS

// This endpoint gets called a lot so we don't want to log it
server.get("/api/live-user-count/:siteId", { logLevel: "silent", ...publicSite }, getLiveUsercount);
server.get("/api/overview/:siteId", publicSite, getOverview);
server.get("/api/overview-bucketed/:siteId", publicSite, getOverviewBucketed);
server.get("/api/metric/:siteId", publicSite, getMetric);
server.get("/api/page-titles/:siteId", publicSite, getPageTitles);
server.get("/api/error-names/:siteId", publicSite, getErrorNames);
server.get("/api/error-events/:siteId", publicSite, getErrorEvents);
server.get("/api/error-bucketed/:siteId", publicSite, getErrorBucketed);
server.get("/api/retention/:siteId", publicSite, getRetention);
server.get("/api/site-has-data/:siteId", publicSite, getSiteHasData);
server.get("/api/site-is-public/:siteId", publicSite, getSiteIsPublic);
server.get("/api/sessions/:siteId", publicSite, getSessions);
server.get("/api/sessions/:sessionId/:siteId", publicSite, getSession);
server.get("/api/events/:siteId", publicSite, getEvents);
server.get("/api/users/:siteId", publicSite, getUsers);
server.get("/api/users/session-count/:siteId", publicSite, getUserSessionCount);
server.get("/api/users/:userId/:siteId", publicSite, getUserInfo);
server.get("/api/session-locations/:siteId", publicSite, getSessionLocations);
server.get("/api/funnels/:siteId", publicSite, getFunnels);
server.get("/api/journeys/:siteId", publicSite, getJourneys);
server.post("/api/funnels/analyze/:siteId", publicSite, getFunnel);
server.post("/api/funnels/:stepNumber/sessions/:siteId", publicSite, getFunnelStepSessions);
server.post("/api/funnels/:siteId", authSite, createFunnel);
server.delete("/api/funnels/:funnelId/:siteId", authSite, deleteFunnel);
server.get("/api/goals/:siteId", publicSite, getGoals);
server.get("/api/goals/:goalId/sessions/:siteId", publicSite, getGoalSessions);
server.post("/api/goals/:siteId", authSite, createGoal);
server.delete("/api/goals/:goalId/:siteId", authSite, deleteGoal);
server.put("/api/goals/:goalId/:siteId", authSite, updateGoal);
server.get("/api/events/names/:siteId", publicSite, getEventNames);
server.get("/api/events/properties/:siteId", publicSite, getEventProperties);
server.get("/api/events/outbound/:siteId", publicSite, getOutboundLinks);
server.get("/api/org-event-count/:organizationId", orgMember, getOrgEventCount);

// Performance Analytics
server.get("/api/performance/overview/:siteId", publicSite, getPerformanceOverview);
server.get("/api/performance/time-series/:siteId", publicSite, getPerformanceTimeSeries);
server.get("/api/performance/by-dimension/:siteId", publicSite, getPerformanceByDimension);

// Session Replay
server.post("/api/session-replay/record/:siteId", recordSessionReplay); // Public - tracking endpoint
server.get("/api/session-replay/list/:siteId", publicSite, getSessionReplays);
server.get("/api/session-replay/:sessionId/:siteId", publicSite, getSessionReplayEvents);
server.delete("/api/session-replay/:sessionId/:siteId", authSite, deleteSessionReplay);

// Sites
server.get("/api/sites/:siteId", publicSite, getSite);
server.post("/api/sites/:organizationId", orgAdminParams, addSite);
server.put("/api/sites/:siteId/config", adminSite, updateSiteConfig);
server.delete("/api/sites/:siteId", adminSite, deleteSite);
server.get("/api/sites/:siteId/private-link-config", adminSite, getSitePrivateLinkConfig);
server.post("/api/sites/:siteId/private-link-config", adminSite, updateSitePrivateLinkConfig);
server.get("/api/site/tracking-config/:siteId", getTrackingConfig); // Public - used by tracking script
server.get("/api/sites/:siteId/excluded-ips", authSite, getSiteExcludedIPs);
server.get("/api/sites/:siteId/excluded-countries", authSite, getSiteExcludedCountries);

// Site Imports
server.get("/api/sites/:siteId/imports", adminSite, getSiteImports);
server.post("/api/sites/:siteId/imports", adminSite, createSiteImport);
server.post("/api/sites/:siteId/imports/:importId/events", adminSite, batchImportEvents);
server.delete("/api/sites/:siteId/imports/:importId", adminSite, deleteSiteImport);

// Organizations
server.get("/api/organizations/:organizationId/sites", orgMember, getSitesFromOrg);
server.get("/api/organizations/:organizationId/members", orgMember, listOrganizationMembers);
server.post("/api/organizations/:organizationId/members", orgMember, addUserToOrganization);

// User
server.get("/api/config", getConfig); // Public - returns app config
server.get("/api/user/organizations", authOnly, getUserOrganizations);
server.post("/api/user/account-settings", authOnly, updateAccountSettings);
server.get("/api/user/api-keys", authOnly, listApiKeys);
server.post("/api/user/api-keys", authOnly, createApiKey);
server.delete("/api/user/api-keys/:keyId", authOnly, deleteApiKey);

// GOOGLE SEARCH CONSOLE
server.get("/api/gsc/connect/:siteId", authSite, connectGSC);
server.get("/api/gsc/callback", gscCallback); // Public - OAuth callback
server.get("/api/gsc/status/:siteId", publicSite, getGSCStatus);
server.delete("/api/gsc/disconnect/:siteId", authSite, disconnectGSC);
server.post("/api/gsc/select-property/:siteId", authSite, selectGSCProperty);
server.get("/api/gsc/data/:siteId", publicSite, getGSCData);

// UPTIME MONITORING
// Only register uptime routes when IS_CLOUD is true (Redis is available)
// if (IS_CLOUD) {
//   // Dynamically import uptime modules only when needed
//   const { getMonitors } = await import("./api/uptime/getMonitors.js");
//   const { getMonitor } = await import("./api/uptime/getMonitor.js");
//   const { createMonitor } = await import("./api/uptime/createMonitor.js");
//   const { updateMonitor } = await import("./api/uptime/updateMonitor.js");
//   const { deleteMonitor } = await import("./api/uptime/deleteMonitor.js");
//   const { getMonitorEvents } = await import("./api/uptime/getMonitorEvents.js");
//   const { getMonitorStats } = await import("./api/uptime/getMonitorStats.js");
//   const { getMonitorUptimeBuckets } = await import("./api/uptime/getMonitorUptimeBuckets.js");
//   const { getMonitorStatus } = await import("./api/uptime/getMonitorStatus.js");
//   const { getMonitorUptime } = await import("./api/uptime/getMonitorUptime.js");
//   const { getRegions } = await import("./api/uptime/getRegions.js");
//   const { incidentsRoutes } = await import("./api/uptime/incidents.js");
//   const { notificationRoutes } = await import("./api/uptime/notifications.js");

//   server.get("/api/uptime/monitors", getMonitors);
//   server.get("/api/uptime/monitors/:monitorId", getMonitor);
//   server.post("/api/uptime/monitors", createMonitor);
//   server.put("/api/uptime/monitors/:monitorId", updateMonitor);
//   server.delete("/api/uptime/monitors/:monitorId", deleteMonitor);
//   server.get("/api/uptime/monitors/:monitorId/events", getMonitorEvents);
//   server.get("/api/uptime/monitors/:monitorId/stats", getMonitorStats);
//   server.get("/api/uptime/monitors/:monitorId/status", getMonitorStatus);
//   server.get("/api/uptime/monitors/:monitorId/uptime", getMonitorUptime);
//   server.get("/api/uptime/monitors/:monitorId/buckets", getMonitorUptimeBuckets);
//   server.get("/api/uptime/regions", getRegions);

//   // Register incidents routes
//   server.register(incidentsRoutes);

//   // Register notification routes
//   server.register(notificationRoutes);
// }

// STRIPE & ADMIN

if (IS_CLOUD) {
  // Stripe Routes
  server.post("/api/stripe/create-checkout-session", authOnly, createCheckoutSession);
  server.post("/api/stripe/create-portal-session", authOnly, createPortalSession);
  server.post("/api/stripe/preview-subscription-update", authOnly, previewSubscriptionUpdate);
  server.post("/api/stripe/update-subscription", authOnly, updateSubscription);
  server.get("/api/stripe/subscription", authOnly, getSubscription);
  server.post("/api/stripe/webhook", { config: { rawBody: true } }, handleWebhook); // Public - Stripe webhook

  // Admin Routes
  server.get("/api/admin/sites", adminOnly, getAdminSites);
  server.get("/api/admin/organizations", adminOnly, getAdminOrganizations);
  server.get("/api/admin/service-event-count", adminOnly, getAdminServiceEventCount);
  server.post("/api/admin/telemetry", collectTelemetry); // Public - telemetry collection

  // AppSumo Routes
  const { activateAppSumoLicense } = await import("./api/as/activate.js");
  const { handleAppSumoWebhook } = await import("./api/as/webhook.js");

  server.post("/api/as/activate", authOnly, activateAppSumoLicense);
  server.post("/api/as/webhook", handleAppSumoWebhook); // Public - AppSumo webhook
}

server.post("/api/track", trackEvent);
server.post("/api/identify", handleIdentify);

server.get("/api/health", { logLevel: "silent" }, (_, reply) => reply.send("OK"));

const start = async () => {
  try {
    console.info("Starting server...");
    await Promise.all([initializeClickhouse(), initPostgres()]);

    telemetryService.startTelemetryCron();
    if (IS_CLOUD) {
      weeklyReportService.startWeeklyReportCron();
    }

    // Start the server first
    await server.listen({ port: 3001, host: "0.0.0.0" });
    server.log.info("Server is listening on http://0.0.0.0:3001");

    // Test Axiom logging
    if (hasAxiom) {
      server.log.info({ axiom: true, dataset: process.env.AXIOM_DATASET }, "Axiom logging is configured");
    }

    // if (process.env.NODE_ENV === "production") {
    //   // Initialize uptime monitoring service in the background (non-blocking)
    //   uptimeService
    //     .initialize()
    //     .then(() => {
    //       server.log.info("Uptime monitoring service initialized successfully");
    //     })
    //     .catch((error) => {
    //       server.log.error("Failed to initialize uptime service:", error);
    //       // Continue running without uptime monitoring
    //     });
    // }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    server.log.warn(`${signal} received during shutdown, forcing exit...`);
    process.exit(1);
  }

  isShuttingDown = true;
  server.log.info(`${signal} received, shutting down gracefully...`);

  // Set a timeout to force exit if shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    server.log.error("Shutdown timeout exceeded, forcing exit...");
    process.exit(1);
  }, 10000); // 10 second timeout

  try {
    // Stop accepting new connections
    await server.close();
    server.log.info("Server closed");

    // Shutdown uptime service
    // await uptimeService.shutdown();
    // server.log.info("Uptime service shut down");

    // Clear the timeout since we're done
    clearTimeout(forceExitTimeout);

    process.exit(0);
  } catch (error) {
    server.log.error(error, "Error during shutdown");
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

declare module "fastify" {
  interface FastifyRequest {
    user?: any; // Or define a more specific user type
  }
}
