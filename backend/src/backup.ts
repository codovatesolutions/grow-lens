import { pool } from './db';
import fs from 'fs';
import path from 'path';

export async function backupDatabase(outputDir?: string): Promise<string> {
  const dir = outputDir || path.join(__dirname, '../backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(dir, `backup_${timestamp}.json`);

  const tables = ['users', 'scans', 'scan_jobs', 'tasks', 'activity', 'content_plans', 'usage_records', 'subscriptions', 'oauth_states'];
  const backupData: Record<string, any[]> = {};

  const client = await pool.connect();
  try {
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT * FROM ${table}`);
        backupData[table] = res.rows;
      } catch (err) {
        // Table might not exist yet
        backupData[table] = [];
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`Automated DB Backup saved successfully to ${backupFile}`);
    return backupFile;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  backupDatabase()
    .then(file => console.log(`Backup completed: ${file}`))
    .catch(err => console.error('Backup failed:', err));
}
