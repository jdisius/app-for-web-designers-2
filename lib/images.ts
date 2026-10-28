import { createClient } from "@/lib/supabase/client";
import { thumbPathOf } from "@/lib/storage-paths";

// Browser-only: downscale, compress and upload straight to Storage (Server Actions and Vercel have small body limits).
const FULL_MAX = 1600;
const THUMB_MAX = 400;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ImageError extends Error {}

// crypto.randomUUID() only exists in secure contexts (HTTPS/localhost), not on http://<LAN ip> during phone testing.
function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

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
export async function uploadImage(bucket: "portfolio" | "briefs", userId: string, file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new ImageError("Podporované jsou jen soubory JPG, PNG a WebP.");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImageError("Obrázek se nepodařilo načíst.");
  });
  const { full, thumb, ext } = await encode(bitmap);
  bitmap.close();

  const path = `${userId}/${uuid()}.${ext}`;
  const storage = createClient().storage.from(bucket);
  const fullUpload = await storage.upload(path, full, { contentType: full.type, upsert: false });
  if (fullUpload.error) throw new ImageError("Obrázek se nepodařilo nahrát.");

  const thumbUpload = await storage.upload(thumbPathOf(path), thumb, { contentType: thumb.type, upsert: false });
  if (thumbUpload.error) {
    await storage.remove([path]);
    throw new ImageError("Obrázek se nepodařilo nahrát.");
  }

  return path;
}
