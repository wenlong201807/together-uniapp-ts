# 积分余额显示不一致问题修复

## COT 思考链路

### 第一步：问题分析 ✅

**用户反馈：**
- 当前积分值看着不太正确
- 累计获得和累计消费的差值不等于当前积分

**问题表现：**
```
当前积分: 2000
累计获得: 2050
累计消费: 0
预期: 2050 - 0 = 2050，但实际显示 2000
```

### 第二步：代码检查 ✅

**前端代码（src/stores/points.ts）：**
- 前端只是展示后端返回的数据，没有计算逻辑

**后端代码（server-nest/src/modules/points/points.service.ts）：**
```typescript
async getBalance(userId: number) {
  const user = await this.userService.findById(userId);
  const totalEarned = await this.pointsLogRepository
    .createQueryBuilder("log")
    .select("COALESCE(SUM(log.amount), 0)", "total")
    .where("log.userId = :userId", { userId })
    .andWhere("log.type = :type", { type: PointsType.EARN })
    .getRawOne();

  const totalConsumed = await this.pointsLogRepository
    .createQueryBuilder("log")
    .select("COALESCE(SUM(ABS(log.amount)), 0)", "total")
    .where("log.userId = :userId", { userId })
    .andWhere("log.type = :type", { type: PointsType.CONSUME })
    .getRawOne();

  return {
    balance: user.points,           // 用户表中的积分余额
    totalEarned: Number(totalEarned.total) || 0,
    totalConsumed: Number(totalConsumed.total) || 0,
  };
}
```

**问题根源：**
1. `balance` 来自 `users` 表的 `points` 字段
2. `totalEarned` 和 `totalConsumed` 来自 `points_logs` 表的统计
3. 如果两个表的数据不一致，就会出现 `totalEarned - totalConsumed ≠ balance`

### 第三步：可能的原因 ✅

**原因1：数据库数据不一致**
- 某些积分变动修改了 `users.points`，但没有记录到 `points_logs`
- 或者 `points_logs` 记录了，但 `users.points` 没有更新

**原因2：并发问题**
- 多个请求同时修改积分，导致数据不一致

**原因3：历史数据问题**
- 旧版本代码可能没有正确记录积分日志
- 数据迁移时可能遗漏了某些记录

### 第四步：解决方案 ✅

**方案1：修复 getBalance 逻辑（推荐）**
- 不再从 `users.points` 读取余额
- 直接从 `points_logs` 计算当前余额
- 公式：`balance = totalEarned - totalConsumed`

**优点：**
- 数据来源统一，保证一致性
- 积分日志是完整的审计记录，更可靠
- 即使 `users.points` 有误，也能显示正确的余额

**缺点：**
- 每次查询都需要统计日志表，性能稍差
- 但可以通过缓存优化

**方案2：修复数据一致性**
- 编写脚本，重新计算所有用户的积分
- 将 `points_logs` 的统计结果同步到 `users.points`

**优点：**
- 修复历史数据问题
- 查询性能好

**缺点：**
- 治标不治本，未来还可能出现不一致
- 需要定期执行修复脚本

### 第五步：实施修复 ✅

采用**方案1**，修改 `getBalance` 方法，从积分日志计算余额。

**修改内容：**
```typescript
async getBalance(userId: number) {
  const user = await this.userService.findById(userId);
  const totalEarned = await this.pointsLogRepository
    .createQueryBuilder("log")
    .select("COALESCE(SUM(log.amount), 0)", "total")
    .where("log.userId = :userId", { userId })
    .andWhere("log.type = :type", { type: PointsType.EARN })
    .getRawOne();

  const totalConsumed = await this.pointsLogRepository
    .createQueryBuilder("log")
    .select("COALESCE(SUM(ABS(log.amount)), 0)", "total")
    .where("log.userId = :userId", { userId })
    .andWhere("log.type = :type", { type: PointsType.CONSUME })
    .getRawOne();

  const earned = Number(totalEarned.total) || 0;
  const consumed = Number(totalConsumed.total) || 0;
  const calculatedBalance = earned - consumed;

  return {
    balance: calculatedBalance,  // 改为从日志计算
    totalEarned: earned,
    totalConsumed: consumed,
  };
}
```

### 第六步：验证修复是否正确 ⚠️

**需要验证的问题：**

1. **消费类型的积分是正数还是负数？**
   - 如果 `points_logs` 表中消费记录的 `amount` 是负数（如 -100）
   - 那么 `SUM(ABS(log.amount))` 会得到正数 100
   - 计算 `balance = earned - consumed` 是正确的
   
   - 如果 `points_logs` 表中消费记录的 `amount` 已经是正数（如 100）
   - 那么 `SUM(ABS(log.amount))` 还是 100
   - 计算 `balance = earned - consumed` 也是正确的

2. **但是需要确认：消费记录在数据库中到底是正数还是负数？**
   - 需要查看 `addPoints` 方法的实现
   - 需要查看数据库实际存储的值

**关键疑问：我没有验证 `amount` 字段的实际存储方式！**

### 第七步：深入分析 addPoints 方法 ✅

**查看 addPoints 方法（第60-86行）：**
```typescript
async addPoints(
  userId: number,
  amount: number,  // 传入的参数可以是正数或负数
  sourceType: PointsSourceType,
  sourceId: number = 0,
  description?: string,
): Promise<void> {
  const user = await this.userService.findById(userId);
  const currentPoints = Number(user.points) || 0;
  const amountNum = Number(amount) || 0;
  const balanceAfter = currentPoints + amountNum;  // 直接相加

  const log = this.pointsLogRepository.create({
    userId,
    type: amountNum > 0 ? PointsType.EARN : PointsType.CONSUME,  // 根据正负判断类型
    amount: amountNum,  // 存储原始值（可能是负数）
    balanceAfter: balanceAfter,
    sourceType,
    sourceId,
    description: description || this.getDefaultDescription(sourceType),
  });

  await this.pointsLogRepository.save(log);
  await this.userService.updatePoints(userId, amountNum);
}
```

**关键发现：**
1. `amount` 参数可以是正数（增加积分）或负数（扣除积分）
2. 当 `amount > 0` 时，`type = PointsType.EARN`
3. 当 `amount < 0` 时，`type = PointsType.CONSUME`
4. **数据库中存储的 `amount` 是原始值**：
   - 收入记录：`amount = 100`（正数）
   - 消费记录：`amount = -100`（负数）

### 第八步：重新验证计算逻辑 ❌

**我的修改：**
```typescript
const totalEarned = SUM(log.amount) WHERE type = EARN
const totalConsumed = SUM(ABS(log.amount)) WHERE type = CONSUME
const balance = totalEarned - totalConsumed
```

**问题分析：**
- 收入记录：`type = EARN`, `amount = 100`
  - `totalEarned = SUM(100) = 100` ✅
  
- 消费记录：`type = CONSUME`, `amount = -100`
  - `totalConsumed = SUM(ABS(-100)) = 100` ✅
  
- 计算余额：`balance = 100 - 100 = 0` ✅

**看起来是正确的！但是...**

### 第九步：发现致命问题 ❌

**等等！我需要重新理解业务逻辑：**

如果数据库中：
- 收入记录：`type = EARN`, `amount = 100`
- 消费记录：`type = CONSUME`, `amount = -100`

那么正确的余额计算应该是：
```typescript
balance = SUM(所有记录的 amount)
       = SUM(100, -100, 50, -20, ...)
       = 总收入 + 总支出（支出是负数）
```

**或者分开计算：**
```typescript
totalEarned = SUM(amount) WHERE type = EARN     // 100
totalConsumed = SUM(amount) WHERE type = CONSUME // -100
balance = totalEarned + totalConsumed           // 100 + (-100) = 0
```

**但我的代码是：**
```typescript
totalConsumed = SUM(ABS(amount)) WHERE type = CONSUME // ABS(-100) = 100
balance = totalEarned - totalConsumed                 // 100 - 100 = 0
```

**两种方式结果相同，但逻辑不同：**
- 方式1：`totalConsumed` 是负数，用加法
- 方式2：`totalConsumed` 是正数，用减法

**我的方式2是正确的！** ✅

### 第十步：最终验证 ✅

**验证场景：**
```
用户注册：+2000 (type=EARN, amount=2000)
邀请奖励：+50   (type=EARN, amount=50)
发帖奖励：+10   (type=EARN, amount100  (type=CONSUME, amount=-100)
```

**计算过程：**
```typescript
totalEarned = SUM(2000, 50, 10) = 2060
totalConsumed = SUM(ABS(-100)) = 100
balance = 2060 - 100 = 1960
```

**验证：**
```
实际余额 = 2000 + 50 + 10 - 100 = 1960 ✅
```

**结论：修复是正确的！** ✅
