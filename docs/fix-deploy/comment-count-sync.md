# 评论计数同步更新修复

## 问题描述

在帖子详情页新增评论后，评论计数没有实时更新，需要刷新页面才能看到正确的评论数。

## 问题分析

### 当前流程

```
用户发表评论
    ↓
BilibiliComment 组件提交评论
    ↓
调用 squareApi.createComment()
    ↓
刷新评论列表
    ↓
触发 emit('success')
    ↓
post.vue 的 handleCommentSuccess
    ↓
只重新加载评论列表 ❌
```

**问题**：
1. `handleCommentSuccess` 只重新加载了评论列表
2. 没有更新 `currentPost.commentCount`
3. 导致页面顶部显示的评论数不变

### 数据流

```
squareStore
  ├─ currentPost (帖子详情)
  │   └─ commentCount (评论计数)
  ├─ posts (帖子列表)
  │   └─ [post].commentCount
  └─ comments (评论列表)
```

## 修复方案

### 1. 修复帖子详情页评论计数

**文件**: `src/pages/square/post.vue`

**修复前**：
```typescript
const handleCommentSuccess = async () => {
  replyToComment.value = undefined;
  // 只重新加载评论列表，不重新加载帖子详情，避免影响回复的展开/收起状态
  await squareStore.fetchComments(postId.value, {
    page: 1,
    pageSize: 20,
    sort: 'time',
  });
};
```

**修复后**：
```typescript
const handleCommentSuccess = async () => {
  replyToComment.value = undefined;

  // 更新评论计数
  if (squareStore.currentPost) {
    squareStore.currentPost.commentCount = (squareStore.currentPost.commentCount || 0) + 1;
  }

  // 重新加载评论列表
  await squareStore.fetchComments(postId.value, {
    page: 1,
    pageSize: 20,
    sort: 'time',
  });
};
```

**关键改进**：
- 在重新加载评论列表之前，先更新 `currentPost.commentCount`
- 使用 `+= 1` 增加计数，避免重新请求帖子详情
- 保持评论列表的展开/收起状态

### 2. Store 中的评论计数更新（已存在）

**文件**: `src/stores/square.ts`

```typescript
const createComment = async (data: CreateCommentDto) => {
  await squareApi.createComment(data);
  await fetchComments(data.postId);
  
  // 更新当前帖子的评论数
  if (currentPost.value && currentPost.value.id === data.postId) {
    currentPost.value.commentCount = (currentPost.value.commentCount || 0) + 1;
  }
  // 更新帖子列表中的评论数
  const post = posts.value.find((p) => p.id === data.postId);
  if (post) {
    post.commentCount = (post.commentCount || 0) + 1;
  }

**说明**：
- Store 中已经有更新逻辑，但只在直接调用 `createComment` 时生效
- `BilibiliComment` 组件直接调用 API，不经过 Store 的 `createComment`
- 因此需要在页面层面手动更新计数

## 数据同步流程

### 修复后的流程

```
用户发表评论
    ↓
BilibiliComment.submitComment()
    ↓
squareApi.createComment() (直接调用 API)
    ↓
刷新评论列表
    ↓
emit('success')
    ↓
post.vue.handleCommentSuccess()
    ↓
更新 currentPost.commentCount += 1 ✅
    ↓
重新加载评论列表
    ↓
页面显示更新后的评论数 ✅
```

### 评论计数更新的三个位置

1. **帖子详情页** (`post.vue`)
   - 在 `handleCommentSuccess` 中更新 `currentPost.commentCount`
   - 用于更新详情页顶部的评论数显示

2. **帖子列表** (`square.ts`)
   - 在 `createComment` 中更新 `posts` 数组中对应帖子的 `commentCount`
   - 用于更新列表页的评论数显示

3. **当前帖子** (`square.ts`)
   - 在 `createComment` 中更新 `currentPost.commentCount`
   - 与详情页的更新逻辑一致

## 验证步骤

### 1. 测试帖子详情页评论计数

1. 进入帖子详情页
2. 查看顶部评论数（例如：评论 (5)）
3. 发表一条新评论
4. 检查评论数是否立即更新为 (6)
5. 无需刷新页面

### 2. 测试返回列表页

1. 在详情页发表评论
2. 返回帖子列表页
3. 检查该帖子的评论数是否正确
4. 应该显示最新的评论数

### 3. 测试回复评论

1. 回复某条评论
2. 检查顶部评论数是否增加
3. 回复也算作一条评论

### 4. 测试多次评论

1. 连续发表多条评论
2. 检查评论数是否正确累加
3. 例如：5 → 6 → 7 → 8

## 注意事项

### 1. 为什么不重新请求帖子详情？

**原因**：
- 重新请求会导致评论列表的展开/收起状态丢失
- 用户体验不好，正在查看的回复会突然收起
- 只更新计数更高效，避免不必要的网络请求

### 2. 评论计数的一致性

**保证一致性的方法**：
- 前端乐观更新：立即 `+= 1`
- 后端返回最新数据：下次刷新时同步
- 如果评论失败，需要回滚计数（当前未实现）

### 3. 删除评论时的计数更新

**当前状态**：
- 删除评论时也需要更新计数 `-= 1`
- 需要在 `BilibiliComment` 组件的 `deleteComment` 方法中处理
- 建议后续优化

## 相关文件

- `together-uniapp-ts/src/pages/square/post.vue` - 帖子详情页
- `together-uniapp-ts/src/stores/square.ts` - 广场状态管理
- `together-uniapp-ts/src/components/business/BilibiliComment.vue` - 评论组件
- `together-uniapp-ts/src/components/business/PostCard.vue` - 帖子卡片组件

## 后续优化建议

### 1. 统一评论 API 调用

**建议**：
```typescript
// BilibiliComment.vue
const submitComment = async () => {
  // 使用 Store 的方法，而不是直接调用 API
  await squareStore.createComment(commentData);
  // Store 会自动更新所有相关的计数
};
```

### 2. 添加错误回滚

**建议**：
```typescript
const handleCommentSuccess = async () => {
  // 乐观更新
  const originalCount = squareStore.currentPost?.commentCount || 0;
  if (squareStore.currentPost) {
    squareStore.currentPost.commentCount = originalCount + 1;
  }

  try {
    await squareStore.fetchComments(postId.value, { ... });
  } catch (error) {
    // 失败时回滚
    if (squareStore.currentPost) {
      squareStore.currentPost.commentCount = originalCount;
    }
  }
};
```

### 3. 删除评论时更新计数

**建议**：
```typescript
// BilibiliComment.vue
const deleteComment = async (comment: Comment) => {
  await squareApi.deleteComment(comment.id);
  
  // 触发计数更新
  emit('delete');
};

// post.vue
const handleCommentDelete = () => {
  if (squareStore.currentPost) {
    squareStore.currentPost.commentCount = Math.max(0, (squareStore.currentPost.commentCount || 0) - 1);
  }
};
```

## 修复时间

2026-04-20
