import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

let cachedClient: S3Client | null = null;

function envTrim(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw == null || raw === "") return defaultValue;
  const t = raw.toLowerCase();
  if (["1", "true", "yes", "on"].includes(t)) return true;
  if (["0", "false", "no", "off"].includes(t)) return false;
  return defaultValue;
}

/** True when all required Railway / S3-compatible bucket settings are present. */
export function objectStorageConfigured(): boolean {
  return Boolean(
    envTrim("OBJECT_STORAGE_ENDPOINT") &&
      envTrim("OBJECT_STORAGE_BUCKET") &&
      envTrim("OBJECT_STORAGE_ACCESS_KEY_ID") &&
      envTrim("OBJECT_STORAGE_SECRET_ACCESS_KEY"),
  );
}

function getBucket(): string {
  const b = envTrim("OBJECT_STORAGE_BUCKET");
  if (!b) throw new Error("OBJECT_STORAGE_BUCKET is not set");
  return b;
}

export function getObjectStorageClient(): S3Client {
  if (!objectStorageConfigured()) {
    throw new Error("Object storage env is incomplete");
  }
  if (!cachedClient) {
    const endpoint = envTrim("OBJECT_STORAGE_ENDPOINT")!;
    const region = envTrim("OBJECT_STORAGE_REGION") || "auto";
    const accessKeyId = envTrim("OBJECT_STORAGE_ACCESS_KEY_ID")!;
    const secretAccessKey = envTrim("OBJECT_STORAGE_SECRET_ACCESS_KEY")!;
    const forcePathStyle = parseBool(envTrim("OBJECT_STORAGE_FORCE_PATH_STYLE"), true);

    cachedClient = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    });
  }
  return cachedClient;
}

export async function putUploadObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const client = getObjectStorageClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

function isS3NotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return (
    o.name === "NoSuchKey" ||
    o.name === "NotFound" ||
    o.Code === "NoSuchKey" ||
    o.$metadata?.httpStatusCode === 404
  );
}

function bodyAsReadable(body: unknown): Readable | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { pipe?: (dest: NodeJS.WritableStream) => unknown };
  if (typeof b.pipe === "function") {
    return body as Readable;
  }
  return null;
}

export async function getUploadObjectForResponse(key: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength?: number;
} | null> {
  const client = getObjectStorageClient();
  try {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );
    const stream = bodyAsReadable(out.Body);
    if (!stream) return null;
    const contentType = out.ContentType || "application/octet-stream";
    const contentLength = out.ContentLength;
    return { stream, contentType, contentLength };
  } catch (err) {
    if (isS3NotFound(err)) return null;
    throw err;
  }
}

export async function headUploadObject(key: string): Promise<{
  contentType: string;
  contentLength?: number;
} | null> {
  const client = getObjectStorageClient();
  try {
    const out = await client.send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );
    return {
      contentType: out.ContentType || "application/octet-stream",
      contentLength: out.ContentLength,
    };
  } catch (err) {
    if (isS3NotFound(err)) return null;
    throw err;
  }
}

/** Reject path traversal and empty segments. */
export function isSafeUploadRelativePath(rel: string): boolean {
  if (!rel || rel === "." || rel.startsWith("/")) return false;
  const segments = rel.split("/");
  for (const seg of segments) {
    if (seg === "" || seg === "." || seg === "..") return false;
    if (seg.includes("\0")) return false;
  }
  return true;
}
