# PRP: 结局场景实现 (Ending Scene Implementation)

## 问题陈述
游戏需要一个叙事性的结局来奖励完成游戏的玩家。该场景应为故事提供结局，显示制作人员名单或叙事文本，并处理返回主菜单的过渡，同时清理游戏状态（存档文件）以便重新开始。

## 需求
- 显示滚动的故事文本（星球大战风格或垂直滚动）
- "The Chrysalis Protocol"（蛹化协议）叙事内容
- 星空背景动画
- 结局专用背景音乐
- 跳过功能（按钮和 ESC 键）
- 文本结束后自动返回菜单
- 完成后清理存档数据 (localStorage)

## 提议的解决方案

### 架构
1. **场景**: `EndingScene.ts` 继承自 `Phaser.Scene`。
2. **视觉效果**:
   - 程序化生成星空（200+ 颗星星，大小/速度各异）。
   - 具有自动换行和特定样式的文本对象（黄色/金色）。
3. **音频**:
   - 停止所有之前的游戏音效。
   - 播放 `music_ending` 音轨。
4. **状态管理**:
   - 从 `localStorage` 中清除 `player_name`、`defeatedBossLevels` 和 boss 记录。

## 实现细节

### 1. 场景结构 (`frontend/src/scenes/EndingScene.ts`)
- **preload()**: 加载结局音乐。
- **create()**:
  - 设置黑色背景。
  - 使用 `add.circle` 生成星空。
  - 创建包含 "The Chrysalis Protocol" 内容的故事文本。
  - 添加 "SKIP [ESC]" 按钮。
  - 设置输入监听器。
  - 清除存档数据。
- **update()**:
  - 根据 `delta` 时间向上滚动文本。
  - 检查文本是否滚出屏幕以触发 `returnToMenu`。

### 2. 叙事内容
故事 "The Chrysalis Protocol" 描述了 Maya Chen 博士的转变以及她在 Kepler-442b 上的旅程。它触及了人性、转变以及选择回家的主题。

### 3. 技术规格
- **滚动速度**: 50 像素/秒（可调整）。
- **文本样式**:
  - 字体: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif
  - 大小: 32px
  - 颜色: #FFE81F (星球大战黄)
  - 对齐: 两端对齐 (Justify)
  - 换行: 屏幕宽度的 60%
- **星空**:
  - 200 颗星星
  - 随机位置 (x, y)
  - 随机透明度 (0.5 - 1.0)

### 4. 存档数据清理
当结局场景开始时，将删除以下 `localStorage` 键以重置游戏进度：
- `player_name`
- `defeatedBossLevels`
- `boss_record_*`

## 创建/修改的文件
- `frontend/src/scenes/EndingScene.ts`
- `frontend/src/__tests__/ending-scene.test.ts`
