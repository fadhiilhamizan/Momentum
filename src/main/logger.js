/** logger.js — appends timestamped diagnostics to a log file in userData. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');

let logPath = null;
function resolvePath() {
  if (logPath) return logPath;
  try {
    logPath = path.join(app.getPath('userData'), 'momentum-main.log');
  } catch (_) {
    logPath = path.join(os.tmpdir(), 'momentum-main.log');
  }
  return logPath;
}

function fmt(a) {
  if (a instanceof Error) return a.stack || a.message;
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a);
    } catch (_) {
      return String(a);
    }
  }
  return String(a);
}

function log(...args) {
  try {
    const line = `[${new Date().toISOString()}] ${args.map(fmt).join(' ')}\n`;
    fs.appendFileSync(resolvePath(), line);
  } catch (_) {
    /* logging must never throw */
  }
  // Also echo to stdout for `npm start` visibility.
   
  console.log('[momentum]', ...args);
}

module.exports = { log, logFilePath: resolvePath };
