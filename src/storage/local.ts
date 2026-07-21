import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { StorageAdapter, PutResult } from "./adapter";

const ROOT = resolve(process.cwd(), "storage");

function toPath(key: string): string {
  return join(ROOT, key);
}

export class LocalStorage implements StorageAdapter {
  async put(key: string, data: Buffer, _contentType: string): Promise<PutResult> {
    const path = toPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return { key, url: `/api/files/${key}` };
  }

  async putJson(key: string, obj: unknown): Promise<PutResult> {
    return this.put(key, Buffer.from(JSON.stringify(obj, null, 2), "utf8"), "application/json");
  }

  async getJson<T>(key: string): Promise<T | null> {
    const path = toPath(key);
    if (!existsSync(path)) return null;
    return JSON.parse(await readFile(path, "utf8")) as T;
  }

  async getUrl(key: string): Promise<string> {
    return `/api/files/${key}`;
  }

  async list(prefix: string): Promise<string[]> {
    const dir = toPath(prefix);
    if (!existsSync(dir)) return [];
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => `${prefix}/${e.name}`);
  }
}
