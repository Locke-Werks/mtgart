import { getEnv } from "@/config/env";
import type { StorageAdapter } from "./adapter";
import { LocalStorage } from "./local";

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const driver = getEnv().STORAGE_DRIVER;
  switch (driver) {
    case "local":
      cached = new LocalStorage();
      break;
    default:
      throw new Error(`Storage driver "${driver}" is not implemented yet. Use "local" for now.`);
  }
  return cached;
}

export type { StorageAdapter, PutResult } from "./adapter";
