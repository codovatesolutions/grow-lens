import cron from 'node-cron';
import { pool } from '../db';
import { executeScheduledJob } from './social.service';

let schedulerStarted = false;

export function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Run every minute — poll for due jobs
  cron.schedule('* * * * *', async () => {
    try {
      const { rows: dueJobs } = await pool.query(
        `SELECT id FROM scheduled_jobs
         WHERE status = 'pending' AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT 20`,
        []
      );

      if (dueJobs.length === 0) return;

      console.log(`[Scheduler] Processing ${dueJobs.length} due job(s)...`);

      // Process jobs sequentially to avoid DB contention
      for (const job of dueJobs) {
        try {
          await executeScheduledJob(job.id);
          console.log(`[Scheduler] Job ${job.id} completed`);
        } catch (err) {
          console.error(`[Scheduler] Job ${job.id} failed:`, err);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Poll error:', err);
    }
  });

  // Every 15 minutes — retry failed jobs (up to 3 attempts)
  cron.schedule('*/15 * * * *', async () => {
    try {
      await pool.query(
        `UPDATE scheduled_jobs SET status = 'pending', updated_at = NOW()
         WHERE status = 'failed' AND attempts < 3 AND updated_at < NOW() - INTERVAL '10 minutes'`
      );
    } catch (err) {
      console.error('[Scheduler] Retry reset error:', err);
    }
  });

  // Every hour — clean up expired OAuth states and old completed jobs
  cron.schedule('0 * * * *', async () => {
    try {
      await pool.query(`DELETE FROM oauth_states WHERE created_at < NOW() - INTERVAL '1 hour'`);
      await pool.query(
        `DELETE FROM scheduled_jobs WHERE status IN ('done','cancelled') AND updated_at < NOW() - INTERVAL '7 days'`
      );
    } catch (err) {
      console.error('[Scheduler] Cleanup error:', err);
    }
  });

  console.log('[Scheduler] Started — polling every minute for due jobs');
}
