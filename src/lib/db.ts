import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'ledger.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_url TEXT NOT NULL,
    deploy_url TEXT,
    complexity_score INTEGER,
    languages TEXT,
    deployment_status TEXT,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface Verification {
  id?: number;
  repo_url: string;
  deploy_url?: string;
  complexity_score?: number;
  languages?: string;
  deployment_status?: string;
  verified_at?: string;
}

export const insertVerification = (verification: Verification) => {
  const stmt = db.prepare(`
    INSERT INTO verifications (repo_url, deploy_url, complexity_score, languages, deployment_status)
    VALUES (@repo_url, @deploy_url, @complexity_score, @languages, @deployment_status)
  `);
  return stmt.run(verification);
};

export const getRecentVerifications = () => {
  const stmt = db.prepare(`
    SELECT * FROM verifications ORDER BY verified_at DESC LIMIT 10
  `);
  return stmt.all() as Verification[];
};

export default db;
