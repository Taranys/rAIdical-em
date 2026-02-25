#!/usr/bin/env node
// Dev DB snapshot/restore — keeps your local dev data safe across worktrees/branches.
// Snapshots are stored in data/snapshots/ (gitignored).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "rAIdical-em.db");
const SNAPSHOTS_DIR = path.join(__dirname, "..", "data", "snapshots");

const [command, name = "default"] = process.argv.slice(2);

function ensureSnapshotsDir() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

function snapshotPath(snapshotName) {
  return path.join(SNAPSHOTS_DIR, `${snapshotName}.db`);
}

function save() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Error: No database found at", DB_PATH);
    console.error("Start the dev server first to create the database.");
    process.exit(1);
  }
  ensureSnapshotsDir();
  const dest = snapshotPath(name);
  fs.copyFileSync(DB_PATH, dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`Snapshot saved: ${name} (${size} KB)`);
}

function restore() {
  const src = snapshotPath(name);
  if (!fs.existsSync(src)) {
    console.error(`Error: Snapshot "${name}" not found.`);
    console.error("Available snapshots:");
    list();
    process.exit(1);
  }
  // Ensure data/ directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.copyFileSync(src, DB_PATH);
  const size = (fs.statSync(DB_PATH).size / 1024).toFixed(1);
  console.log(`Snapshot restored: ${name} (${size} KB)`);
}

function list() {
  ensureSnapshotsDir();
  const files = fs.readdirSync(SNAPSHOTS_DIR).filter((f) => f.endsWith(".db"));
  if (files.length === 0) {
    console.log("No snapshots found.");
    return;
  }
  console.log("Available snapshots:\n");
  for (const file of files) {
    const filePath = path.join(SNAPSHOTS_DIR, file);
    const stat = fs.statSync(filePath);
    const size = (stat.size / 1024).toFixed(1);
    const date = stat.mtime.toLocaleString();
    const snapshotName = file.replace(/\.db$/, "");
    console.log(`  ${snapshotName.padEnd(20)} ${size.padStart(8)} KB   ${date}`);
  }
}

switch (command) {
  case "save":
    save();
    break;
  case "restore":
    restore();
    break;
  case "list":
    list();
    break;
  default:
    console.log("Usage: node scripts/db-snapshot.mjs <command> [name]");
    console.log("");
    console.log("Commands:");
    console.log("  save [name]     Save current DB as a snapshot (default: \"default\")");
    console.log("  restore [name]  Restore a snapshot to the DB (default: \"default\")");
    console.log("  list            List available snapshots");
    process.exit(1);
}
