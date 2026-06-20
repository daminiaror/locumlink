const { Client } = require('pg');

const candidates = [
  'postgresql://postgres:postgres@127.0.0.1:5433/postgres',
  'postgresql://postgres:postgres@127.0.0.1:5433/l2_db',
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  'postgresql://postgres@127.0.0.1:5432/postgres',
];

(async () => {
  for (const url of candidates) {
    const c = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
    try {
      await c.connect();
      const r = await c.query('SELECT current_database() AS db, version() AS v');
      console.log('OK', url.replace(/:[^:@]+@/, ':****@'), r.rows[0].db);
      await c.end();
    } catch (e) {
      console.log('FAIL', url.replace(/:[^:@]+@/, ':****@'), e.code || '', e.message);
    }
  }
})();
