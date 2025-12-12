import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Phaser
vi.mock('phaser', () => {
  return {
    default: {
      Scene: class MockScene {
        scale = { width: 1280, height: 720 }
        add = {
          container: vi.fn(),
          circle: vi.fn(),
          text: vi.fn()
        }
      }
    }
  }
})

describe('VirtualGamepad', () => {
  let mockScene: any
  let mockContainer: any
  let mockCircle: any
  let mockText: any
  let containerEventHandlers: Map<string, Function>

  beforeEach(() => {
    containerEventHandlers = new Map()
    
    mockCircle = {
      setStrokeStyle: vi.fn().mockReturnThis()
    }
    
    mockText = {
      setOrigin: vi.fn().mockReturnThis()
    }
    
    mockContainer = {
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      add: vi.fn(),
      setSize: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn((event: string, handler: Function) => {
        containerEventHandlers.set(event, handler)
        return mockContainer
      }),
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis()
    }
    
    mockScene = {
      scale: { width: 1280, height: 720 },
      add: {
        container: vi.fn(() => mockContainer),
        circle: vi.fn(() => mockCircle),
        text: vi.fn(() => mockText)
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor and createControls', () => {
    it('should create a VirtualGamepad instance', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      expect(gamepad).toBeDefined()
    })

    it('should create 4 button containers (left, right, jump, shoot)', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      // 4 buttons: left, right, jump, shoot
      expect(mockScene.add.container).toHaveBeenCalledTimes(4)
    })

    it('should create circles for each button', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      // 4 circles for 4 buttons
      expect(mockScene.add.circle).toHaveBeenCalledTimes(4)
    })

    it('should create text labels for each button', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      // 4 text labels
      expect(mockScene.add.text).toHaveBeenCalledTimes(4)
    })

    it('should set scroll factor to 0 for UI elements', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      // Each container should have setScrollFactor(0)
      expect(mockContainer.setScrollFactor).toHaveBeenCalledWith(0)
    })

    it('should set depth to 1000 for UI visibility', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      expect(mockContainer.setDepth).toHaveBeenCalledWith(1000)
    })

    it('should make containers interactive', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      expect(mockContainer.setInteractive).toHaveBeenCalled()
    })

    it('should register pointer event handlers', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      // Each button registers: pointerdown, pointerup, pointerout, pointerover
      expect(mockContainer.on).toHaveBeenCalledWith('pointerdown', expect.any(Function))
      expect(mockContainer.on).toHaveBeenCalledWith('pointerup', expect.any(Function))
      expect(mockContainer.on).toHaveBeenCalledWith('pointerout', expect.any(Function))
      expect(mockContainer.on).toHaveBeenCalledWith('pointerover', expect.any(Function))
    })
  })

  describe('createButton helper', () => {
    it('should create button with correct structure', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      
      // Container should have circle and text added
      expect(mockContainer.add).toHaveBeenCalled()
    })

    it('should set stroke style on circle', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      expect(mockCircle.setStrokeStyle).toHaveBeenCalledWith(2, 0xffffff, 0.8)
    })

    it('should center text origin', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      expect(mockText.setOrigin).toHaveBeenCalledWith(0.5)
    })
  })

  describe('button state getters', () => {
    it('should return false for getLeft by default', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      expect(gamepad.getLeft()).toBe(false)
    })

    it('should return false for getRight by default', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      expect(gamepad.getRight()).toBe(false)
    })

    it('should return false for getJump by default', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      expect(gamepad.getJump()).toBe(false)
    })

    it('should return false for getShoot by default', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      expect(gamepad.getShoot()).toBe(false)
    })

    it('should return false for getJumpJustPressed by default', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      expect(gamepad.getJumpJustPressed()).toBe(false)
    })
  })

  describe('button interaction - left button', () => {
    let leftBtnHandlers: Map<string, Function>

    beforeEach(() => {
      leftBtnHandlers = new Map()
      let callCount = 0
      mockScene.add.container = vi.fn(() => {
        callCount++
        const handlers = callCount === 1 ? leftBtnHandlers : new Map()
        return {
          ...mockContainer,
          on: vi.fn((event: string, handler: Function) => {
            handlers.set(event, handler)
            return mockContainer
          })
        }
      })
    })

    it('should set isLeft true on pointerdown', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = leftBtnHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(gamepad.getLeft()).toBe(true)
      }
    })

    it('should set isLeft false on pointerup', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = leftBtnHandlers.get('pointerdown')
      const pointerupHandler = leftBtnHandlers.get('pointerup')
      if (pointerdownHandler && pointerupHandler) {
        pointerdownHandler()
        expect(gamepad.getLeft()).toBe(true)
        pointerupHandler()
        expect(gamepad.getLeft()).toBe(false)
      }
    })

    it('should set isLeft false on pointerout', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = leftBtnHandlers.get('pointerdown')
      const pointeroutHandler = leftBtnHandlers.get('pointerout')
      if (pointerdownHandler && pointeroutHandler) {
        pointerdownHandler()
        pointeroutHandler()
        expect(gamepad.getLeft()).toBe(false)
      }
    })

    it('should set isLeft true on pointerover when pointer is down', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointeroverHandler = leftBtnHandlers.get('pointerover')
      if (pointeroverHandler) {
        pointeroverHandler({ isDown: true })
        expect(gamepad.getLeft()).toBe(true)
      }
    })

    it('should not set isLeft on pointerover when pointer is not down', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointeroverHandler = leftBtnHandlers.get('pointerover')
      if (pointeroverHandler) {
        pointeroverHandler({ isDown: false })
        expect(gamepad.getLeft()).toBe(false)
      }
    })
  })

  describe('button interaction - right button', () => {
    let rightBtnHandlers: Map<string, Function>

    beforeEach(() => {
      rightBtnHandlers = new Map()
      let callCount = 0
      mockScene.add.container = vi.fn(() => {
        callCount++
        const handlers = callCount === 2 ? rightBtnHandlers : new Map()
        return {
          ...mockContainer,
          on: vi.fn((event: string, handler: Function) => {
            handlers.set(event, handler)
            return mockContainer
          })
        }
      })
    })

    it('should set isRight true on pointerdown', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = rightBtnHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(gamepad.getRight()).toBe(true)
      }
    })

    it('should set isRight false on pointerup', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = rightBtnHandlers.get('pointerdown')
      const pointerupHandler = rightBtnHandlers.get('pointerup')
      if (pointerdownHandler && pointerupHandler) {
        pointerdownHandler()
        pointerupHandler()
        expect(gamepad.getRight()).toBe(false)
      }
    })

    it('should set isRight false on pointerout', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = rightBtnHandlers.get('pointerdown')
      const pointeroutHandler = rightBtnHandlers.get('pointerout')
      if (pointerdownHandler && pointeroutHandler) {
        pointerdownHandler()
        pointeroutHandler()
        expect(gamepad.getRight()).toBe(false)
      }
    })

    it('should set isRight true on pointerover when pointer is down', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointeroverHandler = rightBtnHandlers.get('pointerover')
      if (pointeroverHandler) {
        pointeroverHandler({ isDown: true })
        expect(gamepad.getRight()).toBe(true)
      }
    })
  })

  describe('button interaction - jump button', () => {
    let jumpBtnHandlers: Map<string, Function>

    beforeEach(() => {
      jumpBtnHandlers = new Map()
      let callCount = 0
      mockScene.add.container = vi.fn(() => {
        callCount++
        const handlers = callCount === 3 ? jumpBtnHandlers : new Map()
        return {
          ...mockContainer,
          on: vi.fn((event: string, handler: Function) => {
            handlers.set(event, handler)
            return mockContainer
          })
        }
      })
    })

    it('should set isJump true on pointerdown', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = jumpBtnHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(gamepad.getJump()).toBe(true)
      }
    })

    it('should set jumpJustPressed true on pointerdown', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = jumpBtnHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(gamepad.getJumpJustPressed()).toBe(true)
      }
    })

    it('should clear jumpJustPressed after first read', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = jumpBtnHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(gamepad.getJumpJustPressed()).toBe(true)
        expect(gamepad.getJumpJustPressed()).toBe(false)
      }
    })

    it('should set isJump false on pointerup', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = jumpBtnHandlers.get('pointerdown')
      const pointerupHandler = jumpBtnHandlers.get('pointerup')
      if (pointerdownHandler && pointerupHandler) {
        pointerdownHandler()
        pointerupHandler()
        expect(gamepad.getJump()).toBe(false)
      }
    })

    it('should set isJump false on pointerout', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = jumpBtnHandlers.get('pointerdown')
      const pointeroutHandler = jumpBtnHandlers.get('pointerout')
      if (pointerdownHandler && pointeroutHandler) {
        pointerdownHandler()
        pointeroutHandler()
        expect(gamepad.getJump()).toBe(false)
      }
    })

    it('should set isJump true on pointerover when pointer is down (without jumpJustPressed)', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointeroverHandler = jumpBtnHandlers.get('pointerover')
      if (pointeroverHandler) {
        pointeroverHandler({ isDown: true })
        expect(gamepad.getJump()).toBe(true)
        // Sliding in doesn't trigger jumpJustPressed
        expect(gamepad.getJumpJustPressed()).toBe(false)
      }
    })
  })

  describe('button interaction - shoot button', () => {
    let shootBtnHandlers: Map<string, Function>

    beforeEach(() => {
      shootBtnHandlers = new Map()
      let callCount = 0
      mockScene.add.container = vi.fn(() => {
        callCount++
        const handlers = callCount === 4 ? shootBtnHandlers : new Map()
        return {
          ...mockContainer,
          on: vi.fn((event: string, handler: Function) => {
            handlers.set(event, handler)
            return mockContainer
          })
        }
      })
    })

    it('should set isShoot true on pointerdown', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = shootBtnHandlers.get('pointerdown')
      if (pointerdownHandler) {
        pointerdownHandler()
        expect(gamepad.getShoot()).toBe(true)
      }
    })

    it('should set isShoot false on pointerup', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = shootBtnHandlers.get('pointerdown')
      const pointerupHandler = shootBtnHandlers.get('pointerup')
      if (pointerdownHandler && pointerupHandler) {
        pointerdownHandler()
        pointerupHandler()
        expect(gamepad.getShoot()).toBe(false)
      }
    })

    it('should set isShoot false on pointerout', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = shootBtnHandlers.get('pointerdown')
      const pointeroutHandler = shootBtnHandlers.get('pointerout')
      if (pointerdownHandler && pointeroutHandler) {
        pointerdownHandler()
        pointeroutHandler()
        expect(gamepad.getShoot()).toBe(false)
      }
    })

    it('should set isShoot true on pointerover when pointer is down', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointeroverHandler = shootBtnHandlers.get('pointerover')
      if (pointeroverHandler) {
        pointeroverHandler({ isDown: true })
        expect(gamepad.getShoot()).toBe(true)
      }
    })
  })

  describe('setVisible', () => {
    let allContainers: any[]

    beforeEach(() => {
      allContainers = []
      mockScene.add.container = vi.fn(() => {
        const container = {
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn(),
          setSize: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis()
        }
        allContainers.push(container)
        return container
      })
    })

    it('should set visibility on all buttons', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      gamepad.setVisible(false)
      
      allContainers.forEach(container => {
        expect(container.setVisible).toHaveBeenCalledWith(false)
      })
    })

    it('should show all buttons when visible is true', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      gamepad.setVisible(true)
      
      allContainers.forEach(container => {
        expect(container.setVisible).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('resize', () => {
    let allContainers: any[]

    beforeEach(() => {
      allContainers = []
      mockScene.add.container = vi.fn(() => {
        const container = {
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn(),
          setSize: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis()
        }
        allContainers.push(container)
        return container
      })
    })

    it('should reposition all buttons on resize', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      // Change scene dimensions
      mockScene.scale.width = 1920
      mockScene.scale.height = 1080
      
      gamepad.resize()
      
      // All 4 containers should have setPosition called
      allContainers.forEach(container => {
        expect(container.setPosition).toHaveBeenCalled()
      })
    })

    it('should calculate correct positions for left button', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      mockScene.scale.width = 1920
      mockScene.scale.height = 1080
      
      gamepad.resize()
      
      // Left button: dpadX - 60 = 150 - 60 = 90, dpadY = height - 150 = 930
      const leftContainer = allContainers[0]
      expect(leftContainer.setPosition).toHaveBeenCalledWith(90, 930)
    })

    it('should calculate correct positions for right button', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      mockScene.scale.width = 1920
      mockScene.scale.height = 1080
      
      gamepad.resize()
      
      // Right button: dpadX + 60 = 150 + 60 = 210, dpadY = 930
      const rightContainer = allContainers[1]
      expect(rightContainer.setPosition).toHaveBeenCalledWith(210, 930)
    })

    it('should calculate correct positions for jump button', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      mockScene.scale.width = 1920
      mockScene.scale.height = 1080
      
      gamepad.resize()
      
      // Jump button: actionX = width - 150 = 1770, actionY + 60 = 930 + 60 = 990
      const jumpContainer = allContainers[2]
      expect(jumpContainer.setPosition).toHaveBeenCalledWith(1770, 990)
    })

    it('should calculate correct positions for shoot button', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      mockScene.scale.width = 1920
      mockScene.scale.height = 1080
      
      gamepad.resize()
      
      // Shoot button: actionX + 80 = 1770 + 80 = 1850, actionY - 20 = 930 - 20 = 910
      const shootContainer = allContainers[3]
      expect(shootContainer.setPosition).toHaveBeenCalledWith(1850, 910)
    })
  })

  describe('button layout', () => {
    it('should create left button with correct parameters', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      
      // Left button at (dpadX - 60, dpadY) = (90, 570)
      expect(mockScene.add.container).toHaveBeenCalledWith(90, 570)
    })

    it('should create buttons with correct colors', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      
      // Check circle calls for different colors
      // Left/Right: 0x888888, Jump: 0x00aa00, Shoot: 0xaa0000
      expect(mockScene.add.circle).toHaveBeenCalledWith(0, 0, 35, 0x888888, 0.5)
      expect(mockScene.add.circle).toHaveBeenCalledWith(0, 0, 55, 0x00aa00, 0.5)
      expect(mockScene.add.circle).toHaveBeenCalledWith(0, 0, 55, 0xaa0000, 0.5)
    })

    it('should create text labels with correct content', async () => {
      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      new VirtualGamepad(mockScene)
      
      expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '◀', expect.any(Object))
      expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '▶', expect.any(Object))
      expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, 'JUMP', expect.any(Object))
      expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, 'SHOOT', expect.any(Object))
    })
  })

  describe('edge cases', () => {
    it('should handle multiple consecutive pointer events', async () => {
      let leftBtnHandlers = new Map<string, Function>()
      let callCount = 0
      mockScene.add.container = vi.fn(() => {
        callCount++
        return {
          ...mockContainer,
          on: vi.fn((event: string, handler: Function) => {
            if (callCount === 1) {
              leftBtnHandlers.set(event, handler)
            }
            return mockContainer
          })
        }
      })

      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const pointerdownHandler = leftBtnHandlers.get('pointerdown')
      const pointerupHandler = leftBtnHandlers.get('pointerup')
      
      if (pointerdownHandler && pointerupHandler) {
        // Rapid press/release sequence
        pointerdownHandler()
        expect(gamepad.getLeft()).toBe(true)
        pointerupHandler()
        expect(gamepad.getLeft()).toBe(false)
        pointerdownHandler()
        expect(gamepad.getLeft()).toBe(true)
        pointerdownHandler() // Double press
        expect(gamepad.getLeft()).toBe(true)
        pointerupHandler()
        expect(gamepad.getLeft()).toBe(false)
      }
    })

    it('should handle pointer sliding between buttons', async () => {
      let leftBtnHandlers = new Map<string, Function>()
      let rightBtnHandlers = new Map<string, Function>()
      let callCount = 0
      mockScene.add.container = vi.fn(() => {
        callCount++
        return {
          ...mockContainer,
          on: vi.fn((event: string, handler: Function) => {
            if (callCount === 1) {
              leftBtnHandlers.set(event, handler)
            } else if (callCount === 2) {
              rightBtnHandlers.set(event, handler)
            }
            return mockContainer
          })
        }
      })

      const { VirtualGamepad } = await import('../utils/VirtualGamepad')
      const gamepad = new VirtualGamepad(mockScene)
      
      const leftDown = leftBtnHandlers.get('pointerdown')
      const leftOut = leftBtnHandlers.get('pointerout')
      const rightOver = rightBtnHandlers.get('pointerover')
      
      if (leftDown && leftOut && rightOver) {
        // Start on left, slide to right
        leftDown()
        expect(gamepad.getLeft()).toBe(true)
        expect(gamepad.getRight()).toBe(false)
        
        leftOut()
        rightOver({ isDown: true })
        
        expect(gamepad.getLeft()).toBe(false)
        expect(gamepad.getRight()).toBe(true)
      }
    })
  })
})
