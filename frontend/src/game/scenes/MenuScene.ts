import Phaser from 'phaser';
import { API_CONFIG } from '../apiConfig';
import { SettingsScene } from './SettingsScene';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  level_reached: number;
  created_at: string;
}

export class MenuScene extends Phaser.Scene {
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private leaderboardScoreTexts: Phaser.GameObjects.Text[] = [];
  private static bgMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(): void {
    // Re-fetch leaderboard data every time the scene is started/resumed
    // This ensures fresh data when returning from game
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Initialize background music
    if (!MenuScene.bgMusic) {
      MenuScene.bgMusic = this.sound.add('bgMusic', { loop: true, volume: SettingsScene.getMusicVolume() });
    }
    
    // Play or pause based on enabled state
    if (SettingsScene.isMusicEnabled() && !MenuScene.bgMusic.isPlaying) {
      MenuScene.bgMusic.play();
    } else if (!SettingsScene.isMusicEnabled() && MenuScene.bgMusic.isPlaying) {
      MenuScene.bgMusic.pause();
    }

    // Background
    this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

    // Add game preview image on the left side
    const gameImage = this.add.image(420, height / 2, 'game1');
    gameImage.setDisplaySize(520, 520); // Set specific width and height
    gameImage.setOrigin(0.5);

    // Title
    this.add.text(width / 2, 100, 'JUMP JUMP JUMP!', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'Select Game Mode', {
      fontSize: '24px',
      color: '#ecf0f1',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Campaign Mode Button
    const campaignButton = this.createButton(width / 2, 250, 'Campaign Mode', 0x27ae60);
    campaignButton.on('pointerdown', () => {
      this.scene.start('MainGameScene');
    });

    // Custom Levels Button
    const customButton = this.createButton(width / 2, 330, 'Custom Levels', 0x3498db);
    customButton.on('pointerdown', () => {
      this.scene.start('CustomLevelSelectScene');
    });

    // Level Editor Button
    const editorButton = this.createButton(width / 2, 410, 'Level Editor', 0xe74c3c);
    editorButton.on('pointerdown', () => {
      this.scene.start('LevelEditorScene');
    });

    // Settings Button
    const settingsButton = this.createButton(width / 2, 490, 'Settings', 0x95a5a6);
    settingsButton.on('pointerdown', () => {
      this.scene.start('SettingsScene');
    });

    // Leaderboard Section
    this.createLeaderboard(width, height);

    // Instructions
    this.add.text(width / 2, height - 80, 'Controls: Arrow Keys / WASD / Gamepad', {
      fontSize: '18px',
      color: '#bdc3c7',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 50, 'Avoid traffic and reach the goal! Touch the damn tree!', {
      fontSize: '22px',
      color: '#95a5a6',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Fetch leaderboard data
    this.fetchLeaderboard();

    // Set up event listeners to refresh leaderboard when returning to menu
    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneResume, this);
  }

  private onSceneWake(): void {
    // Called when scene wakes up from sleep
    this.fetchLeaderboard();
  }

  private onSceneResume(): void {
    // Called when scene resumes from pause
    this.fetchLeaderboard();
  }

  shutdown(): void {
    // Clean up event listeners when scene shuts down
    this.events.off('wake', this.onSceneWake, this);
    this.events.off('resume', this.onSceneResume, this);
    
    // Destroy all leaderboard text objects
    this.leaderboardTexts.forEach(text => {
      if (text && text.active) {
        text.destroy();
      }
    });
    this.leaderboardScoreTexts.forEach(text => {
      if (text && text.active) {
        text.destroy();
      }
    });
    
    // Clear leaderboard arrays
    this.leaderboardTexts = [];
    this.leaderboardScoreTexts = [];
  }

  private createLeaderboard(width: number, _height: number): void {
    // Clear any existing text objects
    this.leaderboardTexts = [];
    this.leaderboardScoreTexts = [];

    const leaderboardX = width - 350;
    const leaderboardY = 100;

    // Leaderboard background
    const leaderboardBg = this.add.rectangle(leaderboardX, leaderboardY, 320, 400, 0x34495e, 0.9);
    leaderboardBg.setStrokeStyle(2, 0xecf0f1);
    leaderboardBg.setOrigin(0, 0);

    // Leaderboard title
    this.add.text(leaderboardX + 160, leaderboardY + 20, 'LEADERBOARD', {
      fontSize: '28px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Header
    this.add.text(leaderboardX + 20, leaderboardY + 50, 'Rank  Player', {
      fontSize: '18px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    });

    this.add.text(leaderboardX + 240, leaderboardY + 50, 'Score', {
      fontSize: '18px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    });

    // Create placeholder texts for top 10
    for (let i = 0; i < 10; i++) {
      const yPos = leaderboardY + 80 + (i * 28);
      const nameText = this.add.text(leaderboardX + 20, yPos, 'Loading...', {
        fontSize: '16px',
        color: '#bdc3c7'
      });
      this.leaderboardTexts.push(nameText);

      // Create score text placeholder
      const scoreText = this.add.text(leaderboardX + 240, yPos, '', {
        fontSize: '16px',
        color: '#bdc3c7',
        fontStyle: 'bold'
      });
      this.leaderboardScoreTexts.push(scoreText);
    }
  }

  private async fetchLeaderboard(): Promise<void> {
    try {
      console.log('Fetching leaderboard from:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEADERBOARD}?limit=10`);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEADERBOARD}?limit=10`);

      if (response.ok) {
        const data: LeaderboardEntry[] = await response.json();
        console.log('Leaderboard data received:', data.length, 'entries');
        this.displayLeaderboard(data);
      } else {
        console.warn('Leaderboard response not OK:', response.status);
        // If no records, just show empty leaderboard
        this.displayLeaderboard([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // If backend not running, show empty leaderboard instead of error
      this.displayLeaderboard([]);
    }
  }

  private displayLeaderboard(entries: LeaderboardEntry[]): void {
    // Check if scene is still active and arrays are valid
    if (!this.scene.isActive() || this.leaderboardTexts.length === 0) {
      return;
    }

    entries.forEach((entry, index) => {
      if (index < this.leaderboardTexts.length) {
        const text = this.leaderboardTexts[index];
        const scoreText = this.leaderboardScoreTexts[index];
        
        // Check if text objects still exist and are active
        if (!text || !text.active || !scoreText || !scoreText.active) {
          return;
        }

        const rank = index + 1;
        const username = entry.username.length > 18 ? entry.username.substring(0, 18) + '...' : entry.username;

        // Medal colors for top 3
        let color = '#bdc3c7';
        if (rank === 1) color = '#f1c40f'; // Gold
        else if (rank === 2) color = '#95a5a6'; // Silver
        else if (rank === 3) color = '#cd7f32'; // Bronze

        // Update name text
        text.setText(`${rank}.  ${username}`);
        text.setColor(color);

        // Update score text
        scoreText.setText(entry.score.toString());
        scoreText.setColor(color);
      }
    });

    // Clear remaining slots if less than 10 entries
    for (let i = entries.length; i < this.leaderboardTexts.length; i++) {
      const text = this.leaderboardTexts[i];
      const scoreText = this.leaderboardScoreTexts[i];
      
      // Check if text objects still exist and are active
      if (text && text.active && scoreText && scoreText.active) {
        text.setText(`${i + 1}.  ---`);
        text.setColor('#7f8c8d');
        scoreText.setText('');
      }
    }
  }

  // @ts-expect-error - Keeping for potential future use
  private displayError(message: string): void {
    this.leaderboardTexts.forEach((text, index) => {
      if (index === 0) {
        text.setText(message);
        text.setColor('#e74c3c');
      } else {
        text.setText('');
      }
    });
  }

  private createButton(x: number, y: number, text: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 60, color);
    bg.setStrokeStyle(3, 0xffffff);

    const label = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(300, 60);
    container.setInteractive({ useHandCursor: true });

    // Hover effects
    container.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.GetColor(
        Math.min(255, Phaser.Display.Color.IntegerToColor(color).red + 30),
        Math.min(255, Phaser.Display.Color.IntegerToColor(color).green + 30),
        Math.min(255, Phaser.Display.Color.IntegerToColor(color).blue + 30)
      ));
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(color);
      container.setScale(1);
    });

    return container;
  }

  public static getBgMusic(): Phaser.Sound.BaseSound | undefined {
    return MenuScene.bgMusic;
  }
}
