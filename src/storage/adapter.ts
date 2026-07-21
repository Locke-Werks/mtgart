export interface PutResult {
  key: string;
  url: string;
}

export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<PutResult>;
  putJson(key: string, obj: unknown): Promise<PutResult>;
  getJson<T>(key: string): Promise<T | null>;
  getUrl(key: string): Promise<string>;
  list(prefix: string): Promise<string[]>;
}
