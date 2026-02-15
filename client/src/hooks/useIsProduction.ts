export function useAppEnv() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  if (hostname === "demo.buddystat.com") {
    return "demo";
  }
  if (hostname === "app.buddystat.com") {
    return "prod";
  }

  return null;
}
