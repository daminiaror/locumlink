/**
 * Free dev listen ports. Avoids hung Get-NetTCPConnection on some hosts; skips TaskKill when no PID (kill-port hangs there).
 */
const { execSync } = require('node:child_process');

const ports = process.argv.slice(2).length
    ? process.argv.slice(2).map(Number).filter(Boolean)
    : [3000, 3001];

function killPortWin(port) {
    const raw = execSync('netstat -ano', { encoding: 'utf8', windowsHide: true });
    const pids = new Set();
    for (const line of raw.split('\n')) {
        if (!/\sLISTENING\s/.test(line)) {
            continue;
        }
        if (!new RegExp(`:${port}\\s`).test(line)) {
            continue;
        }
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (Number.isFinite(pid)) {
            pids.add(pid);
        }
    }
    if (pids.size === 0) {
        console.log(`Port ${port} already free`);
        return;
    }
    for (const pid of pids) {
        try {
            execSync(`taskkill /F /PID ${pid}`, {
                stdio: 'inherit',
                windowsHide: true,
            });
        }
        catch {
            /* process already exited */
        }
    }
    console.log(`Freed port ${port} (PIDs ${[...pids].join(', ')})`);
}

if (process.platform === 'win32') {
    for (const p of ports) {
        killPortWin(p);
    }
}
else {
    for (const p of ports) {
        try {
            execSync(`npx kill-port ${p}`, { stdio: 'inherit' });
        }
        catch {
            /* port already free */
        }
    }
}
