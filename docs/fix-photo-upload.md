# 照片上传问题修复

## 问题描述

在照片管理页面 (`/#/pages/profile/photos`) 上传照片时报错：

```
TypeError: filePath.split is not a function
    at uploadFile (file.ts:103:68)
```

## 问题原因

1. **H5ImageUploader 组件**返回的是 `File` 对象数组
2. **uploadFile 函数**期望接收字符串路径参数
3. 当传入 `File` 对象时，代码尝试调用 `filePath.split('/')` 导致报错

## 修复方案

修改 `uploadFile` 函数，使其能够同时处理字符串路径和 File 对象。

### 修改文件

**`src/api/modules/file.ts`**

#### 1. 修改函数签名（第90-95行）

**修改前：**
```typescript
export async function uploadFile(
  filePath: string,
  options?: {
    type?: 'square' | 'avatar' | 'certificate' | 'album';
  }
): Promise<UploadResult>
```

**修改后：**
```typescript
export async function uploadFile(
  filePath: string | File,  // ✅ 支持 File 对象
  options?: {
    type?: 'square' | 'avatar' | 'certificate' | 'album';
  }
): Promise<UploadResult>
```

#### 2. 添加 File 对象处理逻辑（第103-120行）

**新增代码：**
```typescript
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
```

#### 3. 优化文件读取逻辑（第132-145行）

**修改后：**
```typescript
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
  }
  // ... 其他情况
}
```

#### 4. 添加 blob URL 清理（第178-181行）

**新增代码：**
```typescript
// 释放 blob URL
if (fileObject && actualFilePath.startsWith('blob:')) {
  URL.revokeObjectURL(actualFilePath);
}
```

#### 5. 优化文件名获取（第186-197行）

**修改后：**
```typescript
let originalName: string;
if (fileObject) {
  originalName = fileObject.name;  // ✅ 优先使用 File 对象的原始文件名
} else if (actualFilePath.startsWith('data:')) {
  originalName = `image.${ext}`;
} else if (actualFilePath.startsWith('blob:')) {
  originalName = `image.${ext}`;
} else if (actualFilePath.includes('/')) {
  originalName = actualFilePath.split('/').pop() || `image.${ext}`;
} else {
  me = `image.${ext}`;
}
```

## 修复效果

### 修复前
- ❌ H5 端上传照片报错：`filePath.split is not a function`
- ❌ 无法处理 File 对象

### 修复后
- ✅ 支持字符串路径参数（小程序端、App 端）
- ✅ 支持 File 对象参数（H5 端）
- ✅ 自动将 File 对象转换为 blob URL
- ✅ 上传完成后自动释放 blob URL，避免内存泄漏
- ✅ 保留原始文件名

## 兼容性

| 平台 | 参数类型 | 处理方式 |
|------|---------|---------|
| H5 | `File` 对象 | 转换为 blob URL，直接读取 arrayBuffer |
| H5 | 字符串路径 | 支持 blob:、data:、http: 等格式 |
| 小程序 | 字符串路径 | 使用 FileSystemManager 读取 |
| App | 字符串路径 | 使用 uni.uploadFile 直接上传 |

## 测试建议

### 1. H5 端测试
```javascript
// 测试 File 对象上传
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
await uploadFile(file, { type: 'album' });

// 测试 blob URL 上传
const blobUrl = 'blob:http://localhost:8106/xxx';
await uploadFile(blobUrl, { type: 'album' });
```

### 2. 小程序端测试
```javascript
// 测试本地路径上传
const tempFilePath = 'wxfile://tmp_xxx.jpg';
await uploadFile(tempFilePath, { type: 'album' });
```

### 3. App 端测试
```javascript
// 测试本地路径上传
const tempFilePath = 'file:///storage/xxx.jpg';
await uploadFile(tempFilePath, { type: 'album' });
```

## 相关文件

- `src/api/modules/file.ts` - 文件上传工具（已修复）
- `src/pages/profile/photos.vue` - 照片管理页面
- `src/components/business/H5ImageUploader.vue` - H5 图片上传组件

## 注意事项

1. **内存管理**：使用 `URL.createObjectURL()` 创建的 blob URL 需要手动释放，否则会造成内存泄漏
2. **类型检查**：使用 `instanceof File` 判断是否为 File 对象
3. **向后兼容**：保持对字符串路径的支持，确保小程序和 App 端正常工作
4. **错误处理**：保留原有的错误处理逻辑，确保各种异常情况都能正确提示

## 总结

通过修改 `uploadFile` 函数，使其能够同时处理字符串路径和 File 对象，解决了 H5 端照片上传报错的问题。修复后的代码具有更好的兼容性和健壮性，同时保持了对其他平台的支持。
