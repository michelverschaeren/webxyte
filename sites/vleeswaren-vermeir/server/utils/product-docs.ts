import type { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * Opslag van de productfiches (PDF) in een S3-compatibele bucket (Neon Object
 * Storage). Een serverless functie heeft geen blijvende schijf, dus op Vercel
 * is dit de enige plek waar een upload een deploy overleeft. Bewust niet onder
 * public/: ~900 PDF's (250 MB) kostten daar zo'n 8 minuten bouwtijd.
 *
 * De bucket moet `private` zijn: een fiche verraadt de fabrikant van het
 * artikel en mag enkel via /docs/products/:file (met login) naar buiten.
 *
 * Bewust eigen `S3_*`-namen en niet de `AWS_*`-namen uit de Neon-docs: Vercel
 * reserveert die (AWS_REGION, AWS_ACCESS_KEY_ID, …) voor zijn eigen runtime.
 *
 * Geen Nuxt/Nitro-imports: ook het importscript (tsx) gebruikt dit bestand.
 */
export const DOCS_KEY_PREFIX = "products/";

export function docsBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET ontbreekt: de productfiches staan in de bucket.");
  return bucket;
}

let client: S3Client | undefined;

export function docsS3Client(): S3Client {
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error(
      "S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID of S3_SECRET_ACCESS_KEY ontbreekt.",
    );
  }
  client ??= new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    // Neon kent enkel path-style adressen en geen verplichte checksums.
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return client;
}

export interface ProductDoc {
  stream: Readable | ReadableStream;
  size: number;
  lastModified: Date;
}

export async function readProductDoc(file: string): Promise<ProductDoc | null> {
  try {
    const result = await docsS3Client().send(
      new GetObjectCommand({ Bucket: docsBucket(), Key: `${DOCS_KEY_PREFIX}${file}` }),
    );
    if (!result.Body) return null;
    return {
      stream: result.Body.transformToWebStream(),
      size: result.ContentLength ?? 0,
      lastModified: result.LastModified ?? new Date(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "NoSuchKey") return null;
    throw error;
  }
}

export async function writeProductDoc(file: string, data: Buffer): Promise<void> {
  await docsS3Client().send(
    new PutObjectCommand({
      Bucket: docsBucket(),
      Key: `${DOCS_KEY_PREFIX}${file}`,
      Body: data,
      ContentType: "application/pdf",
    }),
  );
}

export async function deleteProductDoc(file: string): Promise<void> {
  await docsS3Client().send(
    new DeleteObjectCommand({ Bucket: docsBucket(), Key: `${DOCS_KEY_PREFIX}${file}` }),
  );
}
