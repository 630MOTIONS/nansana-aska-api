export function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Line endings differ between systems. Store them one way.
export function normalizeBody(body: string): string {
  return body.replace(/\r\n?/g, "\n").trimEnd();
}

// What an article needs before it can be published, or null when it is ready.
export function missingForPublish(input: {
  title: string;
  excerpt: string;
  body: string;
}): string | null {
  if (input.title.trim().length < 3) return "Add a title before publishing.";
  if (input.excerpt.trim().length < 10) {
    return "Add a short summary (at least 10 characters) before publishing.";
  }
  if (input.body.trim().length < 20) {
    return "Write the article text before publishing.";
  }
  return null;
}

// The ids of the photos a Markdown body points to (/media/<id>).
export function extractMediaIds(body: string): string[] {
  const ids = new Set<string>();
  for (const match of body.matchAll(/\/media\/([a-z0-9]+)/g)) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}
