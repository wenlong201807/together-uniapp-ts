interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * 压缩图片
 */
export async function compressImage(
  filePath: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success: (info) => {
        const { width, height } = info;

        let targetWidth = width;
        let targetHeight = height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          targetWidth = Math.floor(width * ratio);
          targetHeight = Math.floor(height * ratio);
        }

        uni.compressImage({
          src: filePath,
          quality,
          width: targetWidth,
          height: targetHeight,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: reject,
        });
      },
      fail: reject,
    });
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  filePaths: string[],
  options?: CompressOptions
): Promise<string[]> {
  const promises = filePaths.map(path => compressImage(path, options));
  return Promise.all(promises);
}

/**
 * 获取文件大小（字节）
 */
export async function getFileSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({
      filePath,
      success: (res) => {
        resolve(res.size);
      },
      fail: reject,
    });
  });
}

/**
 * 验证文件大小
 */
export async function validateFileSize(
  filePath: string,
  maxSize: number = 5 * 1024 * 1024
): Promise<boolean> {
  const size = await getFileSize(filePath);
  return size <= maxSize;
}
