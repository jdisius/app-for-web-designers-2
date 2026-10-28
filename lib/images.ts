import { createClient } from "@/lib/supabase/client";
import { thumbPathOf } from "@/lib/storage-paths";

// Browser-only: downscale, compress and upload straight to Storage (Server Actions and Vercel have small body limits).
const FULL_MAX = 1600;
const THUMB_MAX = 400;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ImageError extends Error {}

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));

function draw(bitmap: ImageBitmap, max: number) {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// WebP, or JPEG when the browser cannot encode WebP (it then returns a PNG blob, so check the type).
async function encode(bitmap: ImageBitmap) {
  const full = draw(bitmap, FULL_MAX);
  let blob = await toBlob(full, "image/webp");
  if (blob?.type !== "image/webp") blob = await toBlob(full, "image/jpeg");
  if (!blob) throw new ImageError("Obrázek se nepodařilo zpracovat.");

  const thumb = await toBlob(draw(bitmap, THUMB_MAX), blob.type);
  if (!thumb) throw new ImageError("Obrázek se nepodařilo zpracovat.");

  return { full: blob, thumb, ext: blob.type === "image/webp" ? "webp" : "jpg" };
}

// Uploads the image and its thumbnail; returns the image path (the thumbnail path is derived from it).
export async function uploadImage(bucket: "portfolio" | "briefs", file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new ImageError("Podporované jsou jen soubory JPG, PNG a WebP.");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImageError("Obrázek se nepodařilo načíst.");
  });
  const { full, thumb, ext } = await encode(bitmap);
  bitmap.close();

  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new ImageError("Nejste přihlášeni.");

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const storage = supabase.storage.from(bucket);
  const fullUpload = await storage.upload(path, full, { contentType: full.type, upsert: false });
  if (fullUpload.error) throw new ImageError("Obrázek se nepodařilo nahrát.");

  const thumbUpload = await storage.upload(thumbPathOf(path), thumb, { contentType: thumb.type, upsert: false });
  if (thumbUpload.error) {
    await storage.remove([path]);
    throw new ImageError("Obrázek se nepodařilo nahrát.");
  }

  return path;
}
