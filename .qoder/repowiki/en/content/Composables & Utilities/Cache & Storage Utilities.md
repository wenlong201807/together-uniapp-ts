# Cache & Storage Utilities

<cite>
**Referenced Files in This Document**
- [cache.ts](file://src/utils/cache.ts)
- [storage.ts](file://src/utils/storage.ts)
- [image-compress.ts](file://src/utils/image-compress.ts)
- [imageLoader.ts](file://src/utils/imageLoader.ts)
- [qiniu.service.ts](file://src/services/qiniu.service.ts)
- [ImageUploader.vue](file://src/components/ImageUploader.vue)
- [qiniu.ts](file://src/types/qiniu.ts)
- [home.ts](file://src/api/home.ts)
- [useRecommendation.ts](file://src/pages/tabbar/home/composables/useRecommendation.ts)
- [main.ts](file://src/main.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the cache and storage utilities in the WeTogether platform, focusing on:
- Caching mechanisms for performance optimization
- Data persistence strategies and memory management
- Image compression utility for optimizing media uploads and reducing bandwidth
- Caching policies, expiration strategies, and invalidation mechanisms
- Implementation examples for different cache scenarios, compression configurations, and storage optimization techniques
- Performance benchmarks, memory usage patterns, and platform-specific storage limitations

## Project Structure
The cache and storage utilities are implemented under the src/utils directory and integrated with services and components:
- Cache and storage managers: src/utils/cache.ts, src/utils/storage.ts
- Image compression and lazy/preload utilities: src/utils/image-compress.ts, src/utils/imageLoader.ts
- Upload pipeline integrating compression and persistence: src/services/qiniu.service.ts, src/components/ImageUploader.vue
- Types for upload configuration and results: src/types/qiniu.ts
- Recommendation system composables and APIs: src/pages/tabbar/home/composables/useRecommendation.ts, src/api/home.ts
- Pinia initialization for persisted state: src/main.ts

```mermaid
graph TB
subgraph "Utilities"
U1["cache.ts"]
U2["storage.ts"]
U3["image-compress.ts"]
U4["imageLoader.ts"]
end
subgraph "Services"
S1["qiniu.service.ts"]
end
subgraph "Components"
C1["ImageUploader.vue"]
end
subgraph "APIs"
A1["api/home.ts"]
A2["pages/tabbar/home/composables/useRecommendation.ts"]
end
subgraph "Types"
T1["types/qiniu.ts"]
end
subgraph "App Init"
M1["main.ts"]
end
U1 --> S1
U3 --> S1
S1 --> C1
C1 --> S1
A2 --> A1
U4 --> A2
M1 --> U1
```

**Diagram sources**
- [cache.ts:1-359](file://src/utils/cache.ts#L1-L359)
- [storage.ts:1-26](file://src/utils/storage.ts#L1-L26)
- [image-compress.ts:1-87](file://src/utils/image-compress.ts#L1-L87)
- [imageLoader.ts:1-354](file://src/utils/imageLoader.ts#L1-L354)
- [qiniu.service.ts:1-126](file://src/services/qiniu.service.ts#L1-L126)
- [ImageUploader.vue:1-242](file://src/components/ImageUploader.vue#L1-L242)
- [home.ts:1-198](file://src/api/home.ts#L1-L198)
- [useRecommendation.ts:1-202](file://src/pages/tabbar/home/composables/useRecommendation.ts#L1-L202)
- [qiniu.ts:1-38](file://src/types/qiniu.ts#L1-L38)
- [main.ts:1-18](file://src/main.ts#L1-L18)

**Section sources**
- [cache.ts:1-359](file://src/utils/cache.ts#L1-L359)
- [storage.ts:1-26](file://src/utils/storage.ts#L1-L26)
- [image-compress.ts:1-87](file://src/utils/image-compress.ts#L1-L87)
- [imageLoader.ts:1-354](file://src/utils/imageLoader.ts#L1-L354)
- [qiniu.service.ts:1-126](file://src/services/qiniu.service.ts#L1-L126)
- [ImageUploader.vue:1-242](file://src/components/ImageUploader.vue#L1-L242)
- [home.ts:1-198](file://src/api/home.ts#L1-L198)
- [useRecommendation.ts:1-202](file://src/pages/tabbar/home/composables/useRecommendation.ts#L1-L202)
- [qiniu.ts:1-38](file://src/types/qiniu.ts#L1-L38)
- [main.ts:1-18](file://src/main.ts#L1-L18)

## Core Components
- MemoryCache: In-memory cache with LRU-like eviction and per-item TTL.
- StorageCache: Persistent cache backed by uni storage with TTL and prefix-based key management.
- CacheManager: Singleton factory providing shared instances of MemoryCache and StorageCache, plus global cleanup helpers.
- CACHE_KEYS and CACHE_EXPIRE_TIME: Centralized cache key naming and TTL constants.
- storage: Lightweight wrapper around uni storage for generic key-value persistence.
- Image compression: Compression and validation utilities for media uploads.
- ImageLoader: Lazy/preload manager with retry, queueing, and concurrency control.
- QiniuService: Orchestrates upload configuration retrieval, compression, token acquisition, and upload to cloud storage.
- ImageUploader: UI component that integrates compression and upload flow with progress reporting.

**Section sources**
- [cache.ts:20-139](file://src/utils/cache.ts#L20-L139)
- [cache.ts:144-268](file://src/utils/cache.ts#L144-L268)
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)
- [cache.ts:323-359](file://src/utils/cache.ts#L323-L359)
- [storage.ts:1-26](file://src/utils/storage.ts#L1-L26)
- [image-compress.ts:10-87](file://src/utils/image-compress.ts#L10-L87)
- [imageLoader.ts:26-177](file://src/utils/imageLoader.ts#L26-L177)
- [qiniu.service.ts:12-126](file://src/services/qiniu.service.ts#L12-L126)
- [ImageUploader.vue:32-153](file://src/components/ImageUploader.vue#L32-L153)

## Architecture Overview
The cache and storage utilities integrate with the upload pipeline and recommendation system as follows:
- CacheManager provides shared caches for memory and persistent storage.
- QiniuService retrieves upload configuration, validates sizes, compresses images, obtains tokens, and performs uploads.
- ImageUploader coordinates user interactions, triggers compression via QiniuService, and updates UI with progress.
- Recommendation composables consume APIs and can leverage cache keys/constants for future integration.

```mermaid
sequenceDiagram
participant UI as "ImageUploader.vue"
participant SVC as "QiniuService"
participant CFG as "Upload Config API"
participant COMP as "compressImage"
participant TOK as "Upload Token API"
participant UP as "Upload Endpoint"
UI->>SVC : "uploadImage(filePath, type, onProgress)"
SVC->>CFG : "getConfig()"
CFG-->>SVC : "UploadConfig"
SVC->>COMP : "validateFileSize(filePath, maxSize)"
COMP-->>SVC : "valid?"
SVC->>COMP : "compressImage(filePath, {maxWidth,maxHeight,quality})"
COMP-->>SVC : "tempFilePath"
SVC->>TOK : "getUploadToken(type, fileName)"
TOK-->>SVC : "token,key,domain,expire"
SVC->>UP : "uni.uploadFile with token/key"
UP-->>SVC : "result {key,url,hash}"
SVC-->>UI : "UploadResult"
```

**Diagram sources**
- [qiniu.service.ts:42-87](file://src/services/qiniu.service.ts#L42-L87)
- [image-compress.ts:10-49](file://src/utils/image-compress.ts#L10-L49)
- [ImageUploader.vue:97-114](file://src/components/ImageUploader.vue#L97-L114)
- [qiniu.ts:15-25](file://src/types/qiniu.ts#L15-L25)

## Detailed Component Analysis

### MemoryCache and StorageCache
- MemoryCache
  - Stores items in a Map with timestamp and TTL.
  - On insert, enforces maxSize by evicting the oldest item when capacity is reached.
  - On get, checks TTL and deletes expired entries transparently.
  - Provides clearExpired, clear, delete, has, and size utilities.
- StorageCache
  - Persists items using uni.setStorageSync with JSON serialization.
  - Uses a configurable prefix to namespace keys.
  - Implements TTL checks on get and clearExpired scanning storage keys.
  - Supports bulk clearing and deletion by key.

```mermaid
classDiagram
class MemoryCache {
-Map~string, CacheItem~ cache
-Required~CacheOptions~ options
+set(key, data, expireTime)
+get(key) T|null
+has(key) boolean
+delete(key) boolean
+clear() void
+clearExpired() void
-clearOldest() void
+size() number
+keys() string[]
}
class StorageCache {
-string prefix
-Required~CacheOptions~ options
+set(key, data, expireTime) void
+get(key) T|null
+has(key) boolean
+delete(key) void
+clear() void
+clearExpired() void
-getKey(key) string
}
class CacheManager {
-MemoryCache memoryCache
-StorageCache storageCache
+getMemoryCache() MemoryCache
+getStorageCache() StorageCache
+clearAllExpired() void
+clearAll() void
}
CacheManager --> MemoryCache : "provides"
CacheManager --> StorageCache : "provides"
```

**Diagram sources**
- [cache.ts:20-139](file://src/utils/cache.ts#L20-L139)
- [cache.ts:144-268](file://src/utils/cache.ts#L144-L268)
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)

**Section sources**
- [cache.ts:20-139](file://src/utils/cache.ts#L20-L139)
- [cache.ts:144-268](file://src/utils/cache.ts#L144-L268)
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)

### Cache Keys and Expiration Policies
- CACHE_KEYS defines typed cache key factories for recommendation feed, banners, topics, user info, interests, location, and recommendation config.
- CACHE_EXPIRE_TIME defines TTL constants for each cache category in milliseconds.
- CacheManager exposes centralized clearAllExpired and clearAll for maintenance.

```mermaid
flowchart TD
Start(["Cache Access"]) --> BuildKey["Build Key via CACHE_KEYS"]
BuildKey --> Lookup{"MemoryCache hit?"}
Lookup --> |Yes| ReturnMem["Return cached data"]
Lookup --> |No| CheckStore{"StorageCache hit?"}
CheckStore --> |Yes| ReturnStore["Return cached data"]
CheckStore --> |No| Fetch["Fetch from origin"]
Fetch --> StoreMem["Store in MemoryCache"]
StoreMem --> StoreStore["Store in StorageCache"]
StoreStore --> ReturnNew["Return fresh data"]
```

**Diagram sources**
- [cache.ts:323-359](file://src/utils/cache.ts#L323-L359)
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)

**Section sources**
- [cache.ts:323-359](file://src/utils/cache.ts#L323-L359)
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)

### Image Compression Utility
- compressImage: Computes target dimensions based on maxWidth/maxHeight, then compresses via uni.compressImage.
- compressImages: Batch compression using Promise.all.
- getFileSize and validateFileSize: Size validation against UploadConfig.maxSize.

```mermaid
flowchart TD
Enter(["compressImage Entry"]) --> ReadMeta["Read image metadata"]
ReadMeta --> Compare{"Exceeds bounds?"}
Compare --> |No| SkipResize["Skip resize"]
Compare --> |Yes| Compute["Compute target dimensions"]
Compute --> Resize["Set width/height for compression"]
SkipResize --> Compress["Call uni.compressImage"]
Resize --> Compress
Compress --> Done(["Resolve with tempFilePath"])
```

**Diagram sources**
- [image-compress.ts:10-49](file://src/utils/image-compress.ts#L10-L49)

**Section sources**
- [image-compress.ts:10-87](file://src/utils/image-compress.ts#L10-L87)

### Image Loader and Preload Strategies
- ImageLoader: Manages a loading queue with maxConcurrent limit, retry logic, and status tracking per image.
- useImageLazyLoad: Composable exposing preloadImage, preloadImages, and getImageSrc with placeholder/error fallbacks.
- useProgressiveImage: Loads a low-quality image first, then replaces with high-quality after preloading.
- ImagePreloadStrategy: Preloads images near the viewport or next page to reduce perceived latency.

```mermaid
sequenceDiagram
participant Comp as "Component"
participant Hook as "useImageLazyLoad"
participant Loader as "ImageLoader"
participant Uni as "uni.getImageInfo"
Comp->>Hook : "preloadImage(src)"
Hook->>Loader : "preload(src)"
Loader->>Loader : "enqueue if not loading"
Loader->>Uni : "getImageInfo(src)"
Uni-->>Loader : "success/fail"
alt success
Loader-->>Hook : "loaded=true"
Hook-->>Comp : "getImageSrc() -> src"
else fail
Loader-->>Hook : "error=true"
Hook-->>Comp : "getImageSrc() -> placeholder/error"
end
```

**Diagram sources**
- [imageLoader.ts:197-246](file://src/utils/imageLoader.ts#L197-L246)
- [imageLoader.ts:26-177](file://src/utils/imageLoader.ts#L26-L177)

**Section sources**
- [imageLoader.ts:26-177](file://src/utils/imageLoader.ts#L26-L177)
- [imageLoader.ts:197-246](file://src/utils/imageLoader.ts#L197-L246)
- [imageLoader.ts:289-353](file://src/utils/imageLoader.ts#L289-L353)

### Upload Pipeline with Compression and Persistence
- QiniuService:
  - getConfig: Retrieves upload configuration (max size, dimensions, quality).
  - validateFileSize: Ensures file size compliance.
  - compressImage: Applies compression using UploadConfig.
  - getUploadToken: Obtains token/key/domain from backend.
  - uploadImage: Performs uni.uploadFile and resolves UploadResult.
  - uploadImages: Sequentially uploads multiple files.
  - saveFileRecord: Persists file record on success.
- ImageUploader:
  - Integrates uni.chooseImage, calls qiniuService.uploadImage, updates progress, and emits change events.

```mermaid
sequenceDiagram
participant Up as "ImageUploader.vue"
participant QS as "QiniuService"
participant QC as "UploadConfig"
participant QT as "UploadToken"
participant QN as "Qiniu Upload"
Up->>QS : "uploadImage(file, type, onProgress)"
QS->>QC : "getConfig()"
QC-->>QS : "maxSize, maxWidth, maxHeight, quality"
QS->>QS : "validateFileSize(file, maxSize)"
QS->>QS : "compressImage(file, {maxWidth,maxHeight,quality})"
QS->>QT : "getUploadToken(type, filename)"
QT-->>QS : "token,key,domain"
QS->>QN : "uni.uploadFile(token,key)"
QN-->>QS : "result {key,url,hash}"
QS-->>Up : "UploadResult"
Up->>QS : "saveFileRecord(key,type,originalName)"
```

**Diagram sources**
- [qiniu.service.ts:42-122](file://src/services/qiniu.service.ts#L42-L122)
- [ImageUploader.vue:97-114](file://src/components/ImageUploader.vue#L97-L114)
- [qiniu.ts:15-25](file://src/types/qiniu.ts#L15-L25)

**Section sources**
- [qiniu.service.ts:12-126](file://src/services/qiniu.service.ts#L12-L126)
- [ImageUploader.vue:32-153](file://src/components/ImageUploader.vue#L32-L153)
- [qiniu.ts:1-38](file://src/types/qiniu.ts#L1-L38)

### Recommendation System Integration
- useRecommendation composable fetches recommendation data and manages pagination/cursor.
- home.ts defines API endpoints for recommendation feed, banners, topics, user interests, location, and config.
- While the home module is currently stubbed, the composable is ready to integrate cache keys/constants when backend endpoints are live.

```mermaid
flowchart TD
Start(["useRecommendation.fetchRecommendations"]) --> Params["Build params {page,pageSize,types,cursor}"]
Params --> Mock{"useMockData?"}
Mock --> |Yes| MockData["generateMockData(pageSize)"]
Mock --> |No| API["getRecommendationFeed(params)"]
API --> Success{"response ok?"}
Success --> |Yes| Merge["Merge items into state"]
Success --> |No| Fallback["Fallback to mock data"]
MockData --> Merge
Merge --> Done(["Update loading=false"])
Fallback --> Done
```

**Diagram sources**
- [useRecommendation.ts:32-82](file://src/pages/tabbar/home/composables/useRecommendation.ts#L32-L82)
- [home.ts:71-78](file://src/api/home.ts#L71-L78)

**Section sources**
- [useRecommendation.ts:1-202](file://src/pages/tabbar/home/composables/useRecommendation.ts#L1-L202)
- [home.ts:1-198](file://src/api/home.ts#L1-L198)

## Dependency Analysis
- CacheManager depends on MemoryCache and StorageCache singletons.
- QiniuService depends on image-compress utilities and UploadConfig types.
- ImageUploader depends on QiniuService and emits events for parent components.
- Pinia initialization supports persisted state; cache utilities complement it for transient and persistent data.

```mermaid
graph LR
CM["CacheManager"] --> MC["MemoryCache"]
CM --> SC["StorageCache"]
QS["QiniuService"] --> IC["image-compress.ts"]
QS --> QT["types/qiniu.ts"]
IU["ImageUploader.vue"] --> QS
IR["useRecommendation.ts"] --> AH["api/home.ts"]
PIN["main.ts"] --> CM
```

**Diagram sources**
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)
- [qiniu.service.ts:12-126](file://src/services/qiniu.service.ts#L12-L126)
- [ImageUploader.vue:32-153](file://src/components/ImageUploader.vue#L32-L153)
- [useRecommendation.ts:1-202](file://src/pages/tabbar/home/composables/useRecommendation.ts#L1-L202)
- [home.ts:1-198](file://src/api/home.ts#L1-L198)
- [main.ts:1-18](file://src/main.ts#L1-L18)

**Section sources**
- [cache.ts:273-318](file://src/utils/cache.ts#L273-L318)
- [qiniu.service.ts:12-126](file://src/services/qiniu.service.ts#L12-L126)
- [ImageUploader.vue:32-153](file://src/components/ImageUploader.vue#L32-L153)
- [useRecommendation.ts:1-202](file://src/pages/tabbar/home/composables/useRecommendation.ts#L1-L202)
- [home.ts:1-198](file://src/api/home.ts#L1-L198)
- [main.ts:1-18](file://src/main.ts#L1-L18)

## Performance Considerations
- MemoryCache
  - O(1) average-time operations for set/get/delete via Map.
  - clearOldest scans all entries to evict the oldest; complexity O(n). Consider periodic cleanup or a doubly-linked list for frequent eviction.
  - maxSize defaults to 100; adjust based on memory budget and typical payload sizes.
- StorageCache
  - JSON serialization overhead per item; keep payloads compact.
  - clearExpired iterates all keys with prefix; consider partitioning keys or TTL-aware indexing if storage grows large.
- Image compression
  - Compression quality and target dimensions directly impact CPU usage and bandwidth. Tune UploadConfig.quality and UploadConfig.maxWidth/Height for device capabilities.
  - validateFileSize prevents oversized uploads; combine with server-side limits.
- ImageLoader
  - maxConcurrent defaults to 3; tune based on network conditions and device performance.
  - Retry logic with retryDelay mitigates transient failures; avoid excessive retryTimes to prevent resource thrash.
- Recommendation system
  - Virtualization and lazy loading reduce DOM and image load pressure.
  - Preload strategies minimize perceived latency; balance preloadCount/threshold with memory/network budgets.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Cache errors
  - MemoryCache.get returns null on miss/expiry; ensure callers handle null gracefully.
  - StorageCache catches exceptions during set/get/remove/clear; inspect console logs for underlying storage errors.
  - Use CacheManager.clearAllExpired to proactively remove stale entries.
- Upload failures
  - validateFileSize throws if file exceeds maxSize; surface user-friendly messages.
  - QiniuService.getUploadToken and uni.uploadFile may fail; handle rejection and retry with exponential backoff if needed.
  - ImageUploader removes failed items and shows toast; confirm network connectivity and token validity.
- Image loading issues
  - useImageLazyLoad.getImageSrc falls back to placeholder/errorImage; verify placeholder URLs and errorImage availability.
  - ImageLoader maintains internal status; use getImageStatus for diagnostics.

**Section sources**
- [cache.ts:94-105](file://src/utils/cache.ts#L94-L105)
- [cache.ts:183-204](file://src/utils/cache.ts#L183-L204)
- [qiniu.service.ts:49-52](file://src/services/qiniu.service.ts#L49-L52)
- [ImageUploader.vue:116-128](file://src/components/ImageUploader.vue#L116-L128)
- [imageLoader.ts:159-161](file://src/utils/imageLoader.ts#L159-L161)

## Conclusion
The WeTogether platform employs a layered cache strategy combining in-memory and persistent caches with explicit TTLs and eviction policies. The upload pipeline integrates compression and validation to optimize bandwidth and storage costs. Image loading utilities mitigate perceived latency through preloading and progressive loading. These utilities provide a robust foundation for performance optimization and scalable data persistence.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Implementation Examples

- Using MemoryCache and StorageCache
  - Set and get with custom TTL: [cache.ts:35-48](file://src/utils/cache.ts#L35-L48), [cache.ts:166-178](file://src/utils/cache.ts#L166-L178)
  - Check existence and delete: [cache.ts:73-82](file://src/utils/cache.ts#L73-L82), [cache.ts:216-222](file://src/utils/cache.ts#L216-L222)
  - Clear expired and all: [cache.ts:306-317](file://src/utils/cache.ts#L306-L317)

- Applying cache keys and TTL constants
  - Recommendation feed key: [cache.ts:325](file://src/utils/cache.ts#L325)
  - TTL constant: [cache.ts:345](file://src/utils/cache.ts#L345)

- Image compression configuration
  - Single image compression: [image-compress.ts:10-49](file://src/utils/image-compress.ts#L10-L49)
  - Batch compression: [image-compress.ts:54-60](file://src/utils/image-compress.ts#L54-L60)
  - File size validation: [image-compress.ts:80-87](file://src/utils/image-compress.ts#L80-L87)

- Upload pipeline integration
  - Upload with compression and token: [qiniu.service.ts:42-87](file://src/services/qiniu.service.ts#L42-L87)
  - UI component progress and success handling: [ImageUploader.vue:97-114](file://src/components/ImageUploader.vue#L97-L114)

- Image loading strategies
  - Lazy loading with placeholders: [imageLoader.ts:197-246](file://src/utils/imageLoader.ts#L197-L246)
  - Preload next page images: [imageLoader.ts:302-322](file://src/utils/imageLoader.ts#L302-L322)
  - Preload nearby images: [imageLoader.ts:330-352](file://src/utils/imageLoader.ts#L330-L352)

- Platform-specific storage limitations
  - uni storage operations are used for persistence; monitor quota and handle exceptions during set/get/remove/clear. See [storage.ts:11-25](file://src/utils/storage.ts#L11-L25) and [cache.ts:173-177](file://src/utils/cache.ts#L173-L177).

**Section sources**
- [cache.ts:35-48](file://src/utils/cache.ts#L35-L48)
- [cache.ts:166-178](file://src/utils/cache.ts#L166-L178)
- [cache.ts:73-82](file://src/utils/cache.ts#L73-L82)
- [cache.ts:216-222](file://src/utils/cache.ts#L216-L222)
- [cache.ts:306-317](file://src/utils/cache.ts#L306-L317)
- [cache.ts:325](file://src/utils/cache.ts#L325)
- [cache.ts:345](file://src/utils/cache.ts#L345)
- [image-compress.ts:10-49](file://src/utils/image-compress.ts#L10-L49)
- [image-compress.ts:54-60](file://src/utils/image-compress.ts#L54-L60)
- [image-compress.ts:80-87](file://src/utils/image-compress.ts#L80-L87)
- [qiniu.service.ts:42-87](file://src/services/qiniu.service.ts#L42-L87)
- [ImageUploader.vue:97-114](file://src/components/ImageUploader.vue#L97-L114)
- [imageLoader.ts:197-246](file://src/utils/imageLoader.ts#L197-L246)
- [imageLoader.ts:302-322](file://src/utils/imageLoader.ts#L302-L322)
- [imageLoader.ts:330-352](file://src/utils/imageLoader.ts#L330-L352)
- [storage.ts:11-25](file://src/utils/storage.ts#L11-L25)
- [cache.ts:173-177](file://src/utils/cache.ts#L173-L177)