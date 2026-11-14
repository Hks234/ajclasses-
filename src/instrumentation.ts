export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ready } = await import("./lib/db");
      const { startWorkers } = await import("./lib/jobs");
      await ready();
      if (!process.env.VERCEL) startWorkers();
    } catch (error) {
      console.error("[aj-classes] Database startup failed. Check DATABASE_URL, SSL, and that the TiDB cluster is awake.");
      console.error(error);
    }
  }
}
