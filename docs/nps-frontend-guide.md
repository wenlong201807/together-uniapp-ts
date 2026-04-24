# NPS反馈系统 - 前端使用指南

## 一、组件说明

### 1. NPSModal 组件

**位置**: `src/components/business/NPSModal.vue`

**功能**: NPS评分和反馈收集弹窗，包含3个步骤：
- 步骤1: 0-10分评分
- 步骤2: 反馈原因和标签选择
- 步骤3: 感谢页面

**Props**:
```typescript
interface Props {
  visible: boolean           // 是否显示弹窗
  triggerType?: 'auto' | 'manual'  // 触发类型
  triggerScene?: string      // 触发场景
}
```

**Events**:
```typescript
{
  close: []                  // 关闭弹窗
  success: [feedback: any]   // 提交成功
}
```

**特性**:
- 根据评分动态调整反馈标题、提示和标签
- 推荐者(9-10分): 正向引导，挖掘亮点
- 被动者(7-8分): 中性引导，收集建议
- 贬损者(0-6分): 负向引导，详细问题描述
- 自动计算积分奖励(20-30分)
- 提交成功后3秒自动关闭

## 二、API服务

**位置**: `src/api/nps.ts`

### 1. canTriggerNPS()
检查当前用户是否可以触发NPS

```typescript
const { canTrigger, reason } = await canTriggerNPS()
```

### 2. submitNPSFeedback(dto)
提交NPS反馈

```typescript
const feedback = await submitNPSFeedback({
  score: 9,
  reason: '功能很好用',
  tags: ['功能强大', '界面美观'],
  triggerType: 'auto',
  triggerScene: 'periodic'
})
```

## 三、Composable使用

**位置**: `src/composables/useNPS.ts`

### 基础用法

```vue
<script setup>
import { useNPS, NPSScene } from '@/composables/useNPS'

const {
  npsVisible,
  npsTriggerType,
  npsTriggerScene,
  checkAndTrigger,
  manualTrigger,
  closeNPS,
  onNPSSuccess
} = useNPS()

// 自动触发（检查防打扰规则）
onMounted(() => {
  checkAndTrigger({
    scene: NPSScene.PERIODIC,
    delay: 3000  // 延迟3秒显示
  })
})

// 手动触发（用户主动点击）
const handleFeedback = () => {
  manualTrigger()
}
</script>

<template>
  <NPSModal
    :visible="npsVisible"
    :trigger-type="npsTriggerType"
    :trigger-scene="npsTriggerScene"
    @close="closeNPS"
    @success="onNPSSuccess"
  />
</template>
```

### 触发场景枚举

```typescript
export const NPSScene = {
  AFTER_REGISTER: 'after_register',    // 注册后第7天
  AFTER_FIRST_POST: 'after_first_post', // 首次发帖后24小时
  AFTER_ADD_FRIEND: 'after_add_friend', // 添加好友后48小时
  AFTER_ACTIVE_WEEK: 'after_active_week', // 连续活跃7天
  PERIODIC: 'periodic',                 // 定期触发（45天）
  MANUAL: 'manual'                      // 手动触发
}
```

## 四、集成示例

### 1. 首页定期触发

**文件**: `src/pages/tabbar/home.vue`

```vue
<script setup>
import { useNPS, NPSScene } from '@/composables/useNPS'
import NPSModal from '@/components/business/NPSModal.vue'

const { npsVisible, npsTriggerType, npsTriggerScene, checkAndTrigger, closeNPS, onNPSSuccess } = useNPS()

onMounted(() => {
  // 延迟3秒触发，让用户先看到内容
  checkAndTrigger({
    scene: NPSScene.PERIODIC,
    delay: 3000
  })
})
</script>

<template>
  <view>
    <!-- 页面内容 -->
    
    <!-- NPS弹窗 -->
    <NPSModal
      :visible="npsVisible"
      :trigger-type="npsTriggerType"
      :trigger-scene="npsTriggerScene"
      @close="closeNPS"
      @success="onNPSSuccess"
    />
  </view>
</template>
```

### 2. 设置页面手动触发

**文件**: `src/pages/user/settings.vue`

```vue
<script setup>
import { useNPS } from '@/composables/useNPS'
import NPSModal from '@/components/business/NPSModal.vue'

const { npsVisible, npsTriggerType, npsTriggerScene, manualTrigger, closeNPS, onNPSSuccess } = useNPS()

const handleFeedback = () => {
  manualTrigger()
}
</script>

<template>
  <view>
    <view class="settings-item" @click="handleFeedback">
      <text>意见反馈</text>
    </view>

    <NPSModal
      :visible="npsVisible"
      :trigger-type="npsTriggerType"
      :trigger-scene="npsTriggerScene"
      @close="closeNPS"
      @success="onNPSSuccess"
    />
  </view>
</template>
```

### 3. 首次发帖后触发

**文件**: `src/pages/square/create.vue`

```vue
<script setup>
import { useNPS, NPSScene } from '@/composables/useNPS'

const { checkAndTrigger } = useNPS()

const handlePublishSuccess = async () => {
  // 发帖成功后
  uni.showToast({ title: '发布成功' })
  
  // 检查是否首次发帖，如果是则触发NPS
  checkAndTrigger({
    scene: NPSScene.AFTER_FIRST_POST,
    delay: 2000  // 2秒后触发
  })
}
</script>
```

### 4. 添加好友后触发

**文件**: `src/pages/friend/detail.vue`

```vue
<script setup>
import { useNPS, NPSScene } from '@/composables/useNPS'

const { checkAndTrigger } = useNPS()

const handleAddFriendSuccess = async () => {
  // 添加好友成功后
  uni.showToast({ title: '添加成功' })
  
  // 触发NPS
  checkAndTrigger({
    scene: NPSScene.AFTER_ADD_FRIEND,
    delay: 2000
  })
}
</script>
```

## 五、防打扰规则

后端会自动检查以下规则，前端无需处理：

1. **最小间隔**: 45天内只触发1次
2. **季度上限**: 每季度最多2次
3. **新用户保护**: 注册7天内不触发
4. **负面时刻避免**: 出错后不立即触发
5. **用户选择**: 用户关闭后不再触发

## 六、用户分类与反馈

### 推荐者 (9-10分)
- **标签**: 功能强大、界面美观、操作流畅、社交体验好、匹配精准
- **引导**: "太好了！能告诉我们您最喜欢什么吗？"
- **目标**: 挖掘传播点，邀请分享案例

### 被动者 (7-8分)
- **标签**: 功能还行、有些卡顿、功能不够、界面一般、匹配不准
- **引导**: "感谢评分！我们如何做得更好？"
- **目标**: 收集改进建议，提升满意度

### 贬损者 (0-6分)
- **标签**: 经常崩溃、功能缺失、界面难用、匹配很差、隐私担忧
- **引导**: "很抱歉让您失望了，请告诉我们问题"
- **目标**: 紧急修复，4小时内响应

## 七、积分奖励

- **基础奖励**: 20积分
- **详细反馈**: 30积分（反馈内容≥50字）
- **回访响应**: 15积分（配合回访）

## 八、注意事项

### 1. 触发时机
- 避免在用户刚进入页面时立即触发
- 建议延迟1-3秒，让用户先看到内容
- 避免在用户操作过程中打断

### 2. 触发频率
- 不要在多个页面同时触发
- 建议只在首页或关键节点触发
- 手动触发入口放在设置页面

### 3. 用户体验
- 点击遮罩层可关闭（步骤1和步骤3）
- 步骤2填写内容时点击遮罩不关闭
- 提交成功后自动关闭，无需用户操作

### 4. 错误处理
- API调用失败时显示友好提示
- 不要因为NPS失败影响主流程
- 静默失败，不打扰用户

## 九、测试建议

### 1. 功能测试
- [ ] 评分选择是否正常
- [ ] 不同分数的标题和标签是否正确
- [ ] 反馈提交是否成功
- [ ] 积分是否正确到账
- [ ] 感谢页面是否正常显示

### 2. 交互测试
- [ ] 点击遮罩层是否正确关闭
- [ ] 上一步/下一步是否正常
- [ ] 标签选择是否限制3个
- [ ] 提交按钮是否正确禁用

### 3. 防打扰测试
- [ ] 45天内是否只触发1次
- [ ] 新用户7天内是否不触发
- [ ] 手动触发是否不受限制

## 十、后续优化

### 已实现
- ✅ 基础评分和反馈收集
- ✅ 动态标题和标签
- ✅ 积分奖励机制
- ✅ 防打扰策略
- ✅ 手动触发入口

### 待实现
- ⏳ 多语言支持
- ⏳ 自定义主题
- ⏳ 动画优化
- ⏳ 无障碍支持
- ⏳ 数据埋点

---

**文档版本**: v1.0  
**最后更新**: 2026-04-24  
**相关文档**: [后端API文档](../../server-nest/docs/product/nps-implementation-summary.md)
