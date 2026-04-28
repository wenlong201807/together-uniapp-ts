# H5 平台降级方案

## 概述

由于 H5 平台的浏览器环境限制，部分功能需要进行降级处理以确保页面正常展示。本文档详细说明了 H5 平台的降级策略和实现方案。

## 平台功能对比

| 功能模块 | 微信小程序 | App | H5 | 支付宝小程序 | 降级方案 |
|---------|-----------|-----|----|-----------|---------| 
| **base64 转换** | ✅ | ✅ | ❌ | ✅ | 跳过离线缓存 |
| **离线缓存** | ✅ | ✅ | ❌ | ✅ | 使用内存缓存 |
| **内存缓存** | ✅ | ✅ | ✅ | ✅ | - |
| **懒加载** | ✅ | ✅ | ✅ | ✅ | - |
| **WebP 检测** | ✅ | ✅ | ✅ | ✅ | 浏览器原生检测 |
| **优先级队列** | ✅ | ✅ | ✅ | ✅ | - |
| **弱网降级** | ✅ | ✅ | ✅ | ✅ | - |

## H5 平台限制

### 1. 无法使用 uni.getFileSystemManager()
**原因**: H5 平台不支持文件系统 API

**影响**: 
- 无法将图片转换为 base64
- 无法使用 uni.storage 存储 base64 数据

**降级方案**:
```typescript
// #ifdef H5
// 跳过 base64 转换和离线缓存
console.warn('[LazyImage] H5 platform does not support image to base64 conversion')
resolve(null)
return
// #endif
```

### 2. 无法使用 canvas 转换图片
**原因**: uni-app 的 canvas API 在 H5 上行为不一致

**影响**: 
- 无法压缩图片
- 无法生成缩略图

**降级方案**:
- 直接使用原图 URL
- 依赖 CDN 的图片处理服务

## 降级策略详解

### 1. 图片加载流程（H5）

```
用户滚动 
  ↓
IntersectionObserver 触发
  ↓
检查内存缓存 (ImageLRUCache)
  ↓ 未命中
添加到加载队列 (ImageLoadQueue)
  ↓
按优先级加载图片
  ↓
存入内存缓存
  ↓
显示图片
```

**对比小程序/App流程**:
```
用户滚动 
  ↓
IntersectionObserver 触发
  ↓
检查离线缓存 (OfflineCache) ← H5 跳过
  ↓ 未命中
检查内存缓存 (ImageLRUCache)
  ↓ 未命中
添加到加载队列 (ImageLoadQueue)
  ↓
按优先级加载图片
  ↓
存入内存缓存
  ↓
转换为 base64 ← H5 跳过
  ↓
存入离线缓存 ← H5 跳过
  ↓
显示图片
```

### 2. 缓存策略（H5）

#### 内存缓存 (LRU)
- **容量**: 50 张图片
- **大小限制**: 30MB
- **淘汰策略**: LRU (最近最少使用)
- **生命周期**: 页面刷新后清空

```typescript
// H5 平台只使用内存缓存
const imageCache = getGlobalImageCache(50)

// 缓存命中
if (imageCache.has(url)) {
  const cached = imageCache.get(url)
  currentSrc.value = url
  imageState.value = ImageState.CACHED
  return
}

// 加载后缓存
imageCache.set(url, {
  width: res.width,
  height: res.height
})
```

#### 浏览器缓存
- **HTTP 缓存**: 依赖服务器的 Cache-Control 头
- **Service Worker**: 可选，需要额外配置
- **LocalStorage**: 不推荐（容量限制 5-10MB）

### 3. WebP 支持检测（H5）

H5 平台使用浏览器原生方法检测 WebP 支持：

```typescript
class H5Optimizer {
  private detectWebPSupport() {
    const canvas = document.createElement('canvas')
    if (canvas.getContext && canvas.getContext('2d')) {
      // 检查 toDataURL 是否支持 image/webp
      this.supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    }
  }
}
```

**浏览器支持情况**:
- Chrome 23+ ✅
- Firefox 65+ ✅
- Edge 18+ ✅
- Safari 14+ ✅
- Safari 13- ❌

### 4. 懒加载实现（H5）

H5 平台优先使用浏览器原生 Intersection Observer：

```typescript
// 检测原生懒加载支持
const supportsNativeLazyLoad = 'loading' in HTMLImageElement.prototype

if (supportsNativeLazyLoad) {
  // 使用原生懒加载
  <img src="..." loading="lazy" />
} else {
  // 降级到 Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage(entry.target)
      }
    })
  })
}
```

### 5. 优先级队列（H5）

H5 平台完全支持优先级队列，与小程序/App 一致：

```typescript
// 优先级定义
enum ImagePriority {
  CRITICAL = 'critical',  // 立即加载（Banner 首图、首屏头像）
  HIGH = 'high',          // 100ms 延迟（可视区域图片）
  LOW = 'low'             // 500ms 延迟（缓冲区图片）
}

// 并发控制
const maxConcurrent = 3  // 最多 3 个并发请求
```

## H5 专用优化

### 1. 预加载关键图片

```typescript
// 使用 <link rel="preload"> 预加载
const h5Optimizer = getGlobalH5Optimizer()

h5Optimizer.preloadImage('banner-1.jpg', 'high')
```

### 2. 响应式图片

```html
<!-- 使用 srcset 提供多种尺寸 -->
<img 
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  loading="lazy"
/>
```

### 3. CDN 图片处理

```typescript
// 使用 CDN 参数压缩图片
function optimizeImageUrl(url: string, width: number, quality: number = 80): string {
  // 七牛云示例
  return `${url}?imageView2/2/w/${width}/q/${quality}/format/webp`
  
  // 阿里云 OSS 示例
  return `${url}?x-oss-process=image/resize,w_${width}/quality,q_${quality}/format,webp`
}
```

## 性能优化建议

### 1. 减少图片数量
- 首屏只加载可视区域图片
- 使用虚拟列表减少 DOM 节点

### 2. 压缩图片
- 使用 WebP 格式（节省 25-35% 体积）
- 设置合理的图片质量（80-85）
- 使用响应式图片

### 3. 利用浏览器缓存
```nginx
# Nginx 配置示例
location ~* \.(jpg|jpeg|png|gif|webp)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 4. 使用 CDN
- 就近访问，减少延迟
- 自动压缩和格式转换
- 负载均衡

## 监控和调试

### 1. 性能监控

```typescript
const performanceMonitor = getGlobalPerformanceMonitor()

// 获取性能指标
const metrics = performanceMonitor.getMetrics()
console.log('Performance Metrics:', {
  averageLoadTime: metrics.averageLoadTime,
  cacheHitRate: metrics.cacheHitRate,
  failureRate: metrics.failureRate
})
```

### 2. 调试工具

```typescript
// 开发环境启用详细日志
if (import.meta.env.DEV) {
  console.log('[LazyImage] Image loaded:', elementId)
  console.log('[ImageCache] Cache hit:', url)
  console.log('[H5Optimizer] WebP supported:', supportsWebP)
}
```

### 3. Chrome DevTools

- **Netwo 面板**: 查看图片加载时间和大小
- **Performance 面板**: 分析渲染性能
- **Lighthouse**: 评估页面性能得分

## 常见问题

### Q1: H5 页面刷新后图片需要重新加载？
**A**: 是的，H5 平台只使用内存缓存，页面刷新后缓存清空。建议：
- 配置服务器 HTTP 缓存头
- 使用 Service Worker 实现持久化缓存

### Q2: H5 图片加载比小程序慢？
**A**: 可能原因：
- 缺少离线缓存，每次都需要网络请求
- 浏览器并发限制（通常 6 个）
- 建议使用 CDN 和图片压缩

### Q3: 如何在 H5 实现离线缓存？
**A**: 使用 Service Worker：
```javascript
// service-worker.js
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          return caches.open('images').then((cache) => {
            cache.put(event.request, response.clone())
            return response
          })
        })
      })
    )
  }
})
```

### Q4: H5 支持哪些图片格式？
**A**: 
- **JPEG**: 所有浏览器 ✅
- **PNG**: 所有浏览器 ✅
- **WebP**: Chrome 23+, Firefox 65+, Safari 14+ ✅
- **AVIF**: Chrome 85+, Firefox 93+ ⚠️ (部分支持)

## 总结

H5 平台虽然缺少离线缓存功能，但通过以下降级方案仍能保证良好的用户体验：

1. ✅ **内存缓存**: 使用 LRU 算法，容量 50 张图片
2. ✅ **懒加载**: 使用 Intersection Observer 或原生 loading 属性
3. ✅ **优先级队列**: 3 个并发，按优先级加载
4. ✅ **WebP 检测**: 浏览器原生检测，自动降级
5. ✅ **弱网降级**: 2G/3G 只加载头像
6. ✅ **性能监控**: 实时监控加载性能

**关键指标**:
- 首屏图片加载时间: < 1s
- 缓存命中率: > 60%
- 图片加载失败率: < 1%

通过合理的降级策略和优化手段，H5 平台可以达到接近原生应用的图片加载体验。
