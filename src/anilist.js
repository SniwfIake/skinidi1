const ANILIST_URL = 'https://graphql.anilist.co';

// Change this to something unique to your app — AniList uses it to identify you
const USER_AGENT = 'AnglerAnimeAPI/1.0 (https://skibiditoilet.anonmus232.workers.dev)';

export async function fetchAniList(query, variables = {}) {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  // Surface AniList errors cleanly
  if (data.errors) {
    return { errors: data.errors, data: null };
  }

  return data;
}

// ── Search anime ──
export async function searchAnime(query, page = 1, perPage = 20) {
  const gql = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large medium color }
          bannerImage
          genres
          averageScore
          popularity
          episodes
          duration
          status
          season
          seasonYear
          format
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;
  return fetchAniList(gql, { search: query, page, perPage });
}

// ── Trending ──
export async function getTrending(page = 1, perPage = 20) {
  const gql = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, sort: TRENDING_DESC, status_in: [RELEASING, FINISHED]) {
          id
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large medium color }
          bannerImage
          genres
          averageScore
          popularity
          episodes
          status
          seasonYear
          format
        }
      }
    }
  `;
  return fetchAniList(gql, { page, perPage });
}

// ── Currently Airing ──
export async function getAiring(page = 1, perPage = 20) {
  const gql = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large medium color }
          bannerImage
          genres
          averageScore
          popularity
          episodes
          nextAiringEpisode { episode airingAt timeUntilAiring }
          status
          seasonYear
          format
        }
      }
    }
  `;
  return fetchAniList(gql, { page, perPage });
}

// ── Popular ──
export async function getPopular(page = 1, perPage = 20) {
  const gql = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large medium color }
          bannerImage
          genres
          averageScore
          popularity
          episodes
          status
          seasonYear
          format
        }
      }
    }
  `;
  return fetchAniList(gql, { page, perPage });
}

// ── Anime details by ID ──
export async function getAnimeById(id) {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        coverImage { extraLarge large medium color }
        bannerImage
        genres
        averageScore
        popularity
        favourites
        episodes
        duration
        status
        season
        seasonYear
        format
        source
        studios(isMain: true) { nodes { name } }
        staff(perPage: 5) { nodes { name { full } } }
        characters(perPage: 10, sort: ROLE) {
          nodes { name { full } image { medium } }
        }
        relations {
          edges {
            relationType
            node { id title { romaji } coverImage { medium } }
          }
        }
        recommendations(perPage: 5) {
          nodes {
            mediaRecommendation { id title { romaji } coverImage { medium } }
          }
        }
      }
    }
  `;
  return fetchAniList(gql, { id });
}

// ── Episode list ──
export async function getEpisodes(animeId) {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        episodes
        duration
        status
        nextAiringEpisode { episode airingAt timeUntilAiring }
        airingSchedule(perPage: 100) {
          nodes { episode airingAt timeUntilAiring }
        }
      }
    }
  `;
  return fetchAniList(gql, { id: animeId });
}
