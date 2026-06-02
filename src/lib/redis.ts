import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export const redis = globalForRedis.redis ?? createRedis();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

const PREFIX = "el:";

function serialize(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    typeof v === "bigint" ? Number(v) : v
  );
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) return fn();
  const raw = await redis.get<string>(PREFIX + key);
  if (raw != null) return JSON.parse(raw) as T;
  const result = await fn();
  await redis.setex(PREFIX + key, ttlSeconds, serialize(result));
  return result;
}

export async function bust(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  await redis.del(...keys.map((k) => PREFIX + k));
}
