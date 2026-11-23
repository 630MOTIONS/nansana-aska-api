const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_BYTES = 3 * 1024 * 1024;

// Downloads a YouTube video's thumbnail. The address is built from a fixed host
// and a validated 11-character id, so no visitor-supplied address is ever
// fetched. Returns null when nothing usable is found.
export async function fetchYoutubeThumbnail(id: string): Promise<Buffer | null> {
  if (!YOUTUBE_ID.test(id)) return null;

  for (const name of ["maxresdefault", "hqdefault"]) {
    try {
      const response = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;

      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > MAX_BYTES) continue;

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0 || bytes.length > MAX_BYTES) continue;
      return bytes;
    } catch {
      continue;
    }
  }
  return null;
}
