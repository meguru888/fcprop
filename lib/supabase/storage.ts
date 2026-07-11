import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKETS = {
  icp: "icp-docs",
  client: "client-docs",
  benefitIllustration: "benefit-illustrations",
  productKb: "product-kb",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function assertUploadable(file: File) {
  if (file.size === 0) throw new Error("File is empty.");
  if (file.size > 20 * 1024 * 1024) throw new Error("File exceeds 20MB limit.");
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please upload a PDF or Word document.");
  }
}

export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: BucketName,
  file: File,
  pathPrefix: string,
): Promise<string> {
  assertUploadable(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${pathPrefix}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

export function publicUrl(supabase: SupabaseClient, bucket: BucketName, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
