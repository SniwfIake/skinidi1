import {
  searchAnime,
  getTrending,
  getAiring,
  getPopular,
  getAnimeById,
  getEpisodes,
} from './anilist.js';
import {
  searchStreaming,
  getStreamingEpisodes,
  getStreamingSources,
} from './streaming.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200, cacheSeconds = 300) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS,
      'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
    },
  });
}

// Simple in-memory cache (lives per Worker instance — good enough for most cases)
const memoryCache = new Map();

async function cached(key, ttlSeconds, fetchFn) {
  const now = Date.now();
  const hit = memoryCache.get(key);
  if (hit && hit.expires > now) {
    return { data: hit.data, cached: true };
  }
  const data = await fetchFn();
  memoryCache.set(key, { data, expires: now + ttlSeconds * 1000 });
  return { data, cached: false };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    try {
      // ── / ── Docs
      if (path === '/') {
        return json({
          name: 'Anime API',
          version: '1.0.0',
          endpoints: {
            trending: '/trending?page=1&perPage=20',
            airing: '/airing?page=1&perPage=20',
            popular: '/popular?page=1&perPage=20',
            search: '/search?q=naruto&page=1',
            anime: '/anime/:id',
            episodes: '/episodes/:id',
            streamSearch: '/stream/search?title=naruto',
            streamEpisodes: '/stream/episodes/:gogoId',
            streamSources: '/stream/sources/:episodeId',
          },
        }, 200, 60);
      }

      // ── /trending ──
      if (path === '/trending') {
        const page = parseInt(params.get('page') || '1');
        const perPage = parseInt(params.get('perPage') || '20');
        const { data, cached: hit } = await cached(
          `trending:${page}:${perPage}`,
          300,
          () => getTrending(page, perPage)
        );
        return json(data, 200, 300);
      }

      // ── /airing ──
      if (path === '/airing') {
        const page = parseInt(params.get('page') || '1');
        const perPage = parseInt(params.get('perPage') || '20');
        const { data } = await cached(
          `airing:${page}:${perPage}`,
          300,
          () => getAiring(page, perPage)
        );
        return json(data, 200, 300);
      }

      // ── /popular ──
      if (path === '/popular') {
        const page = parseInt(params.get('page') || '1');
        const perPage = parseInt(params.get('perPage') || '20');
        const { data } = await cached(
          `popular:${page}:${perPage}`,
          600,
          () => getPopular(page, perPage)
        );
        return json(data, 200, 600);
      }

      // ── /search?q= ──
      if (path === '/search') {
        const q = params.get('q');
        if (!q) return json({ error: 'Missing ?q=' }, 400);
        const page = parseInt(params.get('page') || '1');
        const perPage = parseInt(params.get('perPage') || '20');
        const { data } = await cached(
          `search:${q}:${page}:${perPage}`,
          300,
          () => searchAnime(q, page, perPage)
        );
        return json(data, 200, 300);
      }

      // ── /anime/:id ──
      const animeMatch = path.match(/^\/anime\/(\d+)$/);
      if (animeMatch) {
        const id = parseInt(animeMatch[1]);
        const { data } = await cached(
          `anime:${id}`,
          3600,
          () => getAnimeById(id)
        );
        return json(data, 200, 3600);
      }

      // ── /episodes/:id ──
      const epMatch = path.match(/^\/episodes\/(\d+)$/);
      if (epMatch) {
        const id = parseInt(epMatch[1]);
        const { data } = await cached(
          `episodes:${id}`,
          1800,
          () => getEpisodes(id)
        );
        return json(data, 200, 1800);
      }

      // ── /stream/search?title= ──
      if (path === '/stream/search') {
        const title = params.get('title');
        if (!title) return json({ error: 'Missing ?title=' }, 400);
        const { data } = await cached(
          `ssearch:${title}`,
          600,
          () => searchStreaming(title)
        );
        return json(data, 200, 600);
      }

      // ── /stream/episodes/:gogoId ──
      const sEpMatch = path.match(/^\/stream\/episodes\/(.+)$/);
      if (sEpMatch) {
        const id = decodeURIComponent(sEpMatch[1]);
        const { data } = await cached(
          `sep:${id}`,
          1800,
          () => getStreamingEpisodes(id)
        );
        return json(data, 200, 1800);
      }

      // ── /stream/sources/:episodeId ──
      const sSrcMatch = path.match(/^\/stream\/sources\/(.+)$/);
      if (sSrcMatch) {
        const id = decodeURIComponent(sSrcMatch[1]);
        const { data } = await cached(
          `ssrc:${id}`,
          600,
          () => getStreamingSources(id)
        );
        return json(data, 200, 600);
      }

      return json({ error: 'Not found', path }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
