import { one, run, transaction } from "./db";
import { deliverPending } from "./email";
import { now } from "./utils";
import { transcodeVideo } from "./video";

let timer: NodeJS.Timeout | null = null;
let ticking = false;

export function startWorkers() {
  if (timer) return;
  timer = setInterval(() => { void tick(); }, 4000);
  if (typeof timer.unref === "function") timer.unref();
}

export async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    await deliverPending(3);
    const max = Number(process.env.MAX_CONCURRENT_TRANSCODES || 1);
    let claimed: any = null;
    await transaction(async () => {
      const running = await one<any>("SELECT COUNT(*) AS c FROM jobs WHERE type = 'transcode' AND status = 'processing'");
      if (Number(running?.c || 0) >= max) return;
      const job = await one<any>("SELECT * FROM jobs WHERE type = 'transcode' AND status = 'pending' AND run_at <= ? ORDER BY created_at LIMIT 1", [now()]);
      if (!job) return;
      const updated = await run("UPDATE jobs SET status = 'processing', updated_at = ? WHERE id = ? AND status = 'pending'", [now(), job.id]);
      if (updated.changes === 1) claimed = job;
    });
    if (claimed) {
      try {
        const payload = JSON.parse(claimed.payload || "{}");
        await transcodeVideo(payload.videoId);
        await run("UPDATE jobs SET status = 'done', updated_at = ? WHERE id = ?", [now(), claimed.id]);
      } catch (error) {
        const attempts = Number(claimed.attempts || 0) + 1;
        const message = error instanceof Error ? error.message : "Job failed";
        await run("UPDATE jobs SET status = ?, attempts = ?, last_error = ?, updated_at = ?, run_at = ? WHERE id = ?", [
          attempts >= 3 ? "failed" : "pending",
          attempts,
          message.slice(0, 500),
          now(),
          new Date(Date.now() + attempts * 60000).toISOString(),
          claimed.id,
        ]);
      }
    }
  } catch (error) {
    console.error("Background worker error");
  } finally {
    ticking = false;
  }
}
