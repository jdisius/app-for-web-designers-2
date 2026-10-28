// Pure helpers shared by browser and server code (no imports, so Node can run them in tests).
// Paths look like {user_id}/{uuid}.{ext} with a thumbnail at {user_id}/{uuid}_thumb.{ext}.
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const IMAGE_PATH = new RegExp(`^(${UUID})/${UUID}\\.(webp|jpg)$`);

export const thumbPathOf = (path: string) => path.replace(/\.(webp|jpg)$/, "_thumb.$1");

// True only for a well-formed image path inside the given user's own folder.
export function isOwnImagePath(userId: string, path: string) {
  const match = IMAGE_PATH.exec(path);
  return match !== null && match[1] === userId;
}
