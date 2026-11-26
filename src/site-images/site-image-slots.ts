// The places on the website that show a photo chosen in the admin. To add a
// place, add its key here and in the site's src/lib/admin/site-image-slots.ts.
export const SITE_IMAGE_KEYS = [
  "about_hero",
  "about_milestone",
  "contact_hero",
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_KEYS)[number];

export function isSiteImageKey(value: string): value is SiteImageKey {
  return (SITE_IMAGE_KEYS as readonly string[]).includes(value);
}
