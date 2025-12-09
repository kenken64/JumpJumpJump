import Phaser from 'phaser';
import type GameScene from '../scenes/GameScene';
import { OnlineCoopService } from '../services/OnlineCoopService';
import { GameAPI } from '../services/api';

export class UIManager {
  private scene: GameScene;
  public highScore: number = 0;

  // UI Elements
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private healthBarBackground!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private bossHealthBar!: Phaser.GameObjects.Graphics;
  private bossNameText?: Phaser.GameObjects.Text;
  private aiStatusText?: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private reloadBarBackground!: Phaser.GameObjects.Rectangle;
  private reloadBarFill!: Phaser.GameObjects.Rectangle;

  // Co-op UI Elements
  private p2HealthBarFill?: Phaser.GameObjects.Rectangle;
  private p2LivesText?: Phaser.GameObjects.Text;
  private p2ScoreText?: Phaser.GameObjects.Text;
  private p2CoinText?: Phaser.GameObjects.Text;

  // Debug UI
  private debugText?: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private coordText?: Phaser.GameObjects.Text;

  // Chat UI
  private chatContainer: HTMLDivElement | null = null;
  private chatInputElement: HTMLInputElement | null = null;
  public chatInputActive: boolean = false;

  // Tips UI
  private tipText?: Phaser.GameObjects.Text;
  private tipBackground?: Phaser.GameObjects.Rectangle;
  private activeTip: string | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  public createUI() {
    if (this.scene.isCoopMode) {
      this.createCoopUI();
    } else {
      this.createSinglePlayerUI();
    }

    // Common UI Elements
    this.createCommonUI();
    
    // Create Debug UI (hidden by default)
    this.createDebugUI();
  }

  private createCoopUI() {
    const rightX = this.scene.cameras.main.width - 20;
    const topY = 20;

    // Player 1 (Green) - Top Right
    const p1Label = this.scene.add.text(rightX - 310, topY, 'P1', {
      fontSize: '28px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    p1Label.setScrollFactor(0);
    p1Label.setDepth(100);

    const p1HealthBarBg = this.scene.add.rectangle(rightX - 260, topY + 14, 200, 20, 0x333333);
    p1HealthBarBg.setOrigin(0, 0.5);
    p1HealthBarBg.setScrollFactor(0);
    p1HealthBarBg.setDepth(100);

    this.healthBarFill = this.scene.add.rectangle(rightX - 260, topY + 14, 200, 20, 0x00ff00);
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setScrollFactor(0);
    this.healthBarFill.setDepth(101);

    this.livesText = this.scene.add.text(rightX - 50, topY + 14, `x${this.scene.playerLives}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.livesText.setOrigin(0, 0.5);
    this.livesText.setScrollFactor(0);
    this.livesText.setDepth(100);

    // Player 2 (Cyan) - Below Player 1
    const p2Y = topY + 45;
    const p2Label = this.scene.add.text(rightX - 310, p2Y, 'P2', {
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    p2Label.setScrollFactor(0);
    p2Label.setDepth(100);

    const p2HealthBarBg = this.scene.add.rectangle(rightX - 260, p2Y + 14, 200, 20, 0x333333);
    p2HealthBarBg.setOrigin(0, 0.5);
    p2HealthBarBg.setScrollFactor(0);
    p2HealthBarBg.setDepth(100);

    this.p2HealthBarFill = this.scene.add.rectangle(rightX - 260, p2Y + 14, 200, 20, 0x00ffff);
    this.p2HealthBarFill.setOrigin(0, 0.5);
    this.p2HealthBarFill.setScrollFactor(0);
    this.p2HealthBarFill.setDepth(101);

    this.p2LivesText = this.scene.add.text(rightX - 50, p2Y + 14, `x${this.scene.playerLives}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.p2LivesText.setOrigin(0, 0.5);
    this.p2LivesText.setScrollFactor(0);
    this.p2LivesText.setDepth(100);

    // Store references for player 2 (compatibility with GameScene logic if needed)
    if (this.scene.player2) {
      this.scene.player2.setData('healthBarFill', this.p2HealthBarFill);
      this.scene.player2.setData('livesText', this.p2LivesText);
    }

    this.healthBarBackground = p1HealthBarBg;

    // Add separate score/coin displays for co-op mode below health bars
    const scoreY = p2Y + 50;

    // Player 1 Score/Coins
    this.scoreText = this.scene.add.text(rightX - 310, scoreY, 'Score: 0', {
      fontSize: '18px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);
    this.scoreText.setName('p1ScoreText');

    const p1CoinIcon = this.scene.add.text(rightX - 180, scoreY, '🪙', {
      fontSize: '18px'
    });
    p1CoinIcon.setScrollFactor(0);
    p1CoinIcon.setDepth(100);

    this.coinText = this.scene.add.text(rightX - 160, scoreY, '0', {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.coinText.setScrollFactor(0);
    this.coinText.setDepth(100);
    this.coinText.setName('p1CoinText');

    // Player 2 Score/Coins
    this.p2ScoreText = this.scene.add.text(rightX - 310, scoreY + 25, 'Score: 0', {
      fontSize: '18px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.p2ScoreText.setScrollFactor(0);
    this.p2ScoreText.setDepth(100);
    this.p2ScoreText.setName('p2ScoreText');

    const p2CoinIcon = this.scene.add.text(rightX - 180, scoreY + 25, '🪙', {
      fontSize: '18px'
    });
    p2CoinIcon.setScrollFactor(0);
    p2CoinIcon.setDepth(100);

    this.p2CoinText = this.scene.add.text(rightX - 160, scoreY + 25, '0', {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.p2CoinText.setScrollFactor(0);
    this.p2CoinText.setDepth(100);
    this.p2CoinText.setName('p2CoinText');
    
    // Dummy reload bars for co-op
    this.reloadBarBackground = this.scene.add.rectangle(0, 0, 0, 0, 0x000000);
    this.reloadBarBackground.setVisible(false);
    this.reloadBarFill = this.scene.add.rectangle(0, 0, 0, 0, 0x000000);
    this.reloadBarFill.setVisible(false);
  }

  private createSinglePlayerUI() {
    const startX = this.scene.cameras.main.width - 20;
    const startY = 20;

    // Top-right: Lives and Health - show player name in online mode
    this.livesText = this.scene.add.text(startX, startY, this.getLivesText(), {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.livesText.setOrigin(1, 0);
    this.livesText.setScrollFactor(0);

    // Create health bar (below lives)
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarY = startY + 35;

    // Background (empty state)
    this.healthBarBackground = this.scene.add.rectangle(
      startX - healthBarWidth,
      healthBarY,
      healthBarWidth,
      healthBarHeight,
      0x333333
    );
    this.healthBarBackground.setOrigin(0, 0);
    this.healthBarBackground.setScrollFactor(0);

    // Fill (shows current health)
    this.healthBarFill = this.scene.add.rectangle(
      startX - healthBarWidth,
      healthBarY,
      healthBarWidth,
      healthBarHeight,
      0x00ff00
    );
    this.healthBarFill.setOrigin(0, 0);
    this.healthBarFill.setScrollFactor(0);

    // Create reload bar below health bar (single player only)
    const reloadBarY = healthBarY + healthBarHeight + 10;
    const reloadBarWidth = 60;
    const reloadBarHeight = 12;

    this.reloadBarBackground = this.scene.add.rectangle(
      startX - reloadBarWidth,
      reloadBarY,
      reloadBarWidth,
      reloadBarHeight,
      0x333333
    );
    this.reloadBarBackground.setScrollFactor(0);
    this.reloadBarBackground.setOrigin(0, 0);

    this.reloadBarFill = this.scene.add.rectangle(
      startX - reloadBarWidth,
      reloadBarY,
      0,
      reloadBarHeight,
      0x00aaff
    );
    this.reloadBarFill.setScrollFactor(0);
    this.reloadBarFill.setOrigin(0, 0);

    // Top-left: Coins and Score (compact)
    this.coinIcon = this.scene.add.image(25, 20, 'coin');
    this.coinIcon.setScrollFactor(0);
    this.coinIcon.setScale(0.35);

    this.coinText = this.scene.add.text(50, 12, `${this.scene.coinCount}`, {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.coinText.setScrollFactor(0);

    this.scoreText = this.scene.add.text(20, 40, `Score: ${this.scene.score}`, {
      fontSize: '22px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.scoreText.setScrollFactor(0);

    // High score (compact, below score)
    this.highScore = parseInt(localStorage.getItem('jumpjump_highscore') || '0');
    this.highScoreText = this.scene.add.text(20, 65, `Best: ${this.highScore}`, {
      fontSize: '18px',
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.highScoreText.setScrollFactor(0);

    // Save Button (Single Player Levels Mode Only)
    if (!this.scene.isCoopMode && !this.scene.isOnlineMode && this.scene.gameMode === 'levels') {
      const saveBtn = this.scene.add.text(20, 95, '💾 SAVE & QUIT', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#008800',
        padding: { x: 8, y: 4 }
      });
      saveBtn.setScrollFactor(0);
      saveBtn.setDepth(100);
      saveBtn.setInteractive({ useHandCursor: true });
      saveBtn.on('pointerover', () => saveBtn.setBackgroundColor('#00aa00'));
      saveBtn.on('pointerout', () => saveBtn.setBackgroundColor('#008800'));
      saveBtn.on('pointerdown', async () => {
        // Disable button to prevent double-clicks
        saveBtn.disableInteractive();
        saveBtn.setText('💾 SAVING...');
        
        // Force save to localStorage before quitting
        localStorage.setItem('playerCoins', this.scene.coinCount.toString());
        
        // Save game to localStorage and backend
        try {
          await (this.scene as any).saveGame();
          saveBtn.setText('✅ SAVED!');
        } catch (error) {
          console.error('Save error:', error);
          saveBtn.setText('⚠️ SAVED LOCALLY');
        }
        
        // Submit score to backend (don't wait for it)
        (this.scene as any).submitScoreToBackend();
        
        // Navigate to menu after a short delay
        this.scene.time.delayedCall(1000, () => {
           this.scene.scene.start('MenuScene');
        });
      });
    }
  }

  private createCommonUI() {
    // Level display
    const levelDisplayText = this.scene.gameMode === 'endless' ? 'ENDLESS MODE' : `LEVEL ${this.scene.currentLevel}`;
    this.levelText = this.scene.add.text(640, 20, levelDisplayText, {
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.levelText.setOrigin(0.5, 0);
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(100);

    // AI status indicator (top center, below level)
    this.aiStatusText = this.scene.add.text(640, 55, '', {
      fontSize: '18px',
      color: '#ff00ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.aiStatusText.setOrigin(0.5, 0);
    this.aiStatusText.setScrollFactor(0);
    this.aiStatusText.setDepth(100);
    this.aiStatusText.setVisible(false);

    // Create home button (bottom-left corner) - prominent red circle
    const homeButtonX = 60;
    const homeButtonY = 660;

    // Create a red circle button (always use circle, ignore icon)
    const homeButton = this.scene.add.circle(homeButtonX, homeButtonY, 35, 0xff0000, 0.8);
    homeButton.setStrokeStyle(3, 0xffffff);
    homeButton.setDepth(1000); // High depth to be visible
    homeButton.setScrollFactor(0);
    homeButton.setInteractive({ useHandCursor: true });

    // Add HOME text inside circle
    const homeText = this.scene.add.text(homeButtonX, homeButtonY, 'HOME', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    homeText.setOrigin(0.5);
    homeText.setScrollFactor(0);
    homeText.setDepth(1001);

    homeButton.on('pointerover', () => {
      homeButton.setFillStyle(0xff3333, 1);
      homeButton.setScale(1.1);
      homeText.setScale(1.1);
    });
    homeButton.on('pointerout', () => {
      homeButton.setFillStyle(0xff0000, 0.8);
      homeButton.setScale(1);
      homeText.setScale(1);
    });
    homeButton.on('pointerdown', () => {
      this.showQuitConfirmation();
    });

    // Boss Health Bar (initially hidden)
    this.bossHealthBar = this.scene.add.graphics();
    this.bossHealthBar.setScrollFactor(0);
    this.bossHealthBar.setDepth(1000); // High depth to be visible above all game elements
    this.bossHealthBar.setVisible(false);
  }

  public updateScore(score: number) {
    // Update score text (handle both single player and co-op)
    if (this.scene.isCoopMode) {
      this.scoreText.setText(`Score: ${score}`);
    } else {
      this.scoreText.setText(`Score: ${score}`);
    }

    // Update high score
    if (score > this.highScore) {
      this.highScore = score;
      if (!this.scene.isCoopMode && this.highScoreText) {
        this.highScoreText.setText(`Best: ${this.highScore}`);
      }
      localStorage.setItem('jumpjump_highscore', this.highScore.toString());

      // Flash effect when breaking high score
      this.scene.tweens.add({
        targets: this.highScoreText,
        scale: 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }
  }

  public updateLives() {
    if (this.scene.isCoopMode) {
      this.livesText.setText(`x${this.scene.playerLives}`);
    } else {
      this.livesText.setText(this.getLivesText());
    }
  }

  private getLivesText(): string {
    if (this.scene.isOnlineMode) {
      const onlineService = OnlineCoopService.getInstance();
      const playerName = onlineService.playerName || 'Player';
      return `${playerName} - Lives: ${this.scene.playerLives}`;
    }
    return `Lives: ${this.scene.playerLives}`;
  }

  public updateHealthBar(current: number, max: number) {
    // Update health bar
    const healthPercent = Math.max(0, current / max);
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;

    if (this.scene.isCoopMode) {
      // In co-op, health bar is fixed width
      // We need to clear and redraw or scale
      // Since we used rectangle, we can scale width?
      // But we need to keep left alignment.
      // Let's just redraw or use setSize if it's a rectangle?
      // Phaser Rectangle has setSize.
      this.healthBarFill.width = 200 * healthPercent;
      this.healthBarFill.setFillStyle(healthColor);
    } else {
      this.healthBarFill.width = 200 * healthPercent;
      this.healthBarFill.setFillStyle(healthColor);
    }
  }

  public updateBossHealthBar(current: number, max: number) {
    if (current <= 0) {
      this.bossHealthBar.setVisible(false);
      this.hideBossName();
      return;
    }

    // Make sure the health bar is visible and has high depth
    this.bossHealthBar.setVisible(true);
    this.bossHealthBar.setDepth(1000); // Match boss name depth
    this.bossHealthBar.clear();

    // Background
    this.bossHealthBar.fillStyle(0x000000, 0.7);
    this.bossHealthBar.fillRect(340, 650, 600, 30);
    this.bossHealthBar.lineStyle(2, 0xffffff, 1);
    this.bossHealthBar.strokeRect(340, 650, 600, 30);

    // Health
    const healthPercent = Math.max(0, current / max);
    this.bossHealthBar.fillStyle(0xff0000, 1);
    this.bossHealthBar.fillRect(344, 654, 592 * healthPercent, 22);
  }

  public showBossName(name: string) {
    if (this.bossNameText) this.bossNameText.destroy();
    
    this.bossNameText = this.scene.add.text(640, 610, name, { // Positioned above health bar
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.bossNameText.setOrigin(0.5, 1);
    this.bossNameText.setScrollFactor(0);
    this.bossNameText.setDepth(1001);
  }

  public hideBossName() {
    if (this.bossNameText) {
      this.bossNameText.destroy();
      this.bossNameText = undefined;
    }
  }

  public hideBossHealthBar() {
    this.bossHealthBar.setVisible(false);
    this.hideBossName();
  }

  public updateCoins(coins: number) {
    this.coinText.setText(`${coins}`);
  }

  public updateLevel(level: number) {
    if (this.scene.gameMode === 'levels') {
      this.levelText.setText(`LEVEL ${level}`);
    }
  }

  public updateReloadBar(progress: number) {
    if (this.reloadBarFill) {
      this.reloadBarFill.width = 60 * Math.min(progress, 1);
    }
  }

  public updatePlayer2Health(current: number, max: number) {
    if (this.p2HealthBarFill) {
      const healthPercent = Math.max(0, current / max);
      const healthColor = healthPercent > 0.5 ? 0x00ffff : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
      this.p2HealthBarFill.width = 200 * healthPercent;
      this.p2HealthBarFill.setFillStyle(healthColor);
    }
  }

  public updatePlayer2Lives(lives: number) {
    if (this.p2LivesText) {
      this.p2LivesText.setText(`x${lives}`);
    }
  }

  public updatePlayer2Score(score: number) {
    if (this.p2ScoreText) {
      this.p2ScoreText.setText(`Score: ${score}`);
    }
  }

  public updatePlayer2Coins(coins: number) {
    if (this.p2CoinText) {
      this.p2CoinText.setText(`${coins}`);
    }
  }

  public showDamageNumber(x: number, y: number, damage: number) {
    const damageText = this.scene.add.text(x, y, `-${damage}`, {
      fontSize: '20px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    damageText.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: damageText,
      y: y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    });
  }

  public showScorePopup(x: number, y: number, score: number) {
    const scoreText = this.scene.add.text(x, y, `+${score}`, {
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    scoreText.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: scoreText,
      y: y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => scoreText.destroy()
    });
  }

  public showTip(id: string, text: string, duration: number = 5000) {
    // Don't show same tip twice
    if (this.activeTip === id) return;
    this.activeTip = id;

    // Remove existing tip
    if (this.tipText) this.tipText.destroy();
    if (this.tipBackground) this.tipBackground.destroy();

    // Create background
    this.tipBackground = this.scene.add.rectangle(640, 600, 800, 60, 0x000000, 0.7);
    this.tipBackground.setScrollFactor(0);
    this.tipBackground.setDepth(150);

    // Create text
    this.tipText = this.scene.add.text(640, 600, text, {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 780 }
    });
    this.tipText.setOrigin(0.5);
    this.tipText.setScrollFactor(0);
    this.tipText.setDepth(151);

    // Animate in
    this.tipBackground.setAlpha(0);
    this.tipText.setAlpha(0);

    this.scene.tweens.add({
      targets: [this.tipBackground, this.tipText],
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });

    // Auto hide
    this.scene.time.delayedCall(duration, () => {
      if (this.activeTip === id) {
        this.scene.tweens.add({
          targets: [this.tipBackground, this.tipText],
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (this.activeTip === id) {
              this.activeTip = null;
              this.tipText?.destroy();
              this.tipBackground?.destroy();
            }
          }
        });
      }
    });
  }

  public showLevelComplete(level: number, score: number, coins: number) {
    this.scene.physics.pause();

    // Overlay
    const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    overlay.setDepth(2000);

    // Panel
    const panel = this.scene.add.rectangle(640, 360, 600, 400, 0x222222);
    panel.setStrokeStyle(4, 0x00ff00);
    panel.setScrollFactor(0);
    panel.setDepth(2001);

    // Title
    const title = this.scene.add.text(640, 200, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(2002);

    // Stats
    const stats = this.scene.add.text(640, 320, 
      `Level ${level} Cleared\n\nScore: ${score}\nCoins Collected: ${coins}`, {
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    });
    stats.setOrigin(0.5);
    stats.setScrollFactor(0);
    stats.setDepth(2002);

    // Continue Button
    const btn = this.scene.add.rectangle(640, 480, 200, 60, 0x00aa00);
    btn.setStrokeStyle(2, 0x00ff00);
    btn.setScrollFactor(0);
    btn.setDepth(2002);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.scene.add.text(640, 480, 'NEXT LEVEL', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    btnText.setOrigin(0.5);
    btnText.setScrollFactor(0);
    btnText.setDepth(2003);

    // Button interactions
    btn.on('pointerover', () => btn.setFillStyle(0x00ff00));
    btn.on('pointerout', () => btn.setFillStyle(0x00aa00));
    btn.on('pointerdown', () => {
      this.scene.tweens.killAll();
      // Start next level
      const nextLevel = level + 1;
      this.scene.scene.restart({ 
        level: nextLevel, 
        score: score,
        coins: coins,
        gameMode: this.scene.gameMode
      });
    });

    // Keyboard shortcut
    this.scene.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.tweens.killAll();
      const nextLevel = level + 1;
      this.scene.scene.restart({ 
        level: nextLevel, 
        score: score,
        coins: coins,
        gameMode: this.scene.gameMode
      });
    });
  }

  public showGameOver(score: number, coins: number, enemiesDefeated: number, distance: number) {
    console.log('🎮🎮🎮 GAME OVER TRIGGERED 🎮🎮🎮');
    
    this.scene.physics.pause();

    // Fade camera back in from black
    this.scene.cameras.main.fadeIn(500, 0, 0, 0);

    // Dark overlay background
    const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);
    overlay.setScrollFactor(0);
    overlay.setDepth(2000);

    // Game over panel
    const panelWidth = 600;
    const panelHeight = 500;
    const panel = this.scene.add.rectangle(640, 360, panelWidth, panelHeight, 0x1a1a2e);
    panel.setStrokeStyle(4, 0xff0000);
    panel.setScrollFactor(0);
    panel.setDepth(2001);

    // Game over title
    const gameOverText = this.scene.add.text(640, 150, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(2002);

    // Stats
    const statsText = this.scene.add.text(640, 300,
      `Level: ${this.scene.currentLevel}\nScore: ${score}\nCoins: ${coins}\nEnemies: ${enemiesDefeated}\nDistance: ${distance}m`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 10
    });
    statsText.setOrigin(0.5);
    statsText.setScrollFactor(0);
    statsText.setDepth(2002);

    // Restart Button
    const restartBtn = this.scene.add.rectangle(540, 480, 200, 60, 0x00aa00);
    restartBtn.setStrokeStyle(3, 0x00ff00);
    restartBtn.setScrollFactor(0);
    restartBtn.setDepth(2002);
    restartBtn.setInteractive({ useHandCursor: true });

    const restartText = this.scene.add.text(540, 480, 'RESTART', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    restartText.setOrigin(0.5);
    restartText.setScrollFactor(0);
    restartText.setDepth(2003);

    // Home Button
    const homeBtn = this.scene.add.rectangle(740, 480, 200, 60, 0x0066cc);
    homeBtn.setStrokeStyle(3, 0x0099ff);
    homeBtn.setScrollFactor(0);
    homeBtn.setDepth(2002);
    homeBtn.setInteractive({ useHandCursor: true });

    const homeText = this.scene.add.text(740, 480, 'MENU', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    homeText.setOrigin(0.5);
    homeText.setScrollFactor(0);
    homeText.setDepth(2003);

    // Button hover effects
    restartBtn.on('pointerover', () => {
      restartBtn.setFillStyle(0x00ff00);
      restartBtn.setScale(1.05);
    });
    restartBtn.on('pointerout', () => {
      restartBtn.setFillStyle(0x00aa00);
      restartBtn.setScale(1);
    });

    homeBtn.on('pointerover', () => {
      homeBtn.setFillStyle(0x0099ff);
      homeBtn.setScale(1.05);
    });
    homeBtn.on('pointerout', () => {
      homeBtn.setFillStyle(0x0066cc);
      homeBtn.setScale(1);
    });

    // Button click handlers
    restartBtn.on('pointerdown', () => {
      this.scene.tweens.killAll();
      const restartData: any = { gameMode: this.scene.gameMode, level: this.scene.currentLevel };
      if (this.scene.isCoopMode) {
        restartData.mode = 'coop';
      }
      this.scene.scene.restart(restartData);
    });

    homeBtn.on('pointerdown', () => {
      this.scene.tweens.killAll();
      this.scene.scene.start('MenuScene');
    });

    // Keyboard shortcuts
    this.scene.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.tweens.killAll();
      const restartData: any = { gameMode: this.scene.gameMode, level: this.scene.currentLevel };
      if (this.scene.isCoopMode) {
        restartData.mode = 'coop';
      }
      this.scene.scene.restart(restartData);
    });

    this.scene.input.keyboard!.once('keydown-M', () => {
      this.scene.tweens.killAll();
      this.scene.scene.start('MenuScene');
    });

    // Pulsing animation on title
    this.scene.tweens.add({
      targets: gameOverText,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public showOnlineGameOver(score: number, coins: number, enemiesDefeated: number, distance: number) {
    console.log('🎮🎮🎮 ONLINE GAME OVER - Both players out! 🎮🎮🎮');
    
    this.scene.physics.pause();

    // Fade camera back in from black
    this.scene.cameras.main.fadeIn(500, 0, 0, 0);

    // Dark overlay background
    const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);
    overlay.setScrollFactor(0);
    overlay.setDepth(2000);

    // Game over panel
    const panelWidth = 600;
    const panelHeight = 450;
    const panel = this.scene.add.rectangle(640, 360, panelWidth, panelHeight, 0x1a1a2e);
    panel.setStrokeStyle(4, 0xff0000);
    panel.setScrollFactor(0);
    panel.setDepth(2001);

    // Game over title
    const gameOverText = this.scene.add.text(640, 150, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(2002);

    // Online mode subtitle
    const onlineText = this.scene.add.text(640, 210, '🌐 Online Co-op', {
      fontSize: '24px',
      color: '#9900ff',
      fontStyle: 'bold'
    });
    onlineText.setOrigin(0.5);
    onlineText.setScrollFactor(0);
    onlineText.setDepth(2002);

    // Stats
    const statsText = this.scene.add.text(640, 320,
      `Level: ${this.scene.currentLevel}\nScore: ${score}\nCoins: ${coins}\nEnemies: ${enemiesDefeated}\nDistance: ${distance}m`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 10
    });
    statsText.setOrigin(0.5);
    statsText.setScrollFactor(0);
    statsText.setDepth(2002);

    // Menu Button (centered, only option for online mode)
    const menuBtn = this.scene.add.rectangle(640, 500, 250, 60, 0x0066cc);
    menuBtn.setStrokeStyle(3, 0x0099ff);
    menuBtn.setScrollFactor(0);
    menuBtn.setDepth(2002);
    menuBtn.setInteractive({ useHandCursor: true });

    const menuText = this.scene.add.text(640, 500, 'BACK TO MENU', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    menuText.setOrigin(0.5);
    menuText.setScrollFactor(0);
    menuText.setDepth(2003);

    // Button hover effects
    menuBtn.on('pointerover', () => {
      menuBtn.setFillStyle(0x0099ff);
      menuBtn.setScale(1.05);
    });
    menuBtn.on('pointerout', () => {
      menuBtn.setFillStyle(0x0066cc);
      menuBtn.setScale(1);
    });

    // Button click handler
    menuBtn.on('pointerdown', () => {
      this.scene.tweens.killAll();
      this.scene.scene.start('MenuScene');
    });

    // Keyboard shortcut
    this.scene.input.keyboard!.once('keydown-M', () => {
      this.scene.tweens.killAll();
      this.scene.scene.start('MenuScene');
    });
    
    this.scene.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.tweens.killAll();
      this.scene.scene.start('MenuScene');
    });

    // Pulsing animation on title
    this.scene.tweens.add({
      targets: gameOverText,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public showQuitConfirmation() {
    // Pause game physics
    this.scene.physics.pause();

    // Create overlay
    const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    overlay.setDepth(10000);

    // Create dialog box
    const dialog = this.scene.add.rectangle(640, 360, 600, 300, 0x222222, 1);
    dialog.setScrollFactor(0);
    dialog.setDepth(10001);
    dialog.setStrokeStyle(4, 0xff0000);

    // Warning title
    const title = this.scene.add.text(640, 260, '⚠️ WARNING ⚠️', {
      fontSize: '36px',
      color: '#ff0000',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(10002);

    // Warning message
    const message = this.scene.add.text(640, 330,
      this.scene.gameMode === 'endless'
        ? 'Your endless run progress will be lost!\nAre you sure you want to quit?'
        : `You will have to restart Level ${this.scene.currentLevel}!\nAre you sure you want to quit?`,
      {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8
      }
    );
    message.setOrigin(0.5);
    message.setScrollFactor(0);
    message.setDepth(10002);

    // Yes button (quit)
    const yesButton = this.scene.add.rectangle(540, 440, 150, 50, 0xff0000);
    yesButton.setScrollFactor(0);
    yesButton.setDepth(10002);
    yesButton.setInteractive({ useHandCursor: true });
    yesButton.on('pointerover', () => yesButton.setFillStyle(0xff3333));
    yesButton.on('pointerout', () => yesButton.setFillStyle(0xff0000));
    yesButton.on('pointerdown', () => {
      // Save coins before returning to menu
      localStorage.setItem('playerCoins', this.scene.coinCount.toString());

      // Submit score to backend before quitting
      console.log('🚪 Player quitting - submitting score...');
      
      const scoreData = {
        player_name: localStorage.getItem('player_name') || 'Player',
        score: this.scene.score,
        coins: this.scene.coinCount,
        enemies_defeated: this.scene.enemiesDefeated,
        distance: Math.floor(this.scene.player.x / 70),
        level: this.scene.currentLevel,
        game_mode: this.scene.gameMode
      };

      GameAPI.submitScore(scoreData).then(() => {
        console.log('✅ Score submitted on quit');
      }).catch(err => {
        console.log('⚠️ Score submission failed on quit:', err);
      }).finally(() => {
        this.scene.physics.resume();
        this.scene.scene.start('MenuScene');
      });
    });

    const yesText = this.scene.add.text(540, 440, 'YES, QUIT', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    yesText.setOrigin(0.5);
    yesText.setScrollFactor(0);
    yesText.setDepth(10003);

    // No button (continue)
    const noButton = this.scene.add.rectangle(740, 440, 150, 50, 0x00aa00);
    noButton.setScrollFactor(0);
    noButton.setDepth(10002);
    noButton.setInteractive({ useHandCursor: true });
    noButton.on('pointerover', () => noButton.setFillStyle(0x00ff00));
    noButton.on('pointerout', () => noButton.setFillStyle(0x00aa00));
    noButton.on('pointerdown', () => {
      // Resume game
      this.scene.physics.resume();
      overlay.destroy();
      dialog.destroy();
      title.destroy();
      message.destroy();
      yesButton.destroy();
      yesText.destroy();
      noButton.destroy();
      noText.destroy();
    });

    const noText = this.scene.add.text(740, 440, 'NO, CONTINUE', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    noText.setOrigin(0.5);
    noText.setScrollFactor(0);
    noText.setDepth(10003);
  }

  private createDebugUI() {
    // Debug mode indicator
    this.debugText = this.scene.add.text(16, 120, 'DEBUG MODE [F3]', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(10000);
    this.debugText.setVisible(false);

    // FPS counter
    this.fpsText = this.scene.add.text(16, 150, 'FPS: 60', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.fpsText.setScrollFactor(0);
    this.fpsText.setDepth(10000);
    this.fpsText.setVisible(false);

    // Coordinates
    this.coordText = this.scene.add.text(16, 180, 'X: 0, Y: 0', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.coordText.setScrollFactor(0);
    this.coordText.setDepth(10000);
    this.coordText.setVisible(false);
  }

  public toggleDebugMode() {
    this.scene.debugMode = !this.scene.debugMode;
    console.log('Debug mode toggled:', this.scene.debugMode);

    // Toggle debug graphics and text
    if (this.scene.debugMode) {
      this.scene.physics.world.createDebugGraphic();
      this.debugText?.setVisible(true);
      this.fpsText?.setVisible(true);
      this.coordText?.setVisible(true);
      console.log('Debug mode enabled - showing physics bodies and debug info');
    } else {
      this.scene.physics.world.debugGraphic?.clear();
      this.scene.physics.world.debugGraphic?.destroy();
      this.debugText?.setVisible(false);
      this.fpsText?.setVisible(false);
      this.coordText?.setVisible(false);
      console.log('Debug mode disabled');
    }
  }

  public updateDebugUI() {
    if (!this.scene.debugMode) return;

    // Update FPS
    const fps = Math.round(this.scene.game.loop.actualFps);
    this.fpsText?.setText(`FPS: ${fps}`);

    // Update coordinates
    const x = Math.round(this.scene.player.x);
    const y = Math.round(this.scene.player.y);
    this.coordText?.setText(`X: ${x}, Y: ${y}`);
  }

  public updateAIStatus(enabled: boolean, type: 'rule' | 'ml' = 'rule') {
    if (enabled) {
      if (type === 'rule') {
        this.aiStatusText?.setText('🤖 RULE-BASED AI (Press P to disable)');
        this.aiStatusText?.setVisible(true);
      } else {
        this.aiStatusText?.setText('🧠 ML AI PLAYING (Press O to disable)');
        this.aiStatusText?.setVisible(true);
      }
    } else {
      this.aiStatusText?.setVisible(false);
    }
  }

  public openInGameChat() {
    if (!this.scene.isOnlineMode || this.chatInputActive) return;
    
    this.chatInputActive = true;
    
    // Pause player controls while typing
    // Create chat input container
    const gameCanvas = this.scene.game.canvas;
    const canvasRect = gameCanvas.getBoundingClientRect();
    
    this.chatContainer = document.createElement('div');
    this.chatContainer.style.position = 'absolute';
    this.chatContainer.style.left = `${canvasRect.left + 10}px`;
    this.chatContainer.style.bottom = `${window.innerHeight - canvasRect.bottom + 10}px`;
    this.chatContainer.style.zIndex = '1000';
    this.chatContainer.style.display = 'flex';
    this.chatContainer.style.alignItems = 'center';
    this.chatContainer.style.gap = '8px';
    
    const label = document.createElement('span');
    label.textContent = 'Chat:';
    label.style.color = '#ffffff';
    label.style.fontSize = '14px';
    label.style.fontFamily = 'Arial, sans-serif';
    label.style.textShadow = '1px 1px 2px #000';
    
    this.chatInputElement = document.createElement('input');
    this.chatInputElement.type = 'text';
    this.chatInputElement.placeholder = 'Type message...';
    this.chatInputElement.maxLength = 100;
    this.chatInputElement.style.width = '250px';
    this.chatInputElement.style.padding = '6px 10px';
    this.chatInputElement.style.fontSize = '14px';
    this.chatInputElement.style.fontFamily = 'Arial, sans-serif';
    this.chatInputElement.style.border = '2px solid #4488ff';
    this.chatInputElement.style.borderRadius = '4px';
    this.chatInputElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.chatInputElement.style.color = '#ffffff';
    this.chatInputElement.style.outline = 'none';
    
    this.chatContainer.appendChild(label);
    this.chatContainer.appendChild(this.chatInputElement);
    document.body.appendChild(this.chatContainer);
    
    // Focus the input
    this.chatInputElement.focus();
    
    // Handle Enter to send, Escape to cancel
    this.chatInputElement.addEventListener('keydown', (e: KeyboardEvent) => {
      e.stopPropagation(); // Prevent game from receiving key events
      
      if (e.key === 'Enter') {
        const message = this.chatInputElement?.value.trim();
        if (message) {
          // Send chat message via online service
          const onlineService = OnlineCoopService.getInstance();
          onlineService.sendChat(message);
        }
        this.closeInGameChat();
      } else if (e.key === 'Escape') {
        this.closeInGameChat();
      }
    });
    
    // Close on blur (clicking outside)
    this.chatInputElement.addEventListener('blur', () => {
      // Small delay to allow Enter key to be processed first
      setTimeout(() => {
        if (this.chatInputActive) {
          this.closeInGameChat();
        }
      }, 100);
    });
  }
  
  public closeInGameChat() {
    this.chatInputActive = false;
    
    if (this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer);
    }
    this.chatContainer = null;
    this.chatInputElement = null;
    
    // Return focus to game canvas
    this.scene.game.canvas.focus();
  }

  public destroy() {
    this.closeInGameChat();
  }
}
