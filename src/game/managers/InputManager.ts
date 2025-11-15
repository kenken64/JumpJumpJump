import Phaser from 'phaser';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  pause: boolean;
}

export class InputManager {
  private scene: Phaser.Scene;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;
  private gamepad?: Phaser.Input.Gamepad.Gamepad;
  private deadzone: number = 0.2;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboard();
    this.setupGamepad();
  }

  private setupKeyboard(): void {
    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D') as any;
      this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
  }

  private setupGamepad(): void {
    if (this.scene.input.gamepad) {
      this.scene.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
        console.log('Gamepad connected:', pad.id);
      });

      // Check if gamepad already connected
      if (this.scene.input.gamepad.total > 0) {
        this.gamepad = this.scene.input.gamepad.getPad(0);
        console.log('Gamepad already connected:', this.gamepad?.id);
      }
    }
  }

  public getInputState(): InputState {
    const state: InputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      pause: false,
    };

    // Keyboard input
    if (this.cursors && this.wasd) {
      state.left = this.cursors.left.isDown || this.wasd.A.isDown;
      state.right = this.cursors.right.isDown || this.wasd.D.isDown;
      state.up = this.cursors.up.isDown || this.wasd.W.isDown;
      state.down = this.cursors.down.isDown || this.wasd.S.isDown;
      state.jump = this.spaceKey?.isDown || false;
      state.pause = this.escKey?.isDown || false;
    }

    // Gamepad input (overrides keyboard if active)
    if (this.gamepad) {
      // D-Pad
      if (this.gamepad.left) state.left = true;
      if (this.gamepad.right) state.right = true;
      if (this.gamepad.up) state.up = true;
      if (this.gamepad.down) state.down = true;

      // Left analog stick
      const leftStickX = this.gamepad.leftStick.x;
      const leftStickY = this.gamepad.leftStick.y;

      if (Math.abs(leftStickX) > this.deadzone) {
        if (leftStickX < 0) state.left = true;
        if (leftStickX > 0) state.right = true;
      }

      if (Math.abs(leftStickY) > this.deadzone) {
        if (leftStickY < 0) state.up = true;
        if (leftStickY > 0) state.down = true;
      }

      // Buttons
      // A button (Xbox) / Cross (PlayStation) for jump
      if (this.gamepad.A) state.jump = true;

      // Start button for pause
      if (this.gamepad.buttons[9]?.pressed) state.pause = true;
    }

    return state;
  }

  public isGamepadConnected(): boolean {
    return this.gamepad !== undefined;
  }

  public getGamepadName(): string {
    return this.gamepad?.id || 'No gamepad';
  }

  public destroy(): void {
    // Cleanup if needed
  }
}
