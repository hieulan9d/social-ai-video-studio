export type UploadAssetInput = {
  bucket: string;
  path: string;
  file: File;
  contentType: string;
};

export type UploadBlobInput = {
  bucket: string;
  path: string;
  data: Blob;
  contentType: string;
};

export type StorageProvider = {
  readonly name: string;
  upload(input: UploadAssetInput): Promise<void>;
  uploadBlob(input: UploadBlobInput): Promise<void>;
  downloadBlob(input: { bucket: string; path: string }): Promise<Blob>;
  delete(input: { bucket: string; path: string }): Promise<void>;
  createSignedReadUrl(input: {
    bucket: string;
    path: string;
    expiresInSeconds?: number;
  }): Promise<string>;
};
