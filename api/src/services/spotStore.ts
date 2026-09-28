import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSampleDataset } from "../data/sampleSpots";
import { SpotDataset, SyncMetadata } from "../domain/spots";

const containerName = process.env.SPOTS_CONTAINER_NAME ?? "borilje-data";
const publishedPath = "published/spots.json";
const metadataPath = "published/metadata.json";

function getContainerClient(): ContainerClient | null {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;

  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString)
      .getContainerClient(containerName);
  }

  if (accountUrl) {
    return new BlobServiceClient(accountUrl, new DefaultAzureCredential())
      .getContainerClient(containerName);
  }

  return null;
}

const localDataPath = (blobPath: string): string =>
  path.join(process.env.LOCAL_DATA_DIR ?? path.join(process.cwd(), "local-data"), blobPath);

async function downloadJson<T>(
  container: ContainerClient,
  blobPath: string,
): Promise<T | null> {
  const blob = container.getBlockBlobClient(blobPath);
  if (!(await blob.exists())) return null;
  const response = await blob.downloadToBuffer();
  return JSON.parse(response.toString("utf8")) as T;
}

async function uploadJson(
  container: ContainerClient,
  blobPath: string,
  value: unknown,
  cacheControl: string,
): Promise<void> {
  const content = JSON.stringify(value, null, 2);
  await container.getBlockBlobClient(blobPath).upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: {
      blobContentType: "application/json; charset=utf-8",
      blobCacheControl: cacheControl,
    },
  });
}

async function readLocalJson<T>(blobPath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(localDataPath(blobPath), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeLocalJson(blobPath: string, value: unknown): Promise<void> {
  const target = localDataPath(blobPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readDataset(): Promise<SpotDataset> {
  const container = getContainerClient();
  const stored = container
    ? await downloadJson<SpotDataset>(container, publishedPath)
    : await readLocalJson<SpotDataset>(publishedPath);

  if (stored) return stored;

  const allowSample =
    process.env.ALLOW_SAMPLE_DATA === "true" || !process.env.WEBSITE_INSTANCE_ID;
  if (allowSample) return createSampleDataset();

  throw new Error("게시된 클린 스팟 데이터가 없습니다.");
}

export async function readMetadata(): Promise<SyncMetadata> {
  const container = getContainerClient();
  const stored = container
    ? await downloadJson<SyncMetadata>(container, metadataPath)
    : await readLocalJson<SyncMetadata>(metadataPath);
  return stored ?? (await readDataset()).metadata;
}

export async function publishDataset(
  dataset: SpotDataset,
  raw: unknown,
): Promise<void> {
  const rawPath = `raw/${dataset.metadata.version}.json`;
  const container = getContainerClient();

  if (container) {
    await container.createIfNotExists();
    await uploadJson(container, rawPath, raw, "no-store");
    await uploadJson(container, publishedPath, dataset, "public, max-age=300");
    await uploadJson(container, metadataPath, dataset.metadata, "no-store");
    return;
  }

  await writeLocalJson(rawPath, raw);
  await writeLocalJson(publishedPath, dataset);
  await writeLocalJson(metadataPath, dataset.metadata);
}
