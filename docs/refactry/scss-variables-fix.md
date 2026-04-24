# SCSS 变量修复总结

## 问题描述

在编译过程中遇到了多个 SCSS 变量未定义的错误：

1. `$radius-full` - 完全圆角变量
2. `$font-size-md` - 中等字体大小变量

## 修复内容

### 1. 添加缺失的 SCSS 变量

**文件**: `src/assets/styles/design-tokens.scss`

```scss
// ==================== 圆角系统 ====================

$radius-xs: 4rpx;
$radius-sm: 8rpx;
$radius-base: 12rpx;
$radius-md: 16rpx;      // ✅ 已存在
$radius-lg: 20rpx;
$radius-xl: 24rpx;
$radius-circle: 50%;
$radius-full: 9999rpx;  // ✅ 新增：完全圆角
```

### 2. 替换未定义的变量

**文件**: `src/pages/tabbar/home/components/TopNavigation.vue`

```scss
// ❌ 修复前
.location-icon {
  font-size: $font-size-md;  // 未定义
}

.search-icon {
  font-size: $font-size-md;  // 未定义
}

// ✅ 修复后
.location-icon {
  font-size: $font-size-base;  // 使用已定义的变量
}

.search-icon {
  font-size: $font-size-base;  // 使用已定义的变量
}
```

## 设计 Token 完整列表

### 字体大小
```scss
$font-size-xs: 20rpx;    // 超小
$font-size-sm: 24rpx;    // 小
$font-size-base: 28rpx;  // 基础（默认）
$font-size-lg: 32rpx;    // 大
$font-size-xl: 36rpx;    // 超大
$font-size-xxl: 48rpx;   // 特大
```

### 圆角
```scss
$radius-xs: 4rpx;        // 超小圆角
$radius-sm: 8rpx;        // 小圆角
$radius-base: 12rpx;     // 基础圆角
$radius-md: 16rpx;       // 中等圆角
$radius-lg: 20rpx;       // 大圆角
$radius-xl: 24rpx;       // 超大圆角
$radius-circle: 50%;     // 圆形
$radius-full: 9999rpx;   // 完全圆角（胶囊形）
```

## 使用建议

### 1. 字体大小选择

- **$font-size-xs (20rpx)**: 辅助文字、标签、徽章
- **$font-size-sm (24rpx)**: 次要文字、说明文字
- **$font-size-base (28rpx)**: 正文、主要内容（推荐）
- **$font-size-lg (32rpx)**: 标题、重要文字
- **$font-size-xl (36rpx)**: 大标题
- **$font-size-xxl (48rpx)**: 特大标题、数字展示

### 2. 圆角选择

- **$radius-xs/sm**: 按钮、输入框
- **$radius-base/md**: 卡片、面板
- **$radius-lg/xl**: 大卡片、模态框
- **$radius-circle**: 头像、图标按钮
- **$radius-full**: 标签、徽章、搜索框

### 3. 避免使用未定义的变量

在编写 SCSS 时，请参考 `design-tokens.scss` 中已定义的变量，避免使用：
- ❌ `$font-size-md` (不存在)
- ❌ `$radius-medium` (不存在)
- ❌ `$spacing-medium` (不存在)

正确使用：
- ✅ `$font-size-base` 或 `$font-size-lg`
- ✅ `$radius-md` 或 `$radius-lg`
- ✅ `$spacing-md` 或 `$spacing-lg`

## 项目启动命令

```bash
# H5 开发环境
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin

# H5 生产构建
npm run build:h5:prod
```

## 验证修复

所有 SCSS 编译错误已修复：
- ✅ `$radius-full` 已添加到 design-tokens.scss
- ✅ TopNavigation.vue 中的 `$font-size-md` 已替换为 `$font-size-base`
- ✅ 所有组件现在都使用已定义的设计 token

## 后续建议

1. **统一设计规范**: 所有新组件都应使用 design-tokens.scss 中定义的变量
2. **代码审查**: 在 PR 中检查是否使用了未定义的 SCSS 变量
3. **文档维护**: 当添加新的设计 token 时，更新文档说明

---

**修复日期**: 2026-04-24  
**修复文件数**: 2  
**状态**: ✅ 已完成
