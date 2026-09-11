// Multiple mirror endpoints for reliability
const MIRRORS = [
  'https://api.consumet.org/anime/gogoanime',
  'https://consumet-api.vercel.app/anime/gogoanime',
  'https://consumet-api-production.up.railway.app/anime/gogoanime',
];

async function tryMirrors(path) {
  for (const base of MIRRORS) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      continue;
    }
  }
  return null;
}

// ── Search Gogo (for streaming ID) ──
export async function searchStreaming(title) {
  return tryMirrors(`/search?keyw=${encodeURIComponent(title)}`);
}

// ── Get streaming episodes by Gogo ID ──
export async function getStreamingEpisodes(gogoId) {
  return tryMirrors(`/info/${gogoId}`);
}

// ── Get streamable sources for an episode ──
export async function getStreamingSources(episodeId) {
  return tryMirrors(`/watch/${episodeId}`);
}
