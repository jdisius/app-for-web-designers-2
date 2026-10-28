import type { SupabaseClient } from "@supabase/supabase-js";

// One call for many paths; signed URLs are never stored. Returns a path -> URL map.
export async function signedUrls(supabase: SupabaseClient, bucket: "portfolio" | "briefs", paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
  data?.forEach((item) => {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  });
  return urls;
}
