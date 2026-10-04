import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { productDocsDir } from "../utils/docs-dir";
import { DOCS_KEY_PREFIX, docsBucket, docsS3Client } from "../utils/product-docs";

/**
 * Zet de productfiches uit de lokale docs-map (data/docs/products, of
 * DOCS_DIR) over naar de bucket (Neon Object Storage), onder dezelfde namen
 * als server/utils/product-docs.ts ze leest (products/<artikelnr>.pdf).
 *
 * Vereist de S3_*-variabelen in .env. Herstartbaar: wat al in de bucket
 * staat wordt overgeslagen, tenzij je --force meegeeft.
 *
 *   npx tsx server/database/upload-docs.ts --dry-run
 *   npx tsx server/database/upload-docs.ts
 */
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 8;

async function existingKeys(bucket: string): Promise<Set<string>> {
  const found = new Set<string>();
  let token: string | undefined;
  do {
    const page = await docsS3Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: DOCS_KEY_PREFIX,
        ContinuationToken: token,
      }),
    );
    for (const object of page.Contents ?? []) if (object.Key) found.add(object.Key);
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return found;
}

async function main() {
  const bucket = docsBucket();
  if (!bucket) throw new Error("S3_BUCKET ontbreekt in .env.");

  const dir = productDocsDir();
  const files = readdirSync(dir).filter((name) => /^[\w.-]+\.pdf$/i.test(name));
  const existing = FORCE ? new Set<string>() : await existingKeys(bucket);
  const todo = files.filter((name) => !existing.has(`${DOCS_KEY_PREFIX}${name}`));

  console.log(
    `${files.length} fiches in ${dir}, ${files.length - todo.length} al in de bucket, ${todo.length} te uploaden.`,
  );
  if (DRY_RUN) return;

  let done = 0;
  const failed: string[] = [];
  const queue = [...todo];

  async function worker() {
    for (let name = queue.shift(); name; name = queue.shift()) {
      try {
        await docsS3Client().send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `${DOCS_KEY_PREFIX}${name}`,
            Body: readFileSync(join(dir, name)),
            ContentType: "application/pdf",
          }),
        );
        done++;
        if (done % 50 === 0) console.log(`  ${done}/${todo.length}`);
      } catch (error) {
        failed.push(name);
        console.error(`  MISLUKT ${name}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`Klaar: ${done} geüpload, ${failed.length} mislukt.`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
