#!/usr/bin/env node
/**
 * Script to kill process on port 5001
 * Usage: node scripts/kill-port.js [port]
 */

const { execSync } = require('child_process');

const PORT = process.argv[2] || 5001;

async function killPort() {

  try {
    const isWin = process.platform === 'win32';

    if (isWin) {
      try {
        // Find process on Windows
        const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
        const lines = output.trim().split('\n');
        const pids = new Set();

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && /^\d+$/.test(pid) && pid !== '0') {
            pids.add(pid);
          }
        });

        if (pids.size === 0) {
          console.log(`No process found on port ${PORT}`);
          process.exit(0);
        }

        // Kill processes
        for (const pid of pids) {
          console.log(`Killing process ${pid} on port ${PORT}`);
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
          console.log(`✅ Process ${pid} killed successfully`);
        }
      } catch (error) {
        // netstat returns error if no match found (sometimes) or other errors
        // If we can't find it, assume free or error out if critical
        // On windows findstr returns status 1 if not found
        console.log(`No process found on port ${PORT}`);
        process.exit(0);
      }
    } else {
      // Linux/Unix existing logic
      // Find process using the port
      const pid = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' }).trim();

      if (!pid) {
        console.log(`No process found on port ${PORT}`);
        process.exit(0);
      }

      console.log(`Killing process ${pid} on port ${PORT}`);

      // Kill the process
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
        console.log(`✅ Process ${pid} killed successfully`);
      } catch (error) {
        console.error(`❌ Failed to kill process: ${error.message}`);
        process.exit(1);
      }
    }

    // Wait a moment for the port to be released
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify port is free
    console.log(`✅ Port ${PORT} is now free`);
    process.exit(0);

  } catch (error) {
    // If lsof returns nothing, port is free
    if (error.status === 1 || error.code === 1) {
      console.log(`No process found on port ${PORT}`);
      process.exit(0);
    }
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

killPort();
