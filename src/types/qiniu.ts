export enum UploadType {
  SQUARE = 'square',
  AVATAR = 'avatar',
  CERTIFICATE = 'certificate',
  ALBUM = 'album',
}

export interface UploadTokenResponse {
  token: string;
  key: string;
  domain: string;
  expire: number;
}

export interface UploadConfig {
  maxSize: number;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  allowedTypes: string[];
  limits: {
    square: number;
    album: number;
  };
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UploadResult {
  key: string;
  url: string;
  hash?: string;
}
