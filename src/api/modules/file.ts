import request from '../request';
import { API_CONFIG } from '@/config';

export interface FileConfig {
  baseUrl: string;
  bucket: string;
  maxSize: number;
  allowedTypes: string[];
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

export interface UploadResult {
  id: number;
  fileName: string;
  filePath: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileExt: string;
  width?: number;
  height?: number;
  url: string;
}

export interface FileInfo {
  id: number;
  fileName: string;
  filePath: string;
  url: string;
  originalName?: string;
  fileSize?: number;
  status: number;
  createdAt: string;
}

export async function getUploadConfig(): Promise<FileConfig> {
  const res = await request.get<FileConfig>('/file/config');
  return res.data;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

function getFileExtension(filePath: string): string {
  // 处理 data URL 格式: data:image/jpeg;base64,xxxx
  if (filePath.startsWith('data:')) {
    const match = filePath.match(/data:([^;]+)\//);
    if (match) {
      const mime = match[1];
      if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
      if (mime.includes('png')) return 'png';
      if (mime.includes('gif')) return 'gif';
      if (mime.includes('webp')) return 'webp';
    }
    return 'jpg';
  }
  // 处理 blob URL 格式: blob:http://...
  if (filePath.startsWith('blob:')) {
    return 'jpg';
  }
  // 普通文件路径
  const match = filePath.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * 上传文件到七牛云
 * @param filePath 本地文件路径或 File 对象
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadFile(
  filePath: string | File,
  options?: {
    type?: 'square' | 'avatar' | 'certificate' | 'album';
  }
): Promise<UploadResult> {
  // 将 post 类型映射为 square
  let type = options?.type || 'square';
  if (type === 'post' as any) {
    type = 'square';
  }

  // 处理 File 对象
  let actualFilePath: string;
  let fileObject: File | null = null;

  if (filePath instanceof File) {
    // 如果是 File 对象，创建 blob URL
    fileObject = filePath;
    actualFilePath = URL.createObjectURL(filePath);
    console.log('[uploadFile] File 对象转换为 blob URL:', actualFilePath);
  } else {
    actualFilePath = filePath;
  }

  // 1. 获取七牛云上传凭证
  const fileName = fileObject ? fileObject.name : (actualFilePath.split('/').pop() || 'image.jpg');
  const tokenRes = await getUploadToken({ type, fileName });
  const { token, key, domain } = tokenRes;

  // 2. 准备文件数据
  let fileData: ArrayBuffer;
  const ext = getFileExtension(actualFilePath);
  const mimeType = getMimeType(ext);

  // 检测运行环境
  const isH5 = typeof window !== 'undefined';
  const isUniApp = typeof uni !== 'undefined';
  const hasFileSystemManager = isUniApp && typeof (uni as any).getFileSystemManager === 'function';

  console.log('UploadFile debug - isH5:', isH5, 'isUniApp:', isUniApp, 'hasFileSystemManager:', hasFileSystemManager, 'actualFilePath:', actualFilePath);

  if (hasFileSystemManager && !isH5) {
    // 小程序端
    console.log('Using mini program upload');
    const fs = (uni as any).getFileSystemManager();
    const fileContent = await fs.readFile({
      filePath: actualFilePath,
      encoding: 'binary'
    });
    const binary = atob(fileContent.data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    fileData = array.buffer;
  } else if (isH5 && actualFilePath) {
    // H5端 - 优先使用 File 对象
    console.log('Using H5 upload, actualFilePath starts with:', actualFilePath.substring(0, 50));
    if (fileObject) {
      // 直接从 File 对象读取
      console.log('Reading from File object');
      fileData = await fileObject.arrayBuffer();
    } else if (actualFilePath.startsWith('blob:')) {
      const response = await fetch(actualFilePath);
      fileData = await response.arrayBuffer();
    } else if (actualFilePath.startsWith('data:')) {
      // data URL
      const base64 = actualFilePath.split(',')[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      fileData = array.buffer;
    } else {
      // H5端临时文件路径或其他路径
      try {
        const response = await fetch(actualFilePath);
        fileData = await response.arrayBuffer();
      } catch (e) {
        console.error('Fetch file error:', e);
        throw new Error('无法读取文件: ' + (e as Error).message);
      }
    }
  } else {
    throw new Error('不支持的平台或无效的文件路径');
  }

  // 3. 上传到七牛云
  console.log('Uploading to Qiniu, key:', key);

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: 'https://up-z2.qiniup.com', // 华南区域
      filePath: actualFilePath,
      name: 'file',
      formData: {
        token: token,
        key: key,
      },
      success: async (uploadRes) => {
        if (uploadRes.statusCode === 200) {
          console.log('Qiniu upload success:', uploadRes.data);

          // 释放 blob URL
          if (fileObject && actualFilePath.startsWith('blob:')) {
            URL.revokeObjectURL(actualFilePath);
          }

          // 4. 保存文件记录到后端
          try {
            let originalName: string;
            if (fileObject) {
              originalName = fileObject.name;
            } else if (actualFilePath.startsWith('data:')) {
              originalName = `image.${ext}`;
            } else if (actualFilePath.startsWith('blob:')) {
              originalName = `image.${ext}`;
            } else if (actualFilePath.includes('/')) {
              originalName = actualFilePath.split('/').pop() || `image.${ext}`;
            } else {
              originalName = `image.${ext}`;
            }

            const saveRes = await saveFileRecord({
              fileName: key,
              filePath: key,
              originalName: originalName,
              fileSize: 0,
              mimeType: mimeType,
              fileExt: ext,
              bucketName: 'wetogether-staging',
              type: type,
            });

            // 返回完整的 URL
            // 移除 key 开头的斜杠（如果有）避免双斜杠
            const cleanKey = key.startsWith('/') ? key.substring(1) : key;
            const fullUrl = `${domain}/${cleanKey}`;
            resolve({
              id: saveRes.id,
              fileName: key,
              filePath: key,
              originalName: originalName,
              fileSize: 0,
              mimeType: mimeType,
              fileExt: ext,
              url: fullUrl,
            });
          } catch (error) {
            console.error('Save file record error:', error);
            reject(error);
          }
        } else {
          console.error('Qiniu upload failed:', uploadRes);
          reject(new Error('上传失败'));
        }
      },
      fail: (error) => {
        console.error('Upload error:', error);
        reject(error);
      }
    });
  });
}

export async function getFileUrl(fileId: number): Promise<string> {
  const res = await request.get<{ url: string }>(`/file/${fileId}/url`);
  return res.data.url;
}

export async function getFileInfo(fileId: number): Promise<FileInfo> {
  const res = await request.get<FileInfo>(`/file/${fileId}`);
  return res.data;
}

export async function getMyFiles(
  page: number = 1,
  pageSize: number = 20,
  type?: string
): Promise<{ list: FileInfo[]; total: number }> {
  const res = await request.get<{ list: FileInfo[]; total: number }>('/file/my/list', {
    page,
    pageSize,
    type,
  });
  return res.data;
}

export async function deleteFile(fileId: number): Promise<void> {
  await request.delete(`/file/${fileId}`);
}

export async function getUploadToken(data: { type: string; fileName?: string }): Promise<{ token: string; key: string; domain: string; expire: number }> {
  const res = await request.post<{ token: string; key: string; domain: string; expire: number }>('/file/upload-token', data);
  return res.data;
}

export async function saveFileRecord(data: {
  fileName: string;
  filePath: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileExt: string;
  bucketName: string;
  width?: number;
  height?: number;
  type: string;
}): Promise<FileInfo> {
  const res = await request.post<FileInfo>('/file/save', data);
  return res.data;
}

export async function uploadAvatar(filePath: string): Promise<{ filePath: string; url: string }> {
  // 1. 获取七牛云上传凭证
  const tokenRes = await getUploadToken({ type: 'avatar', fileName: filePath.split('/').pop() });
  const { token, key, domain } = tokenRes;

  // 2. 上传到七牛云
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: 'https://up-z2.qiniup.com', // 华南区域
      filePath: filePath,
      name: 'file',
      formData: {
        token: token,
        key: key,
      },
      success: async (uploadRes) => {
        if (uploadRes.statusCode === 200) {
          console.log('Qiniu avatar upload success:', uploadRes.data);

          // 3. 保存到后端并返回 URL
          try {
            const res = await request.post<{ id: number; filePath: string; url: string }>('/user/avatar', {
              filePath: key,
            });

            const fullUrl = `${domain}/${key}`;
            resolve({ filePath: key, url: fullUrl });
          } catch (error) {
            console.error('Save avatar record error:', error);
            reject(error);
          }
        } else {
          console.error('Qiniu avatar upload failed:', uploadRes);
          reject(new Error('上传失败'));
        }
      },
      fail: (error) => {
        console.error('Upload avatar error:', error);
        reject(error);
      }
    });
  });
}

export const fileApi = {
  getUploadConfig,
  uploadFile,
  getFileUrl,
  getFileInfo,
  getMyFiles,
  deleteFile,
  uploadAvatar,
  getUploadToken,
  saveFileRecord,
};
