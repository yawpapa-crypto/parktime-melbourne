import pg from "pg";

let pool: pg.Pool | null = null;

function poolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  const isRemote = Boolean(connectionString && !connectionString.includes("localhost"));
  return {
    connectionString,
    max: process.env.VERCEL ? 2 : 20,
    idleTimeoutMillis: process.env.VERCEL ? 10_000 : 30_000,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  };
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool(poolConfig());
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}
