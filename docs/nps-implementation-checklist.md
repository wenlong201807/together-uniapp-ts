# NPS反馈系统实施清单

## ✅ 已完成

### 后端（100%）
- [x] 数据库表设计（NPSFeedback, NPSTriggerLog, NPSStatistics, NPSTag）
- [x] NPSService 核心服务
- [x] NPSController API接口
- [x] 防打扰策略（45天间隔、季度上限）
- [x] 用户分类计算（推荐者/被动者/贬损者）
- [x] 优先级自动计算
- [x] 积分奖励机制
- [x] 数据统计和看板
- [x] 业务流程文档

### 前端（100%）
- [x] API服务层（`src/api/nps.ts`）
- [x] NPSModal组件（`src/components/business/NPSModal.vue`）
- [x] useNPS Composable（`src/composables/useNPS.ts`）
- [x] 首页定期触发集成（`src/pages/tabbar/home.vue`）
- [x] 设置页面手动触发入口（`src/pages/user/settings.vue`）
- [x] 前端使用文档（`docs/nps-frontend-guide.md`）

## 📋 待完成

### 集成工作
- [ ] 将NPSModule注册到AppModule
- [ ] 初始化标签数据
- [ ] 配置定时任务（每日统计）
- [ ] 配置通知服务（贬损者告警）

### 管理后台
- [ ] 反馈列表页面
- [ ] 反馈详情页面
- [ ] 数据看板页面
- [ ] 处理工作台
- [ ] 回访功能界面

### 测试
- [ ] 前端组件单元测试
- [ ] API接口集成测试
- [ ] E2E测试
- [ ] 防打扰规则测试
- [ ] 性能测试

### 优化
- [ ] AI情感分析
- [ ] 自动标签提取
- [ ] 智能分配规则
- [ ] 邮件/短信通知
- [ ] 数据导出功能

## 🎯 核心功能验证

### 用户端
1. 打开首页，3秒后应显示NPS弹窗（如果满足触发条件）
2. 选择评分0-10分
3. 根据评分查看不同的反馈标题和标签
4. 填写反馈原因（至少10字）
5. 选择标签（最多3个）
6. 提交反馈
7. 查看感谢页面和积分奖励
8. 3秒后自动关闭

### 手动触发
1. 进入设置页面
2. 点击"意见反馈"
3. 显示NPS弹窗
4. 完成反馈流程

### 防打扰验证
1. 提交反馈后45天内不再触发
2. 每季度最多触发2次
3. 新用户7天内不触发
4. 手动触发不受限制

## 📊 数据验证

### 数据库检查
```sql
-- 查看反馈记录
SELECT * FROM nps_feedback ORDER BY created_at DESC LIMIT 10;

-- 查看触发记录
SELECT * FROM nps_trigger_log ORDER BY created_at DESC LIMIT 10;

-- 查看统计数据
SELECT * FROM nps_statistics ORDER BY date DESC LIMIT 7;

-- 查看标签
SELECT * FROM nps_tags WHERE is_active = 1;
```

### API测试
```bash
# 检查是否可以触发
curl -X GET http://localhost:8125/api/nps/can-trigger \
  -H "Authorization: Bearer {token}"

# 提交反馈
curl -X POST http://localhost:8125/api/nps/submit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 9,
    "reason": "功能很好用",
    "tags": ["功能强大", "界面美观"],
    "triggerType": "auto",
    "triggerScene": "periodic"
  }'

# 获取看板数据
curl -X GET http://localhost:8125/api/nps/dashboard \
  -H "Authorization: Bearer {token}"
```

## 🚀 部署步骤

### 1. 后端部署
```bash
cd servest

# 安装依赖
pnpm install

# 数据库同步（自动创建表）
# DB_SYNCHRONIZE=true 已在 .env 中配置

# 启动服务
pnpm start:dev

# 初始化标签数据（待实现）
pnpm seed:nps-tags
```

### 2. 前端部署
```bash
cd together-uniapp-ts

# 安装依赖
pnpm install

# 开发模式
pnpm dev:h5

# 构建生产版本
pnpm build:h5
```

### 3. 验证部署
- [ ] 后端API正常响应
- [ ] 前端组件正常显示
- [ ] 数据正确保存到数据库
- [ ] 积分正确到账
- [ ] 防打扰规则生效

## 📝 文档清单

### 产品文档
- [x] [NPS产品决策文档](../server-nest/docs/product/nps-product-decision.md)
- [x] [NPS实施总结](../server-nest/docs/product/nps-implementation-summary.md)

### 技术文档
- [x] [NPS业务流程](../server-nest/docs/sys-biz/07-nps-flow.md)
- [x] [前端使用指南](./nps-frontend-guide.md)
- [x] [实施清单](./nps-implementation-checklist.md)

### API文档
- [x] Swagger文档：http://localhost:8125/api/docs

## 🎉 里程碑

- **2026-04-24**: 后端核心功能完成
- **2026-04-24**: 前端组件完成
- **待定**: 管理后台完成
- **待定**: 灰度发布
- **待定**: 全量上线

---

**当前状态**: 🟢 核心功能已完成  
**完成度**: 后端 100% | 前端 100% | 管理后台 0% | 测试 0%  
**下一步**: 集成到主应用并进行测试
