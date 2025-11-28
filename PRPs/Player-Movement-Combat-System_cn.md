# PRP: 玩家移动与战斗系统

## 问题陈述
游戏需要响应式的平台跳跃移动机制，包括精确跳跃、二段跳能力、踩踏攻击、射击机制和武器瞄准，以实现引人入胜的战斗游戏体验。

## 需求
- 带加速/减速的平滑水平移动
- 带可变高度的精确跳跃控制
- 用于高级平台跳跃的二段跳机制
- 踩踏攻击击败敌人（跳到他们身上）
- 带瞄准方向的射弹射击
- 武器旋转跟随鼠标/手柄瞄准
- 带冷却可视化的装弹系统
- 带伤害反馈的生命值系统
- 带重生机制的生命系统

## 解决方案

### 移动系统
1. **水平移动**
   - 加速：平滑速度上升
   - 最大速度：200像素/秒
   - 减速：无输入时的摩擦
   - 空中控制：跳跃时控制减少

2. **跳跃机制**
   - 初始速度：-500（向上）
   - 可变高度：提前释放=较短跳跃
   - 二段跳：空中第二次跳跃
   - 土狼时间：离开平台后100ms宽限期
   - 跳跃缓冲：落地前100ms输入窗口

3. **战斗机制**
   - 踩踏：跳到敌人身上，向上弹起，敌人被击败
   - 射击：向瞄准方向发射射弹
   - 装弹：射击之间1秒冷却
   - 武器瞄准：跟随鼠标光标或手柄右摇杆

## 实现细节

### 创建/修改的文件
1. **frontend/src/scenes/GameScene.ts**
   - 玩家精灵创建和物理设置
   - 移动输入处理（WASD、方向键、手柄）
   - 带二段跳跟踪的跳跃逻辑
   - 踩踏检测和敌人碰撞
   - 带子弹生成的射击机制
   - 武器旋转和瞄准

2. **frontend/src/utils/ControlManager.ts**
   - 统一输入处理（键盘+手柄）
   - 从鼠标/摇杆计算瞄准方向
   - 手柄输入死区
   - 跳跃按钮状态跟踪

### 移动物理
```typescript
// 水平移动
if (left) {
  player.setVelocityX(-200)
} else if (right) {
  player.setVelocityX(200)
} else {
  player.setVelocityX(0)  // 立即停止以获得响应感
}

// 跳跃
if (jumpPressed && onGround) {
  player.setVelocityY(-500)
  canDoubleJump = true
}

// 二段跳
if (jumpPressed && !onGround && canDoubleJump) {
  player.setVelocityY(-500)
  canDoubleJump = false
  hasDoubleJumped = true
}
```

### 踩踏机制
```typescript
// 敌人碰撞
if (playerBottomOverlapsEnemyTop && playerMovingDown) {
  // 踩踏成功
  enemy.destroy()
  player.setVelocityY(-300)  // 向上弹起
  score += 50
  playStompSound()
} else {
  // 伤害玩家
  playerHealth -= 10
  knockbackPlayer()
}
```

### 射击系统
```typescript
// 发射子弹
if (shootPressed && canShoot) {
  const bullet = bullets.create(player.x, player.y, 'bullet')
  const angle = Phaser.Math.Angle.Between(
    player.x, player.y, 
    aimX, aimY
  )
  bullet.setVelocity(
    Math.cos(angle) * 400,
    Math.sin(angle) * 400
  )
  
  canShoot = false
  reloadTime = 1000  // 1秒冷却
  showReloadBar()
}
```

### 武器瞄准
```typescript
// 更新武器旋转
const angle = Phaser.Math.Angle.Between(
  player.x, player.y,
  pointer.x + camera.scrollX,
  pointer.y + camera.scrollY
)
weapon.rotation = angle

// 瞄准左侧时翻转武器精灵
if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
  weapon.setFlipY(true)
} else {
  weapon.setFlipY(false)
}
```

## 高级机制

### 土狼时间
允许在离开平台后短时间内跳跃输入：
```typescript
let coyoteTime = 0
const COYOTE_DURATION = 100  // 毫秒

// 在更新循环中
if (!onGround) {
  coyoteTime += delta
}

// 在土狼时间内允许跳跃
if (jumpPressed && coyoteTime < COYOTE_DURATION) {
  jump()
}
```

### 跳跃缓冲
记住落地前的跳跃输入：
```typescript
let jumpBuffer = 0
const BUFFER_DURATION = 100  // 毫秒

// 存储跳跃输入
if (jumpPressed) {
  jumpBuffer = BUFFER_DURATION
}

// 落地时消费缓冲
if (onGround && jumpBuffer > 0) {
  jump()
  jumpBuffer = 0
}
```

### 喷气背包模式（手柄）
持续向上推左摇杆时的持续向上推力：
```typescript
if (leftStickY < -0.8) {  // 摇杆向上推
  player.setVelocityY(-150)  // 向上推力
  showJetpackParticles()
}
```

## 视觉反馈系统

### 装弹条
- 蓝色条在1秒内从0填充到60px
- 视觉显示装弹进度
- 位于玩家上方
- 装弹完成时消失

### 生命条
- 绿色条（100%生命值）
- 变黄（50%生命值）
- 变红（25%生命值）
- 宽度随生命值百分比缩放

### 伤害闪烁
- 受伤时玩家精灵闪烁红色
- 200ms闪烁持续时间
- 短暂无敌期（500ms）

### 移动粒子
- 奔跑时的灰尘粒子
- 跳跃时的尾迹粒子
- 落地冲击粒子

## 素材使用
玩家精灵来自**Kenney platformer-art-extended-enemies**：
- `alienBeige_stand.png` - 待机姿势
- `alienBeige_walk1.png` / `alienBeige_walk2.png` - 行走动画
- `alienBeige_jump.png` - 跳跃帧
- 各种颜色变体（蓝色、绿色、粉色、黄色）

武器精灵来自**Kenney sci-fi-rts**：
- 射线枪、激光枪、能量剑、火箭筒
- 多种武器类型具有不同射速
- 每种武器类型的射弹精灵

## 控制总结

### 键盘
- **A/D或左/右**：左右移动
- **W/空格/上**：跳跃/二段跳
- **鼠标**：瞄准武器
- **左键点击**：射击
- **S/下**：快速下落（未来功能）

### 手柄
- **左摇杆**：左右移动
- **左摇杆向上**：喷气背包模式
- **A按钮**：跳跃/二段跳
- **右摇杆**：瞄准武器
- **RT（R2）**：射击
- **十字键上**：跳跃备选

## 性能考虑
- **子弹池**：重用子弹对象（最多20个活动）
- **粒子限制**：每个效果最多50个粒子
- **物理步进**：60 FPS物理更新
- **碰撞检测**：仅对屏幕上的活动对象
- **动画缓存**：预加载所有精灵动画

## 测试与验证
1. **移动感觉**：测试加速、减速、空中控制
2. **跳跃精度**：验证可变跳跃高度有效
3. **二段跳**：确保每次空中只有一次二段跳
4. **踩踏**：测试踩踏vs碰撞伤害检测
5. **瞄准**：验证鼠标和手柄瞄准准确性
6. **装弹**：检查装弹冷却时间（1秒）
7. **土狼时间**：离开平台后短时间内跳跃
8. **跳跃缓冲**：落地前跳跃注册

## 已知问题与解决方案

### 问题：滑溜的移动
**问题**：释放输入后玩家滑动太多

**解决方案**：将速度设为0而不是使用摩擦/阻力

### 问题：二段跳不一致
**问题**：二段跳有时不触发

**解决方案**：
- 分别跟踪hasDoubleJumped和canDoubleJump
- 仅在着地时重置两个标志
- 检查正确的按钮按下检测

### 问题：踩踏不注册
**问题**：玩家受伤而不是踩踏

**解决方案**：
- 检查玩家是否向下移动（velocityY > 0）
- 验证玩家底部与敌人顶部重叠
- 为踩踏检测添加10px宽限区

### 问题：武器瞄准偏移
**问题**：武器没有精确指向光标

**解决方案**：
- 计算中考虑相机滚动
- 使用getWorldPoint()进行正确的坐标转换
- 调整武器锚点到旋转原点

## 平衡参数
```typescript
const PLAYER_STATS = {
  moveSpeed: 200,          // 像素/秒
  jumpPower: 500,          // 初始跳跃速度
  doubleJumpPower: 500,    // 二段跳速度
  stompBounce: 300,        // 踩踏后弹起高度
  health: 100,             // 初始生命值
  lives: 3,                // 初始生命数
  shootCooldown: 1000,     // 射击间隔毫秒
  bulletSpeed: 400,        // 像素/秒
  bulletDamage: 25,        // 每颗子弹伤害
  invincibilityTime: 500,  // 受伤后无敌毫秒
}
```

## 未来改进
- 蹬墙跳机制
- 滑动/冲刺能力
- 道具（速度、跳跃提升、无敌）
- 近战战斗（能量剑）
- 蓄力射击（按住蓄力）
- 多种武器具有不同行为
- 蹲下和爬行机制
- 悬崖抓取和攀爬
- 钩爪

## 状态
✅ **已完成** - 完整移动系统，具有二段跳、踩踏、射击和精确控制
