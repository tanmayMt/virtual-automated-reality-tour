/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeRoomId(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String(raw.$oid);
  }
  return String(raw);
}

/**
 * Image URLs for rooms directly linked via navigation hotspots from `fromRoomId`.
 * @param {Array<{ _id: unknown, imageUrl?: string, hotspots?: unknown[] }>} rooms
 * @param {string | null | undefined} fromRoomId
 * @returns {string[]}
 */
export function collectNavigationTargetImageUrls(rooms, fromRoomId) {
  if (!Array.isArray(rooms) || !fromRoomId) {
    return [];
  }
  const byId = new Map(rooms.map((r) => [String(r._id), r]));
  const room = byId.get(String(fromRoomId));
  if (!room || !Array.isArray(room.hotspots)) {
    return [];
  }
  const urls = [];
  for (const h of room.hotspots) {
    if (h?.type !== 'navigation') {
      continue;
    }
    const tid = normalizeRoomId(h.targetRoomId);
    if (!tid) {
      continue;
    }
    const target = byId.get(tid);
    const url = target?.imageUrl;
    if (typeof url === 'string' && url.length > 0) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

/**
 * All panorama URLs reachable via any navigation hotspot in the tour (full nav graph edges).
 * @param {Array<{ _id: unknown, imageUrl?: string, hotspots?: unknown[] }>} rooms
 * @returns {string[]}
 */
export function collectAllNavigationTargetImageUrls(rooms) {
  if (!Array.isArray(rooms)) {
    return [];
  }
  const byId = new Map(rooms.map((r) => [String(r._id), r]));
  const urls = new Set();
  for (const room of rooms) {
    if (!Array.isArray(room.hotspots)) {
      continue;
    }
    for (const h of room.hotspots) {
      if (h?.type !== 'navigation') {
        continue;
      }
      const tid = normalizeRoomId(h.targetRoomId);
      if (!tid) {
        continue;
      }
      const target = byId.get(tid);
      const url = target?.imageUrl;
      if (typeof url === 'string' && url.length > 0) {
        urls.add(url);
      }
    }
  }
  return [...urls];
}

/**
 * Silently preload images; skips URLs already in `cache`.
 * @param {string[]} urls
 * @param {Set<string>} cache
 */
export function preloadPanoramaImages(urls, cache) {
  if (!Array.isArray(urls)) {
    return;
  }
  for (const url of urls) {
    if (!url || cache.has(url)) {
      continue;
    }
    cache.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.src = url;
  }
}
