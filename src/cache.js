export async function cachedJson(env, key, ttl, fetchFn) {
  // If KV is not available, just fetch fresh (Cloudflare's built-in cache still works)
  if (!env || !env.ANIME_CACHE) {
    const data = await fetchFn();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'BYPASS' },
    });
  }

  const cacheKey = `cache:${key}`;
  const cached = await env.ANIME_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const data = await fetchFn();
  const body = JSON.stringify(data);
  await env.ANIME_CACHE.put(cacheKey, body, { expirationTtl: ttl });

  return new Response(body, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  });
}
