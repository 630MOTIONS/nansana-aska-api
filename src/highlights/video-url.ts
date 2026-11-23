const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// Reads a video link. It must be a full https:// address. For YouTube links
// (youtube.com/watch, youtu.be, /shorts, /embed, /live) it also returns the
// video id and a clean standard address, so different spellings of the same
// link are stored the same way.
export function parseVideoUrl(
  raw: string,
): { url: string; youtubeId: string | null } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !url.hostname.includes(".")) return null;

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const match = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(url.pathname);
      id = match ? match[1] : null;
    }
  }

  if (id && YOUTUBE_ID.test(id)) {
    return { url: `https://www.youtube.com/watch?v=${id}`, youtubeId: id };
  }
  return { url: url.toString(), youtubeId: null };
}
