import * as qiniu from 'qiniu-js';
import { request } from '@/utils/request';
import { compressImage, validateFileSize } from '@/utils/image-compress';
import type {
  UploadType,
  UploadTokenResponse,
  UploadConfig,
  UploadProgress,
  UploadResult,
} from '@/types/qiniu';

class QiniuService {
  private config: UploadConfig | null = null;

  async getConfig(): Promise<UploadConfig> {
    if (this.config) {
      return this.config;
    }

    const res = await request<UploadConfig>({
      url: '/file/config',
      method: 'GET',
    });

    this.config = res.data;
    return this.config;
  }

  async getUploadToken(
    type: UploadType,
    fileName?: string
  ): Promise<UploadTokenResponse> {
    const res = await request<UploadTokenResponse>({
      url: '/file/upload-token',
      method: 'POST',
      data: { type, fileName },
    });

    return res.data;
  }

  async uploadImage(
    filePath: string,
    type: UploadType,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const config = await this.getConfig();

    const isValid = await validateFileSize(filePath, config.maxSize);
    if (!isValid) {
      throw new Error(`文件大小超过限制 ${config.maxSize / 1024 / 1024}MB`);
    }

    const compressedPath = await compressImage(filePath, {
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      quality: config.quality,
    });

    const fileName = filePath.split('/').pop();
    const tokenData = await this.getUploadToken(type, fileName);

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `https://upload-z1.qiniup.com`,
        filePath: compressedPath,
        name: 'file',
        formData: {
          token: tokenData.token,
          key: tokenData.key,
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            const url = `${tokenData.domain}/${data.key}`;
            resolve({
              key: data.key,
              url,
              hash: data.hash,
            });
          } else {
            reject(new Error('上传失败'));
          }},
        fail: reject,
      });
    });
  }

  async uploadImages(
    filePaths: string[],
    type: UploadType,
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0 filePaths.length; i++) {
      const result = await this.uploadImage(
        filePaths[i],
        type,
        (progress) => {
          if (onProgress) {
            onProgress(i, progress);
          }
        }
      );
      results.push(result);
    }

    return results;
  }

  async saveFileRecord(
    key: string,
    type: string,
    originalName?: string
  ): Promise<void> {
    await request({
      url: '/file/save',
      method: 'POST',
      data: { key, type, originalName },
    });
  }
}

export const qiniuService = new QiniuService();
