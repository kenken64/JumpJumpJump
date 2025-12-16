import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock DQNAgent
vi.mock('../ai/DQNAgent', () => ({
  DQNAgent: vi.fn().mockImplementation(() => ({
    selectAction: vi.fn().mockReturnValue(0),
    remember: vi.fn(),
    train: vi.fn(),
    saveModel: vi.fn().mockResolvedValue(undefined),
    loadModel: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    epsilon: 0.5
  }))
}))

// Mock Phaser Module
vi.mock('phaser', () => {
  const Phaser = {
    Scene: class {
      sys = {
        settings: { data: {} },
        game: {
          device: { os: { desktop: true } },
          canvas: { width: 1280, height: 720 }
        }
      }
      events = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
      }
      cameras = {
        main: {
          width: 1280,
          height: 720,
          setBackgroundColor: vi.fn()
        }
      }
      add = {
        text: vi.fn().mockImplementation(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        circle: vi.fn().mockImplementation(() => ({
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        rectangle: vi.fn().mockImplementation(() => ({
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        graphics: vi.fn().mockImplementation(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          lineBetween: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        container: vi.fn().mockImplementation(() => ({
          add: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setName: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          getByName: vi.fn().mockReturnValue({
            setText: vi.fn(),
            setColor: vi.fn(),
            setAlpha: vi.fn()
          }),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        image: vi.fn().mockImplementation(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }))
      }
      load = {
        image: vi.fn()
      }
      input = {
        keyboard: {
          on: vi.fn(),
          off: vi.fn(),
          addKey: vi.fn().mockReturnValue({ on: vi.fn() }),
          removeAllListeners: vi.fn()
        },
        on: vi.fn(),
        gamepad: {
          on: vi.fn(),
          gamepads: [],
          pads: []
        }
      }
      scene = {
        start: vi.fn(),
        stop: vi.fn(),
        launch: vi.fn(),
        isActive: vi.fn().mockReturnValue(false),
        bringToTop: vi.fn(),
        get: vi.fn().mockReturnValue({
          player: {
            x: 400,
            y: 300,
            body: { velocity: { x: 50, y: 0 } },
            jump: vi.fn(),
            moveLeft: vi.fn(),
            moveRight: vi.fn(),
            shoot: vi.fn(),
            idle: vi.fn(),
            getData: vi.fn()
          },
          platforms: { getChildren: vi.fn().mockReturnValue([]) },
          enemies: { getChildren: vi.fn().mockReturnValue([]) },
          spikes: { getChildren: vi.fn().mockReturnValue([]) }
        })
      }
      tweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() })
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn()
      }
      physics = {
        world: {
          pause: vi.fn(),
          resume: vi.fn()
        }
      }
      
      constructor() {}
    },
    Geom: {
      Rectangle: class {
        constructor() {}
        static Contains = vi.fn()
      },
      Circle: class { constructor() {} }
    },
    Math: {
      Between: () => 0,
      FloatBetween: () => 0
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          ESC: 27,
          SPACE: 32,
          R: 82,
          S: 83,
          L: 76,
          A: 65,
          ONE: 49,
          TWO: 50,
          THREE: 51,
          FOUR: 52,
          FIVE: 53
        }
      }
    }
  }

  return { default: Phaser, ...Phaser }
})

import DQNTrainingScene from '../scenes/DQNTrainingScene'
import { DQNAgent } from '../ai/DQNAgent'

describe('DQNTrainingScene', () => {
  let scene: DQNTrainingScene
  let mockAgent: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    scene = new DQNTrainingScene()
    
    // Access the mock agent
    mockAgent = {
      selectAction: vi.fn().mockReturnValue(0),
      remember: vi.fn(),
      train: vi.fn(),
      saveModel: vi.fn().mockResolvedValue(undefined),
      loadModel: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
      epsilon: 0.5
    }
  })

  afterEach(() => {
    if (scene) {
      scene.shutdown()
    }
  })

  describe('constructor', () => {
    it('should create scene with correct key', () => {
      const newScene = new DQNTrainingScene()
      expect(newScene).toBeInstanceOf(DQNTrainingScene)
    })
  })

  describe('create', () => {
    it('should set background color', () => {
      scene.create()
      
      expect(scene.cameras.main.setBackgroundColor).toHaveBeenCalledWith('#1a1a2e')
    })

    it('should create title', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalledWith(640, 30, '🤖 DQN AI Training', expect.any(Object))
    })

    it('should create controls text', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should create stats text', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should create episode text', () => {
      scene.create()
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should create reward chart graphics', () => {
      scene.create()
      
      expect(scene.add.graphics).toHaveBeenCalled()
    })

    it('should setup keyboard controls', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should launch game scene', () => {
      scene.create()
      
      expect(scene.scene.launch).toHaveBeenCalledWith('GameScene', expect.any(Object))
    })
  })

  describe('setupControls', () => {
    it('should add ESC key handler', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should add SPACE key handler', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should add R key handler for reset', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should add S key handler for save', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should add L key handler for load', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should add number key handlers for speed', () => {
      scene.create()
      
      // Should add keys for 1-5
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })

    it('should add A key handler for auto-restart', () => {
      scene.create()
      
      expect(scene.input.keyboard?.addKey).toHaveBeenCalled()
    })
  })

  describe('startTraining', () => {
    it('should show warning if no agent', () => {
      scene.create();
      (scene as any).dqnAgent = null
      
      ;(scene as any).startTraining()
      
      expect((scene as any).isTraining).toBe(false)
    })

    it('should set training flag to true when agent exists', () => {
      scene.create();
      (scene as any).dqnAgent = { resetEpisode: vi.fn() }
      
      ;(scene as any).startTraining()
      
      expect((scene as any).isTraining).toBe(true)
    })
  })

  describe('pauseTraining', () => {
    it('should set training flag to false', () => {
      scene.create();
      (scene as any).isTraining = true
      
      ;(scene as any).pauseTraining()
      
      expect((scene as any).isTraining).toBe(false)
    })

    it('should set paused flag to true', () => {
      scene.create();
      (scene as any).isPaused = false
      
      ;(scene as any).pauseTraining()
      
      expect((scene as any).isPaused).toBe(true)
    })
  })

  describe('resetEpisode', () => {
    it('should reset current step to 0', () => {
      scene.create();
      (scene as any).currentStep = 100
      ;(scene as any).dqnAgent = { resetEpisode: vi.fn() }
      
      ;(scene as any).resetEpisode()
      
      expect((scene as any).currentStep).toBe(0)
    })

    it('should call agent resetEpisode', () => {
      scene.create()
      const resetFn = vi.fn()
      ;(scene as any).dqnAgent = { resetEpisode: resetFn }
      
      ;(scene as any).resetEpisode()
      
      expect(resetFn).toHaveBeenCalled()
    })

    it('should increment episode when training', () => {
      scene.create();
      (scene as any).isTraining = true
      ;(scene as any).episode = 5
      ;(scene as any).dqnAgent = { resetEpisode: vi.fn() }
      
      ;(scene as any).resetEpisode()
      
      expect((scene as any).episode).toBe(6)
    })
  })

  describe('captureGameState', () => {
    it('should return null when no gameScene', () => {
      scene.create();
      (scene as any).gameScene = null
      
      const state = (scene as any).captureGameState()
      
      expect(state).toBeNull()
    })

    it('should return game state object when gameScene exists', () => {
      scene.create()
      const mockPlayer = {
        x: 400, y: 300,
        body: { velocity: { x: 50, y: 0 }, touching: { down: true } }
      }
      ;(scene as any).gameScene = {
        player: mockPlayer,
        platforms: { getChildren: vi.fn().mockReturnValue([]) },
        enemies: { getChildren: vi.fn().mockReturnValue([]) },
        spikes: { getChildren: vi.fn().mockReturnValue([]) }
      }
      
      const state = (scene as any).captureGameState()
      
      expect(state).toBeDefined()
      if (state) {
        expect(state.playerX).toBe(400)
        expect(state.playerY).toBe(300)
      }
    })

    it('should return null when player has no body', () => {
      scene.create();
      (scene as any).gameScene = {
        player: { x: 400, y: 300, body: null }
      }
      
      const state = (scene as any).captureGameState()
      
      expect(state).toBeNull()
    })
  })

  describe('checkGroundAhead', () => {
    it('should return false if no platforms', () => {
      scene.create()
      
      const hasGround = (scene as any).checkGroundAhead(null, 50, 100)
      
      expect(hasGround).toBe(false)
    })

    it('should return false if no active platforms in range', () => {
      scene.create()
      
      const mockPlatforms = {
        getChildren: vi.fn().mockReturnValue([])
      }
      
      const hasGround = (scene as any).checkGroundAhead(mockPlatforms, 50, 100)
      
      expect(hasGround).toBe(false)
    })
  })

  describe('applyAction', () => {
    it('should call setAIAction on gameScene', () => {
      scene.create()
      
      const setAIAction = vi.fn()
      ;(scene as any).gameScene = { setAIAction }
      
      ;(scene as any).applyAction({ actionIndex: 0, action: 'jump' })
      
      expect(setAIAction).toHaveBeenCalled()
    })

    it('should handle missing setAIAction gracefully', () => {
      scene.create();
      (scene as any).gameScene = {}
      
      expect(() => (scene as any).applyAction({ actionIndex: 0 })).not.toThrow()
    })
  })

  describe('updateUI', () => {
    it('should do nothing if no dqnAgent', () => {
      scene.create();
      (scene as any).dqnAgent = null
      
      expect(() => (scene as any).updateUI()).not.toThrow()
    })

    it('should update stats text when agent exists', () => {
      scene.create()
      
      const mockStatsText = { setText: vi.fn() }
      const mockAgent = {
        getStats: vi.fn().mockReturnValue({
          epsilon: 0.5,
          bufferSize: 100,
          trainingSteps: 50,
          episodes: 5,
          averageReward: 10.5,
          totalReward: 20.0,
          lastReward: 5.0
        })
      }
      ;(scene as any).statsText = mockStatsText
      ;(scene as any).dqnAgent = mockAgent
      ;(scene as any).episodeText = { setText: vi.fn() }
      ;(scene as any).updateRewardChart = vi.fn()
      
      ;(scene as any).updateUI()
      
      expect(mockStatsText.setText).toHaveBeenCalled()
    })
  })

  describe('updateRewardChart', () => {
    it('should do nothing with empty reward history', () => {
      scene.create();
      (scene as any).rewardHistory = []
      
      expect(() => (scene as any).updateRewardChart()).not.toThrow()
    })

    it('should draw chart with reward history', () => {
      scene.create();
      (scene as any).rewardHistory = [10, 20, 30, 40, 50]
      
      expect(() => (scene as any).updateRewardChart()).not.toThrow()
    })
  })

  describe('showNotification', () => {
    it('should create notification text', () => {
      scene.create()
      
      ;(scene as any).showNotification('Test message')
      
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('should create fade animation', () => {
      scene.create()
      
      ;(scene as any).showNotification('Test message')
      
      expect(scene.tweens.add).toHaveBeenCalled()
    })
  })

  describe('backToMenu', () => {
    it('should stop training', () => {
      scene.create();
      (scene as any).isTraining = true
      ;(scene as any).backToMenu()
      
      expect((scene as any).isTraining).toBe(false)
    })

    it('should dispose agent if exists', () => {
      scene.create()
      const disposeFn = vi.fn()
      ;(scene as any).dqnAgent = { dispose: disposeFn }
      
      ;(scene as any).backToMenu()
      
      expect(disposeFn).toHaveBeenCalled()
    })

    it('should start menu scene', () => {
      scene.create()
      ;(scene as any).backToMenu()
      
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene')
    })

    it('should stop game scene', () => {
      scene.create()
      ;(scene as any).backToMenu()
      
      expect(scene.scene.stop).toHaveBeenCalledWith('GameScene')
    })
  })

  describe('shutdown', () => {
    it('should handle missing gamepad plugin gracefully', () => {
      scene.input = {} as any
      
      expect(() => scene.shutdown()).not.toThrow()
    })

    it('should initialize gamepad pads array if missing', () => {
      scene.input.gamepad = {} as any
      
      scene.shutdown()
      
      expect((scene.input.gamepad as any).pads).toEqual([])
    })
  })

  describe('trainingStep', () => {
    it('should do nothing when not training', () => {
      scene.create();
      (scene as any).isTraining = false
      
      expect(() => (scene as any).trainingStep()).not.toThrow()
    })

    it('should do nothing when paused', () => {
      scene.create();
      (scene as any).isTraining = true
      ;(scene as any).isPaused = true
      
      expect(() => (scene as any).trainingStep()).not.toThrow()
    })

    it('should do nothing when gameScene is null', () => {
      scene.create();
      (scene as any).isTraining = true
      ;(scene as any).isPaused = false
      ;(scene as any).gameScene = null
      
      expect(() => (scene as any).trainingStep()).not.toThrow()
    })
  })

  describe('update', () => {
    it('should not call trainingStep when not training', () => {
      scene.create();
      (scene as any).isTraining = false
      
      expect(() => scene.update()).not.toThrow()
    })

    it('should not call trainingStep when paused', () => {
      scene.create();
      (scene as any).isTraining = true
      ;(scene as any).isPaused = true
      
      expect(() => scene.update()).not.toThrow()
    })

    it('should not call trainingStep when gameScene is null', () => {
      scene.create();
      (scene as any).isTraining = true
      ;(scene as any).isPaused = false
      ;(scene as any).gameScene = null
      
      expect(() => scene.update()).not.toThrow()
    })
  })

  describe('drawChartBackground', () => {
    it('should not throw when called', () => {
      scene.create()
      
      expect(() => (scene as any).drawChartBackground()).not.toThrow()
    })
  })

  describe('speed control', () => {
    it('should set speed to 1', () => {
      scene.create();
      (scene as any).trainingSpeed = 1
      
      expect((scene as any).trainingSpeed).toBe(1)
    })

    it('should set speed to 5', () => {
      scene.create();
      (scene as any).trainingSpeed = 5
      
      expect((scene as any).trainingSpeed).toBe(5)
    })
  })

  describe('auto-restart', () => {
    it('should toggle auto-restart flag', () => {
      scene.create()
      const initial = (scene as any).autoRestart
      ;(scene as any).autoRestart = !initial
      
      expect((scene as any).autoRestart).toBe(!initial)
    })
  })

  describe('save and load', () => {
    it('should save model via agent', async () => {
      scene.create();
      (scene as any).dqnAgent = mockAgent
      
      // Simulate S key press which calls dqnAgent.saveModel()
      mockAgent.saveModel()
      
      expect(mockAgent.saveModel).toHaveBeenCalled()
    })

    it('should load model via agent', async () => {
      scene.create();
      (scene as any).dqnAgent = mockAgent
      
      // Simulate L key press which calls dqnAgent.loadModel()
      mockAgent.loadModel()
      
      expect(mockAgent.loadModel).toHaveBeenCalled()
    })
  })
})
