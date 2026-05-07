/**
 * Quick health check for local dev (no curl required).
 */
async function check(url, label) {
    try {
        const res = await fetch(url, { redirect: 'manual' });
        console.log(`${label}: HTTP ${res.status}`);
        return res.ok || res.status === 307 || res.status === 302;
    }
    catch (err) {
        console.error(`${label}: failed — ${err instanceof Error ? err.message : String(err)}`);
        return false;
    }
}

(async () => {
    const api = await check('http://127.0.0.1:3000/api/health', 'API (3000)');
    const web = await check('http://127.0.0.1:3001/', 'Web (3001)');
    if (!api || !web) {
        console.error('\nServers do not appear to be running. From repo root: npm run dev\n');
        process.exit(1);
    }
    console.log('\nOK — open http://localhost:3001 in your browser.\n');
})();
