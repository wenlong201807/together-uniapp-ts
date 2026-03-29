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

export async function uploadFile(
  filePath: string,
  options?: {
    type?: string;
  }
): Promise<UploadResult> {
  const config = await getUploadConfig();
  
  const ext = getFileExtension(filePath);
  const now = new Date();
  const relativePath = `${config.bucket}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${generateUUID()}.${ext}`;
  
  // 1. 获取预签名上传URL
  const presignedRes = await request.post<{ uploadUrl: string; filePath: string }>('/file/presigned-put', {
    filePath: relativePath,
  });

  // 2. 使用预签名URL上传到RustFS (PUT方式)
  let fileData: ArrayBuffer;
  const mimeType = getMimeType(ext);
  
  // 检测运行环境
  const isH5 = typeof window !== 'undefined';
  const isUniApp = typeof uni !== 'undefined';
  const hasFileSystemManager = isUniApp && typeof (uni as any).getFileSystemManager === 'function';
  
  console.log('UploadFile debug - isH5:', isH5, 'isUniApp:', isUniApp, 'hasFileSystemManager:', hasFileSystemManager, 'filePath:', filePath);
  
  if (hasFileSystemManager && !isH5) {
    // 小程序端
    console.log('Using mini program upload');
    const fs = (uni as any).getFileSystemManager();
    const fileContent = await fs.readFile({
      filePath: filePath,
      encoding: 'binary'
    });
    const binary = atob(fileContent.data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    fileData = array.buffer;
  } else if (isH5 && filePath) {
    // H5端 - blob URL 或 data URL 或临时文件路径
    console.log('Using H5 upload, filePath starts with:', filePath.substring(0, 50));
    if (filePath.startsWith('blob:')) {
      const response = await fetch(filePath);
      fileData = await response.arrayBuffer();
    } else if (filePath.startsWith('data:')) {
      // data URL
      const base64 = filePath.split(',')[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      fileData = array.buffer;
    } else {
      // H5端临时文件路径或其他路径
      try {
        const response = await fetch(filePath);
        fileData = await response.arrayBuffer();
      } catch (e) {
        console.error('Fetch file error:', e);
        throw new Error('无法读取文件: ' + e.message);
      }
    }
  } else {
    throw new Error('不支持的平台或无效的文件路径');
  }

  console.log('Uploading to:', presignedRes.data.uploadUrl);
  
  await uni.request({
    url: presignedRes.data.uploadUrl,
    method: 'PUT',
    data: fileData,
    header: {
      'Content-Type': mimeType,
    },
  });
  
  // 3. 将相对路径传给后端
  let originalName: string;
  if (filePath.startsWith('data:')) {
    originalName = `image.${ext}`;
  } else if (filePath.startsWith('blob:')) {
    originalName = `image.${ext}`;
  } else if (filePath.includes('/')) {
    originalName = filePath.split('/').pop() || `image.${ext}`;
  } else {
    originalName = `image.${ext}`;
  }
  
  const res = await request.post<UploadResult>('/file/upload', {
    filePath: relativePath,
    originalName: originalName,
    mimeType: getMimeType(ext),
    fileSize: 0,
    type: options?.type || 'default',
  });
  
  return res.data;
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

export async function uploadAvatar(filePath: string): Promise<{ filePath: string; url: string }> {
  const config = await getUploadConfig();
  
  const ext = getFileExtension(filePath);
  const now = new Date();
  const relativePath = `avatar/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${generateUUID()}.${ext}`;
  
  // 1. 获取预签名上传URL
  const presignedRes = await request.post<{ uploadUrl: string; filePath: string }>('/file/presigned-put', {
    filePath: relativePath,
  });

  // 2. 使用预签名URL上传到RustFS (PUT方式)
  let fileData: ArrayBuffer;
  const mimeType = getMimeType(ext);
  
  // 检测运行环境
  const isH5 = typeof window !== 'undefined';
  const isUniApp = typeof uni !== 'undefined';
  const hasFileSystemManager = isUniApp && typeof (uni as any).getFileSystemManager === 'function';
  
  console.log('Upload debug - isH5:', isH5, 'isUniApp:', isUniApp, 'hasFileSystemManager:', hasFileSystemManager, 'filePath:', filePath);
  
  if (hasFileSystemManager && !isH5) {
    // 小程序端
    console.log('Using mini program upload');
    const fs = (uni as any).getFileSystemManager();
    const fileContent = await fs.readFile({
      filePath: filePath,
      encoding: 'binary'
    });
    const binary = atob(fileContent.data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    fileData = array.buffer;
  } else if (isH5 && filePath) {
    // H5端 - blob URL 或 data URL 或临时文件路径
    console.log('Using H5 upload, filePath starts with:', filePath.substring(0, 50));
    if (filePath.startsWith('blob:')) {
      const response = await fetch(filePath);
      fileData = await response.arrayBuffer();
    } else if (filePath.startsWith('data:')) {
      // data URL
      const base64 = filePath.split(',')[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      fileData = array.buffer;
    } else {
      // H5端临时文件路径或其他路径
      try {
        const response = await fetch(filePath);
        fileData = await response.arrayBuffer();
      } catch (e) {
        console.error('Fetch file error:', e);
        throw new Error('无法读取文件: ' + e.message);
      }
    }
  } else {
    throw new Error('不支持的平台或无效的文件路径');
  }

  console.log('Uploading to:', presignedRes.data.uploadUrl);
  
  await uni.request({
    url: presignedRes.data.uploadUrl,
    method: 'PUT',
    data: fileData,
    header: {
      'Content-Type': mimeType,
    },
  });
  
  // 3. 将相对路径传给后端，返回完整访问URL
  const res = await request.post<{ id: number; filePath: string; url: string }>('/user/avatar', {
    filePath: relativePath,
  });
  
  return { filePath: relativePath, url: res.data.url };
}

export const fileApi = {
  getUploadConfig,
  uploadFile,
  getFileUrl,
  getFileInfo,
  getMyFiles,
  deleteFile,
  uploadAvatar,
};
