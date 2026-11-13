export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ready } = await import("./lib/db");
    const { startWorkers } = await import("./lib/jobs");
    await ready();
    startWorkers();
  }
}
