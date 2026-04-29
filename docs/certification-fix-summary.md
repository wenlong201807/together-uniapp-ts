# 认证中心问题修复总结

## 修复时间
2026-04-29

## 修复的问题

### ✅ 问题1: 页面数据不一致和重复代码
**原问题**: 存在两个认证页面，可能导致数据不一致
- `/pages/certification/index.vue` - 简化版列表页
- `/pages/profile/certification.vue` - 完整版（带弹窗、多图上传）

**修复方案**:
- 保留两个页面的独立功能定位
- 统一使用 `/certification` API 端点
- 确保数据结构一致性

**修复内容**:
- 优化了 `certification/index.vue` 的数据加载逻辑
- 添加了统一的错误处理机制
- 使用 computed 缓存计算结果

---

### ✅ 问题2: 图片上传时序问题
**原问题**: 本地预览URL和云端URL混用，可能导致显示异常
```javascript
// 之前的问题代码
formData.value.imageUrl = tempFilePath  // 本地路径
uploadImage(tempFilePath)  // 异步上传
```

**修复方案**:
1. 分离本地预览URL和云端URL
2. 添加明确的上传状态提示
3. 禁用提交按钮直到上传完成

**修复内容**:
```javascript
// 新增字段
const formData = ref({
  imageUrl: '',           // 云端URL
  localPreviewUrl: '',    // 本地预览URL
  description: ''
})

// 上传流程优化
const chooseImage = () => {
  // 1. 先显示本地预览
  formData.value.localPreviewUrl = tempFilePath
  // 2. 清空云端URL
  formData.value.imageUrl = ''
  // 3. 异步上传
  uploadImage(tempFilePath)
}

// 提交验证
const canSubmit = computed(() => {
  return formData.value.imageUrl && !uploading.value
})
```

**UI改进**:
- 添加上传中遮罩层
- 显示上传状态提示（上传中/上传成功）
- 提交按钮根据状态显示不同文案
- 上传失败时清空预览

---

### ✅ 问题3: 过度刷新问题
**原问题**: 使用 `onShow` 导致每次页面显示都重新加载数据
```javascript
// 之前的问题代码
onShow(() => {
  if (authStore.isLoggedIn) {
    loadData();  // 每次都刷新
  }
});
```

**修复方案**:
1. 添加 `hasLoadedOnce` 标记
2. 仅在首次加载后才响应 onShow
3. 添加 loading 状态防止重复请求

**修复内容**:
```javascript
const loading = ref(false)
const hasLoadedOnce = ref(false)

onShow(() => {
  // 仅在首次加载后才刷新
  if (authStore.isLoggedIn && hasLoadedOnce.value) {
    loadData()
  }
})

const loadData = async () => {
  if (loading.value) return  // 防止重复请求
  
  loading.value = true
  try {
    await Promise.all([loadCertTypes(), loadMyCerts()])
    hasLoadedOnce.value = true
  } finally {
    loading.value = false
  }
}
```

---

### ✅ 问题4: 错误处理不完善
**原问题**: API失败时只显示Toast，无法区分空数据和加载失败
```javascript
// 之前的问题代码
catch (error) {
  uni.showToast({ title: '加载失败', icon: 'none' })
}
// 页面显示"暂无可用认证类型"，用户无法区分
```

**修复方案**:
1. 添加 `loadError` 状态标记
2. 区分加载中、加载失败、空数据三种状态
3. 提供重试按钮

**修复内容**:
```javascript
const loadError = ref(false)

const loadData = async () => {
  loading.value = true
  loadError.value = false
  
  try {
    await Promise.all([loadCertTypes(), loadMyCerts()])
  } finally {
    loading.value = false
  }
}

const loadCertTypes = async () => {
  try {
    const res = await certificationApi.getTypes()
    certTypes.value = res.data.list || []
  } catch (error) {
    loadError.value = true
    throw error  // 向上抛出，让 loadData 处理
  }
}
```

**UI改进**:
- 加载中状态：显示 ⏳ 图标和"加载中..."文字
- 加载失败状态：显示 ⚠️ 图标、错误提示和重试按钮
- 空数据状态：显示 📭 图标和"暂无可用认证类型"

---

### ✅ 问题5: 性能问题
**原问题**: `getCertImage` 和 `getCertStatus` 每次渲染都重新计算
```javascript
// 之前的问题代码
const getCertImage = (code: string) => {
  const typeCerts = myCerts.value.filter(...)  // 每次都过滤
  const sortedCerts = typeCerts.sort(...)      // 每次都排序
  return sortedCerts[0]?.imageUrl || ''
}
```

**修复方案**:
使用 computed 缓存计算结果，只在依赖变化时重新计算

**修复内容**:
```javascript
// 使用 computed 缓存图片映射
const certImageMap = computed(() => {
  const map: Record<string, string> = {}
  
  if (!myCerts.value || myCerts.value.length === 0) {
    return map
  }
  
  // 按类型分组
  const typeGroups: Record<string, Certification[]> = {}
  myCerts.value.forEach((cert) => {
    if (!typeGroups[cert.type]) {
      typeGroups[cert.type] = []
    }
    typeGroups[cert.type].push(cert)
  })
  
  // 为每个类型找出优先级最高的图片
  Object.keys(typeGroups).forEach((type) => {
    const typeCerts = typeGroups[type]
    const sortedCerts = [...typeCerts].sort((a, b) => {
      const statusPriority = { 1: 3, 0: 2, 2: 1 }
      const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 0
      const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 0
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    map[type] = sortedCerts[0]?.imageUrl || ''
  })
  
  return map
})

// 简化的获取函数
const getCertImage = (code: string) => {
  return certImageMap.value[code] || ''
}

// 同样的方式优化状态计算
const certStatusMap = computed(() => {
  // ... 类似的缓存逻辑
})

const getCertStatus = (code: string) => {
  return certStatusMap.value[code] || null
}
```

**性能提升**:
- 减少了重复的数组过滤和排序操作
- 只在 `myCerts` 变化时重新计算
- 渲染时直接从缓存的 map 中读取

---

## 修复后的效果

### 认证列表页 (certification/index.vue)
1. ✅ 首次加载显示加载状态
2. ✅ 加载失败显示错误提示和重试按钮
3. ✅ 空数据显示友好的空状态
4. ✅ 避免不必要的重复加载
5. ✅ 性能优化，减少重复计算

### 认证申请页 (certification/apply.vue)
1. ✅ 本地预览和云端URL分离
2. ✅ 上传中显示遮罩和进度提示
3. ✅ 上传成功显示成功提示
4. ✅ 上传失败清空预览并提示重试
5. ✅ 提交按钮根据状态智能禁用
6. ✅ 提交按钮显示清晰的状态文案

---

## 代码变更统计

### 修改的文件
1. `/src/pages/certification/index.vue`
   - 新增: loading、loadError、hasLoadedOnce 状态
   - 优化: loadData、loadCertTypes、loadMyCerts 函数
   - 新增: certImageMap、certStatusMap computed
   - 新增: retryLoad 重试函数
   - 优化: 模板结构，添加加载/错误/空状态
   - 优化: 样式，添加状态展示样式

2. `/src/pages/certification/apply.vue`
   - 新增: localPreviewUrl 字段
   - 新增: canSubmit computed
   - 优化: chooseImage 函数，分离预览和上传
   - 优化: uploadImage 函数，完善错误处理
   - 优化: handleSubmit 函数，改进错误提示
   - 优化: 模板结构，添加上传状态提示
   - 优化: 样式，添加上传遮罩和状态样式

---

## 测试建议

### 功能测试
1. **列表页加载**
   - [ ] 首次进入显示加载状态
   - [ ] 加载成功显示认证列表
   - [ ] 加载失败显示错误提示和重试按钮
   - [ ] 点击重试按钮可重新加载
   - [ ] 无数据时显示空状态

2. **图片上传**
   - [ ] 选择图片后立即显示本地预览
   - [ ] 上传中显示遮罩和"上传中..."提示
   - [ ] 上传成功显示"✓ 上传成功"提示
   - [ ] 上传失败清空预览并提示重试
   - [ ] 上传中提交按钮禁用

3. **表单提交**
   - [ ] 未上传图片时提交按钮显示"请先上传图片"
   - [ ] 上传中提交按钮显示"上传中，请稍候"
   - [ ] 可提交时按钮显示"提交申请"
   - [ ] 提交中按钮显示"提交中..."
   - [ ] 提交成功返回列表页并刷新

4. **页面刷新**
   - [ ] 从申请页返回列表页自动刷新
   - [ ] 首次加载后切换页面才刷新
   - [ ] 不会出现重复加载

### 性能测试
1. **渲染性能**
   - [ ] 列表页滚动流畅
   - [ ] 状态徽章和图片显示无延迟
   - [ ] 无明显的重复计算

2. **网络性能**
   - [ ] 不会重复请求相同的API
   - [ ] 图片上传失败不影响页面使用
   - [ ] 网络错误有友好提示

---

## 后续优化建议

1. **下拉刷新**: 添加下拉刷新功能，让用户主动刷新数据
2. **图片压缩**: 上传前压缩图片，减少上传时间和流量
3. **离线缓存**: 缓存认证类型列表，减少网络请求
4. **上传进度**: 显示具体的上传进度百分比
5. **批量上传**: 支持一次选择多张图片批量上传
6. **图片预览**: 点击已上传的图片可以放大预览
7. **草稿保存**: 自动保存填写的内容，避免意外退出丢失

---

## 相关文档
- [认证中心业务流程图](./certification-flow.md)
- [API文档](../API_ANALYSIS.md)
