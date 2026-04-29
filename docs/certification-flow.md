# 认证中心业务流程图

## 完整业务流程

```mermaid
flowchart TD
    Start([用户进入认证中心]) --> CheckLogin{检查登录状态}
    
    CheckLogin -->|未登录| ShowToast1[显示"请先登录"提示]
    ShowToast1 --> NavigateBack1[返回上一页]
    
    CheckLogin -->|已登录| LoadData[并行加载数据]
    
    LoadData --> LoadTypes[API: GET /certification-types<br/>加载认证类型列表]
    LoadData --> LoadMyCerts[API: GET /certification/list<br/>加载我的认证记录]
    
    LoadTypes -->|成功| ParseTypes[解析认证类型数据<br/>certTypes.value = res.data.list]
    LoadTypes -->|失败| ShowError1[Toast: 加载认证类型失败]
    
    LoadMyCerts -->|成功| ParseMyCerts[解析我的认证记录<br/>myCerts.value = res.data.list]
    LoadMyCerts -->|失败| ShowError2[Toast: 加载我的认证失败]
    
    ParseTypes --> RenderList[渲染认证类型列表]
    ParseMyCerts --> RenderList
    ShowError1 --> RenderList
    ShowError2 --> RenderList
    
    RenderList --> DisplayUI[显示UI界面]
    
    DisplayUI --> UIElements[UI元素展示]
    
    UIElements --> ShowCertTypes[认证类型卡片列表<br/>- 图标: getCertImage显示缩略图<br/>- 名称: type.name<br/>- 状态徽章: getCertStatus<br/>- 描述: type.description<br/>- 箭头: ›]
    
    UIElements --> ShowMyCerts[我的认证列表<br/>- 认证名称<br/>- 申请时间<br/>- 状态标签]
    
    ShowCertTypes --> UserClick{用户点击认证类型}
    
    UserClick --> GoToApply[跳转到申请页面<br/>uni.navigateTo<br/>/pages/certification/apply?type=code]
    
    GoToApply --> ApplyPage[认证申请页面]
    
    ApplyPage --> ApplyMounted[页面加载 onMounted]
    
    ApplyMounted --> GetTypeParam[获取URL参数<br/>certType = currentPage.options?.type]
    
    GetTypeParam --> LoadTypeInfo[API: GET /certification-types<br/>获取认证类型详情]
    
    LoadTypeInfo -->|成功| ShowTypeInfo[显示认证类型信息<br/>- 标题: certTypeName<br/>- 描述: certTypeDescription]
    LoadTypeInfo -->|失败| ShowTypeInfoError[使用默认标题"认证申请"]
    
    ShowTypeInfo --> ApplyForm[显示申请表单]
    ShowTypeInfoError --> ApplyForm
    
    ApplyForm --> FormElements[表单元素]
    
    FormElements --> UploadArea[上传区域<br/>- 未上传: 显示"+"占位符<br/>- 已上传: 显示预览图]
    FormElements --> DescInput[补充说明输入框<br/>- 可选填<br/>- 最多200字<br/>- 显示字符计数]
    FormElements --> SubmitBtn[提交按钮<br/>- 提交中时禁用<br/>- 显示"提交中..."或"提交申请"]
    
    UploadArea --> UserChooseImage{用户点击上传}
    
    UserChooseImage --> ChooseImage[uni.chooseImage<br/>- count: 1<br/>- sizeType: compressed<br/>- sourceType: album/camera]
    
    ChooseImage -->|成功| GetTempPath[获取临时文件路径<br/>支持多种格式:<br/>- tempFilePaths<br/>- tempFiles.path<br/>- tempFiles.base64]
    
    GetTempPath --> ShowPreview[立即显示本地预览<br/>formData.imageUrl = tempFilePath]
    
    ShowPreview --> UploadToQiniu[上传到七牛云<br/>uploading = true<br/>显示Loading]
    
    UploadToQiniu --> CallUploadAPI[API: fileApi.uploadFile<br/>参数: localPath, type='certificate']
    
    CallUploadAPI -->|成功| UpdateImageUrl[更新为云端URL<br/>formData.imageUrl = result.url<br/>Toast: 上传成功]
    CallUploadAPI -->|失败| UploadFailed[清空图片<br/>formData.imageUrl = ''<br/>Toast: 上传失败]
    
    UpdateImageUrl --> WaitSubmit[等待用户提交]
    UploadFailed --> WaitSubmit
    
    SubmitBtn --> UserSubmit{用户点击提交}
    
    UserSubmit --> ValidateImage{验证图片}
    
    ValidateImage -->|未上传| ShowToast2[Toast: 请上传证件照片]
    ValidateImage -->|上传中| ShowToast3[Toast: 图片上传中，请稍候]
    ValidateImage -->|已上传| SubmitAPI[API: POST /certification<br/>提交认证申请]
    
    ShowToast2 --> WaitSubmit
    ShowToast3 --> WaitSubmit
    
    SubmitAPI -->|成功| SubmitSuccess[submitting = false<br/>Toast: 提交成功<br/>延迟1.5秒]
    SubmitAPI -->|失败| SubmitFailed[submitting = false<br/>Toast: 提交失败]
    
    SubmitSuccess --> NavigateBack2[uni.navigateBack<br/>返回列表页]
    SubmitFailed --> WaitSubmit
    
    NavigateBack2 --> TriggerOnShow[触发列表页 onShow]
    
    TriggerOnShow --> RefreshList[刷新列表数据<br/>重新调用 loadData]
    
    RefreshList --> UpdateUI[更新UI显示<br/>- 更新状态徽章<br/>- 更新缩略图<br/>- 更新我的认证列表]
    
    UpdateUI --> End([流程结束])
    
    style Start fill:#e1f5e1
    style End fill:#ffe1e1
    style CheckLogin fill:#fff4e1
    style ValidateImage fill:#fff4e1
    style UserClick fill:#fff4e1
    style UserChooseImage fill:#fff4e1
    style UserSubmit fill:#fff4e1
    style LoadData fill:#e1f0ff
    style UploadToQiniu fill:#e1f0ff
    style SubmitAPI fill:#e1f0ff
```

## 关键UI交互细节

### 1. 认证列表页 (index.vue)

#### 认证类型卡片
- **图标显示逻辑** (getCertImage):
  - 优先显示已通过认证的图片
  - 其次显示待审核的图片
  - 最后显示最新提交的图片
  - 无认证记录时显示默认emoji "📋"

- **状态徽章** (getCertStatus):
  - 已认证: 绿色 #52c41a
  - 审核中: 橙色 #faad14
  - 已拒绝: 红色 #ff4d4f
  - 未申请: 不显示徽章

- **点击行为**:
  - 整个卡片可点击
  - 跳转到申请页面，携带 type 参数

#### 我的认证列表
- 显示所有认证记录
- 包含认证名称、申请时间、状态
- 按提交时间倒序排列

### 2. 认证申请页 (apply.vue)

#### 图片上传流程
1. 用户点击上传区域
2. 调用 uni.chooseImage 选择图片
3. 获取临时文件路径（支持多种格式）
4. **立即显示本地预览**（用户体验优化）
5. 后台上传到七牛云
6. 上传成功后替换为云端URL
7. 上传失败则清空图片

#### 表单验证
- 图片必填
- 等待上传完成才能提交
- 描述选填，最多200字

#### 提交流程
1. 验证图片已上传
2. 验证上传未进行中
3. 调用提交API
4. 成功后延迟1.5秒返回
5. 触发列表页刷新

### 3. 个人中心认证页 (certification.vue)

这是另一个认证入口，功能更完整：

#### 统计卡片
- 已认证数量
- 待审核数量
- 总认证类型数

#### 认证网格
- 2列网格布局
- 每个卡片显示图标、名称、状态、描述
- 必填项显示红色"必填"标签

#### 弹窗交互
- **申请弹窗**: 支持多图上传、备注说明
- **详情弹窗**: 显示认证材料、状态、拒绝原因、审核时间

## 潜在问题分析

### 问题1: 页面数据不一致
**现象**: 存在两个认证页面，数据结构可能不一致
- `/pages/certification/index.vue` - 简化版
- `/pages/profile/certification.vue` - 完整版

**影响**:
- API调用不同（certification vs profile）
- 数据字段可能不匹配
- 用户体验不统一

### 问题2: 图片上传时序问题
**现象**: apply.vue 中先显示本地预览，再上传云端
```javascript
// 先显示预览
formData.value.imageUrl = tempFilePath
// 立即上传到七牛云
uploadImage(tempFilePath)
```

**潜在风险**:
- 用户可能在上传完成前点击提交
- 虽然有 uploading 状态检查，但用户体验可能混乱
- 本地路径和云端URL混用可能导致显示问题

### 问题3: 状态刷新机制
**现象**: 使用 onShow 监听页面显示来刷新数据
```javascript
onShow(() => {
  if (authStore.isLoggedIn) {
    loadData();
  }
});
```

**问题**:
- 每次页面显示都会重新加载
- 可能导致不必要的API调用
- 没有加载状态提示，用户可能看到闪烁

### 问题4: 错误处理不完整
**现象**: API失败时只显示Toast，不影响页面渲染
```javascript
catch (error) {
  console.error('Failed to load cert types:', error)
  uni.showToast({ title: '加载认证类型失败', icon: 'none' })
}
```

**问题**:
- 失败后 certTypes 为空数组
- 页面显示"暂无可用认证类型"
- 用户无法区分是真的没有数据还是加载失败
- 没有重试机制

### 问题5: 图片优先级逻辑复杂
**现象**: getCertImage 函数逻辑复杂
```javascript
const sortedCerts = typeCerts.sort((a, b) => {
  const statusPriority = { 1: 3, 0: 2, 2: 1 };
  // 复杂的排序逻辑
});
```

**问题**:
- 每次渲染都要重新计算
- 没有缓存机制
- 可能影响性能

## 建议修复方案

### 修复1: 统一认证页面
- 保留一个主认证页面
- 或确保两个页面使用相同的API和数据结构

### 修复2: 优化上传流程
- 禁用提交按钮直到上传完成
- 添加明确的上传进度提示
- 区分本地预览和云端URL

### 修复3: 优化刷新机制
- 添加下拉刷新功能
- 显示加载状态
- 避免频繁的自动刷新

### 修复4: 完善错误处理
- 区分空数据和加载失败
- 添加重试按钮
- 提供更友好的错误提示

### 修复5: 性能优化
- 使用 computed 缓存计算结果
- 减少不必要的重复计算
