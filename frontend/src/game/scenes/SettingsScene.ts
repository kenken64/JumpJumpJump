import Phaser from 'phaser';
import { MenuScene } from './MenuScene';

export class SettingsScene extends Phaser.Scene {
  private static musicVolume: number = 0.5;
  private static sfxVolume: number = 0.4;
  private static musicEnabled: boolean = true;
  private static sfxEnabled: boolean = true;
  private static initialized: boolean = false;

  private musicToggleText?: Phaser.GameObjects.Text;
  private sfxToggleText?: Phaser.GameObjects.Text;
  private musicVolumeText?: Phaser.GameObjects.Text;
  private sfxVolumeText?: Phaser.GameObjects.Text;
  private musicSlider?: Phaser.GameObjects.Rectangle;
  private sfxSlider?: Phaser.GameObjects.Rectangle;
  private isDraggingMusicSlider: boolean = false;
  private isDraggingSfxSlider: boolean = false;

  constructor() {
    super({ key: 'SettingsScene' });
    // Load settings from localStorage on first instantiation
    if (!SettingsScene.initialized) {
      SettingsScene.loadSettings();
      SettingsScene.initialized = true;
    }
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Save settings to localStorage on scene creation to ensure they exist
    SettingsScene.saveSettings();

    // Background
    this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

    // Title
    this.add.text(width / 2, 80, 'SETTINGS', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Settings panel background
    const panelWidth = 600;
    const panelHeight = 500;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = 150;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x34495e, 0.9).setOrigin(0);
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff, 0).setOrigin(0).setStrokeStyle(3, 0xecf0f1);

    let yPos = panelY + 40;

    // Music Section
    this.add.text(width / 2, yPos, 'MUSIC', {
      fontSize: '28px',
      color: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yPos += 50;

    // Music Toggle
    const musicToggleBtn = this.createToggleButton(width / 2 - 150, yPos, SettingsScene.musicEnabled);
    this.musicToggleText = this.add.text(width / 2 - 80, yPos, SettingsScene.musicEnabled ? 'ON' : 'OFF', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    musicToggleBtn.on('pointerdown', () => {
      SettingsScene.musicEnabled = !SettingsScene.musicEnabled;
      this.updateMusicToggle(musicToggleBtn);
      this.applyMusicSettings();
      SettingsScene.saveSettings();
    });

    // Music Volume Label
    this.add.text(width / 2 + 20, yPos, 'Volume:', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0, 0.5);

    yPos += 50;

    // Music Volume Slider
    this.createMusicVolumeSlider(width / 2, yPos);

    yPos += 80;

    // Sound Effects Section
    this.add.text(width / 2, yPos, 'SOUND EFFECTS', {
      fontSize: '28px',
      color: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yPos += 50;

    // SFX Toggle
    const sfxToggleBtn = this.createToggleButton(width / 2 - 150, yPos, SettingsScene.sfxEnabled);
    this.sfxToggleText = this.add.text(width / 2 - 80, yPos, SettingsScene.sfxEnabled ? 'ON' : 'OFF', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    sfxToggleBtn.on('pointerdown', () => {
      SettingsScene.sfxEnabled = !SettingsScene.sfxEnabled;
      this.updateSfxToggle(sfxToggleBtn);
      SettingsScene.saveSettings();
    });

    // SFX Volume Label
    this.add.text(width / 2 + 20, yPos, 'Volume:', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0, 0.5);

    yPos += 50;

    // SFX Volume Slider
    this.createSfxVolumeSlider(width / 2, yPos);

    // Back Button
    const backButton = this.createButton(width / 2, height - 80, 'Back to Menu', 0x95a5a6);
    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Setup pointer events for sliders
    this.input.on('pointerup', () => {
      this.isDraggingMusicSlider = false;
      this.isDraggingSfxSlider = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingMusicSlider) {
        this.updateMusicSliderFromPointer(pointer.x);
      }
      if (this.isDraggingSfxSlider) {
        this.updateSfxSliderFromPointer(pointer.x);
      }
    });
  }

  private createToggleButton(x: number, y: number, isOn: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 60, 30, isOn ? 0x27ae60 : 0xe74c3c);
    bg.setStrokeStyle(2, 0xffffff);
    
    const knob = this.add.circle(isOn ? 15 : -15, 0, 12, 0xffffff);
    
    container.add([bg, knob]);
    container.setSize(60, 30);
    container.setInteractive({ useHandCursor: true });
    container.setData('bg', bg);
    container.setData('knob', knob);
    container.setData('isOn', isOn);

    return container;
  }

  private updateMusicToggle(container: Phaser.GameObjects.Container): void {
    const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
    const knob = container.getData('knob') as Phaser.GameObjects.Arc;
    const isOn = SettingsScene.musicEnabled;
    
    bg.setFillStyle(isOn ? 0x27ae60 : 0xe74c3c);
    knob.x = isOn ? 15 : -15;
    container.setData('isOn', isOn);
    
    if (this.musicToggleText) {
      this.musicToggleText.setText(isOn ? 'ON' : 'OFF');
    }
  }

  private updateSfxToggle(container: Phaser.GameObjects.Container): void {
    const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
    const knob = container.getData('knob') as Phaser.GameObjects.Arc;
    const isOn = SettingsScene.sfxEnabled;
    
    bg.setFillStyle(isOn ? 0x27ae60 : 0xe74c3c);
    knob.x = isOn ? 15 : -15;
    container.setData('isOn', isOn);
    
    if (this.sfxToggleText) {
      this.sfxToggleText.setText(isOn ? 'ON' : 'OFF');
    }
  }

  private createMusicVolumeSlider(x: number, y: number): void {
    const sliderWidth = 300;
    const sliderHeight = 10;

    // Slider track
    const track = this.add.rectangle(x, y, sliderWidth, sliderHeight, 0x7f8c8d);
    track.setOrigin(0.5);

    // Slider fill
    const fill = this.add.rectangle(x - sliderWidth / 2, y, sliderWidth * SettingsScene.musicVolume, sliderHeight, 0x3498db);
    fill.setOrigin(0, 0.5);

    // Slider handle
    const handleX = x - sliderWidth / 2 + sliderWidth * SettingsScene.musicVolume;
    this.musicSlider = this.add.rectangle(handleX, y, 20, 30, 0xecf0f1);
    this.musicSlider.setOrigin(0.5);
    this.musicSlider.setInteractive({ useHandCursor: true, draggable: true });
    this.musicSlider.setStrokeStyle(2, 0x2c3e50);

    // Volume percentage text
    this.musicVolumeText = this.add.text(x, y + 30, `${Math.round(SettingsScene.musicVolume * 100)}%`, {
      fontSize: '16px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Store references
    this.musicSlider.setData('track', track);
    this.musicSlider.setData('fill', fill);
    this.musicSlider.setData('sliderWidth', sliderWidth);
    this.musicSlider.setData('centerX', x);

    this.musicSlider.on('pointerdown', () => {
      this.isDraggingMusicSlider = true;
    });
  }

  private createSfxVolumeSlider(x: number, y: number): void {
    const sliderWidth = 300;
    const sliderHeight = 10;

    // Slider track
    const track = this.add.rectangle(x, y, sliderWidth, sliderHeight, 0x7f8c8d);
    track.setOrigin(0.5);

    // Slider fill
    const fill = this.add.rectangle(x - sliderWidth / 2, y, sliderWidth * SettingsScene.sfxVolume, sliderHeight, 0xe74c3c);
    fill.setOrigin(0, 0.5);

    // Slider handle
    const handleX = x - sliderWidth / 2 + sliderWidth * SettingsScene.sfxVolume;
    this.sfxSlider = this.add.rectangle(handleX, y, 20, 30, 0xecf0f1);
    this.sfxSlider.setOrigin(0.5);
    this.sfxSlider.setInteractive({ useHandCursor: true, draggable: true });
    this.sfxSlider.setStrokeStyle(2, 0x2c3e50);

    // Volume percentage text
    this.sfxVolumeText = this.add.text(x, y + 30, `${Math.round(SettingsScene.sfxVolume * 100)}%`, {
      fontSize: '16px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Store references
    this.sfxSlider.setData('track', track);
    this.sfxSlider.setData('fill', fill);
    this.sfxSlider.setData('sliderWidth', sliderWidth);
    this.sfxSlider.setData('centerX', x);

    this.sfxSlider.on('pointerdown', () => {
      this.isDraggingSfxSlider = true;
    });
  }

  private updateMusicSliderFromPointer(pointerX: number): void {
    if (!this.musicSlider) return;

    const sliderWidth = this.musicSlider.getData('sliderWidth') as number;
    const centerX = this.musicSlider.getData('centerX') as number;
    const fill = this.musicSlider.getData('fill') as Phaser.GameObjects.Rectangle;
    
    const minX = centerX - sliderWidth / 2;
    const maxX = centerX + sliderWidth / 2;
    const clampedX = Phaser.Math.Clamp(pointerX, minX, maxX);
    
    this.musicSlider.x = clampedX;
    
    const volume = (clampedX - minX) / sliderWidth;
    SettingsScene.musicVolume = volume;
    
    fill.width = sliderWidth * volume;
    
    if (this.musicVolumeText) {
      this.musicVolumeText.setText(`${Math.round(volume * 100)}%`);
    }
    
    this.applyMusicSettings();
    SettingsScene.saveSettings();
  }

  private updateSfxSliderFromPointer(pointerX: number): void {
    if (!this.sfxSlider) return;

    const sliderWidth = this.sfxSlider.getData('sliderWidth') as number;
    const centerX = this.sfxSlider.getData('centerX') as number;
    const fill = this.sfxSlider.getData('fill') as Phaser.GameObjects.Rectangle;
    
    const minX = centerX - sliderWidth / 2;
    const maxX = centerX + sliderWidth / 2;
    const clampedX = Phaser.Math.Clamp(pointerX, minX, maxX);
    
    this.sfxSlider.x = clampedX;
    
    const volume = (clampedX - minX) / sliderWidth;
    SettingsScene.sfxVolume = volume;
    
    fill.width = sliderWidth * volume;
    
    if (this.sfxVolumeText) {
      this.sfxVolumeText.setText(`${Math.round(volume * 100)}%`);
    }
    SettingsScene.saveSettings();
  }

  private applyMusicSettings(): void {
    // Update MenuScene music state
    const bgMusic = MenuScene.getBgMusic();
    
    if (bgMusic) {
      (bgMusic as any).setVolume(SettingsScene.musicVolume);
      
      if (SettingsScene.musicEnabled && !bgMusic.isPlaying) {
        bgMusic.resume();
      } else if (!SettingsScene.musicEnabled && bgMusic.isPlaying) {
        bgMusic.pause();
      }
    }
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

  public static isMusicEnabled(): boolean {
    return SettingsScene.musicEnabled;
  }

  public static isSfxEnabled(): boolean {
    return SettingsScene.sfxEnabled;
  }

  public static getMusicVolume(): number {
    return SettingsScene.musicVolume;
  }

  public static getSfxVolume(): number {
    return SettingsScene.sfxVolume;
  }

  public static loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('jumpJumpJumpSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        SettingsScene.musicVolume = settings.musicVolume ?? 0.5;
        SettingsScene.sfxVolume = settings.sfxVolume ?? 0.4;
        SettingsScene.musicEnabled = settings.musicEnabled ?? true;
        SettingsScene.sfxEnabled = settings.sfxEnabled ?? true;
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }

  public static saveSettings(): void {
    try {
      const settings = {
        musicVolume: SettingsScene.musicVolume,
        sfxVolume: SettingsScene.sfxVolume,
        musicEnabled: SettingsScene.musicEnabled,
        sfxEnabled: SettingsScene.sfxEnabled
      };
      localStorage.setItem('jumpJumpJumpSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  public static initializeSettings(): void {
    if (!SettingsScene.initialized) {
      SettingsScene.loadSettings();
      SettingsScene.initialized = true;
    }
  }
}
