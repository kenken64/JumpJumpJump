import Phaser from 'phaser'
import GameScene from './GameScene'
import { DQNAgent, type DQNState } from '../utils/DQNAgent'

/**
 * DQN Training Scene - Trains the AI agent to play JumpJumpJump
 */
export default class DQNTrainingScene extends Phaser.Scene {
    private gameScene!: GameScene
    private dqnAgent!: DQNAgent
    private isTraining = false
    private isPaused = false
    private autoRestart = true
    private trainingSpeed = 1
    private episode = 0
    private currentStep = 0
    private lastAction = 0
    private lastState: DQNState | null = null

    private statsText!: Phaser.GameObjects.Text
    private episodeText!: Phaser.GameObjects.Text
    private rewardChart!: Phaser.GameObjects.Graphics
    private rewardHistory: number[] = []

    private readonly chartX = 50
    private readonly chartY = 440
    private readonly chartWidth = 600
    private readonly chartHeight = 120

    constructor() {
        super('DQNTrainingScene')
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e')

        this.add.text(640, 30, '🤖 DQN AI Training', {
            fontSize: '32px', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5)

        this.add.text(1200, 20, [
            'Controls:', '[SPACE] Start/Pause', '[R] Reset', '[S] Save Model',
            '[L] Load Model', '[1-5] Speed', '[A] Auto-Restart', '[ESC] Menu'
        ].join('\n'), {
            fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 8, y: 6 }
        }).setOrigin(1, 0)

        this.statsText = this.add.text(50, 80, '', {
            fontSize: '15px', color: '#00ff88', fontStyle: 'bold', lineSpacing: 6
        })

        this.episodeText = this.add.text(680, 80, '', {
            fontSize: '15px', color: '#ffaa00', fontStyle: 'bold', lineSpacing: 6
        })

        this.rewardChart = this.add.graphics()
        this.drawChartBackground()

        this.setupControls()
        this.startGameScene()

        this.time.delayedCall(500, () => {
            if (this.gameScene) {
                this.dqnAgent = new DQNAgent(this.gameScene)
                this.dqnAgent.loadModel().then(loaded => {
                    this.showNotification(loaded ? 'Model loaded! 🎉' : 'Fresh model. Press SPACE!')
                })
            }
        })

        this.events.on('update', this.updateUI, this)
        this.showNotification('⚡ Press SPACE to start training!', 5000)
        this.scene.bringToTop()
    }

    private setupControls() {
        const kb = this.input.keyboard
        if (!kb) {
            console.warn('Keyboard not available')
            return
        }

        // ESC to go back to menu - add as key object for reliable detection
        const escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        escKey.on('down', () => this.backToMenu())

        kb.on('keydown-SPACE', () => {
            this.isTraining ? this.pauseTraining() : this.startTraining()
        })
        kb.on('keydown-R', () => this.resetEpisode())
        kb.on('keydown-S', () => {
            this.dqnAgent?.saveModel()
            this.showNotification('Saved! 💾')
        })
        kb.on('keydown-L', () => {
            this.dqnAgent?.loadModel()
            this.showNotification('Loaded! 📂')
        })
        for (let i = 1; i <= 5; i++) {
            kb.on(`keydown-${i}`, () => {
                this.trainingSpeed = i
                this.showNotification(`Speed: ${i}x`)
            })
        }
        kb.on('keydown-A', () => {
            this.autoRestart = !this.autoRestart
            this.showNotification(`Auto-restart: ${this.autoRestart ? 'ON' : 'OFF'}`)
        })
        // Note: ESC key is handled above with addKey for reliable detection
    }

    private startGameScene() {
        if (this.scene.isActive('GameScene')) this.scene.stop('GameScene')
        this.scene.launch('GameScene', { mode: 'endless', level: 1, aiMode: true })
        this.time.delayedCall(200, () => {
            this.gameScene = this.scene.get('GameScene') as GameScene
        })
    }

    private startTraining() {
        if (!this.dqnAgent) {
            this.showNotification('⚠️ Agent not ready!')
            return
        }
        this.isTraining = true
        this.isPaused = false
        this.episode++
        this.currentStep = 0
        this.dqnAgent.resetEpisode()
        if (!this.scene.isActive('GameScene')) this.startGameScene()
    }

    private pauseTraining() {
        this.isTraining = false
        this.isPaused = true
        this.showNotification('Paused')
    }

    private resetEpisode() {
        this.currentStep = 0
        this.dqnAgent?.resetEpisode()
        this.lastState = null
        if (this.scene.isActive('GameScene')) this.scene.stop('GameScene')
        this.time.delayedCall(100, () => {
            this.scene.launch('GameScene', { mode: 'endless', level: 1, aiMode: true })
            this.time.delayedCall(200, () => {
                this.gameScene = this.scene.get('GameScene') as GameScene
            })
        })
        if (this.isTraining) this.episode++
    }

    update() {
        if (!this.isTraining || this.isPaused || !this.gameScene) return
        for (let i = 0; i < this.trainingSpeed; i++) {
            this.trainingStep()
        }
    }

    private async trainingStep() {
        try {
            const currentState = this.captureGameState()
            if (!currentState) return

            const action = await this.dqnAgent.selectAction(currentState)
            this.applyAction(action)

            const isDead = (this.gameScene as any).playerIsDead
            const score = (this.gameScene as any).score
            const reward = this.dqnAgent.calculateReward(currentState, isDead, score, action.actionIndex)

            if (this.lastState) {
                this.dqnAgent.remember(this.lastState, this.lastAction, reward, currentState, isDead)
            }

            await this.dqnAgent.train()

            if (isDead) {
                const stats = this.dqnAgent.getStats()
                this.rewardHistory.push(stats.totalReward)
                if (this.rewardHistory.length > 100) this.rewardHistory.shift()

                if (this.autoRestart) {
                    this.time.delayedCall(500, () => this.resetEpisode())
                } else {
                    this.pauseTraining()
                }
            }

            this.lastState = currentState
            this.lastAction = action.actionIndex
            this.currentStep++
        } catch (error) {
            console.error('Training error:', error)
            this.pauseTraining()
        }
    }

    private captureGameState(): DQNState | null {
        try {
            const player = (this.gameScene as any).player
            if (!player?.body) return null

            const body = player.body as Phaser.Physics.Arcade.Body
            const platforms = (this.gameScene as any).platforms
            const enemies = (this.gameScene as any).enemies
            const spikes = (this.gameScene as any).spikes

            let nearestPlatformDistance = 1000
            let nearestPlatformHeight = 0
            let nearestEnemyDistance = 1000
            let nearestSpikeDistance = 1000

            if (platforms) {
                for (const p of platforms.getChildren()) {
                    if (!(p as any).active) continue
                    const dist = Phaser.Math.Distance.Between(player.x, player.y, (p as any).x, (p as any).y)
                    if (dist < nearestPlatformDistance) {
                        nearestPlatformDistance = dist
                        nearestPlatformHeight = (p as any).y - player.y
                    }
                }
            }

            if (enemies) {
                for (const e of enemies.getChildren()) {
                    if (!(e as any).active) continue
                    const dist = Phaser.Math.Distance.Between(player.x, player.y, (e as any).x, (e as any).y)
                    if (dist < nearestEnemyDistance) nearestEnemyDistance = dist
                }
            }

            if (spikes) {
                for (const s of spikes.getChildren()) {
                    if (!(s as any).active) continue
                    const dist = Phaser.Math.Distance.Between(player.x, player.y, (s as any).x, (s as any).y)
                    if (dist < nearestSpikeDistance) nearestSpikeDistance = dist
                }
            }

            const hasGroundAhead = this.checkGroundAhead(platforms, player.x + 100, player.y)
            const gapAhead = !this.checkGroundAhead(platforms, player.x + 150, player.y)

            return {
                playerX: player.x, playerY: player.y,
                velocityX: body.velocity.x, velocityY: body.velocity.y,
                onGround: body.touching.down,
                nearestPlatformDistance, nearestPlatformHeight,
                nearestEnemyDistance, nearestSpikeDistance,
                hasGroundAhead, gapAhead,
                bossActive: false,  // DQNTrainingScene doesn't have bosses
                bossDistance: 1000,
                bossHealth: 100
            }
        } catch {
            return null
        }
    }

    private checkGroundAhead(platforms: any, x: number, y: number): boolean {
        if (!platforms) return false
        const checkY = y + 100
        for (const p of platforms.getChildren()) {
            if (!(p as any).active) continue
            const bounds = (p as any).getBounds()
            if (x >= bounds.left && x <= bounds.right && checkY >= bounds.top && checkY <= bounds.bottom + 50) {
                return true
            }
        }
        return false
    }

    private applyAction(action: any) {
        if ((this.gameScene as any).setAIAction) {
            (this.gameScene as any).setAIAction(action)
        }
    }

    private updateUI() {
        if (!this.dqnAgent) return
        const stats = this.dqnAgent.getStats()

        this.statsText.setText([
            '📊 Training Statistics:',
            `Epsilon: ${stats.epsilon.toFixed(4)}`,
            `Buffer: ${stats.bufferSize} / ${stats.bufferSize >= 100 ? '✓' : '...'}`,
            `Training Steps: ${stats.trainingSteps}`,
            `Episodes: ${stats.episodes}`,
            `Avg Reward: ${stats.averageReward.toFixed(2)}`
        ])

        const status = this.isTraining ? '🟢 TRAINING' : (this.isPaused ? '🟡 PAUSED' : '🔴 STOPPED')
        this.episodeText.setText([
            `Status: ${status}`,
            `Episode: ${this.episode}`,
            `Step: ${this.currentStep}`,
            `Speed: ${this.trainingSpeed}x`,
            `Auto-Restart: ${this.autoRestart ? 'ON' : 'OFF'}`,
            `Current Reward: ${stats.totalReward.toFixed(2)}`,
            `Last Reward: ${stats.lastReward.toFixed(2)}`
        ])

        this.updateRewardChart()
    }

    private drawChartBackground() {
        this.rewardChart.clear()
        this.rewardChart.fillStyle(0x000000, 0.7)
        this.rewardChart.fillRect(this.chartX, this.chartY, this.chartWidth, this.chartHeight)
        this.rewardChart.lineStyle(2, 0x00ff88, 1)
        this.rewardChart.strokeRect(this.chartX, this.chartY, this.chartWidth, this.chartHeight)
        this.add.text(this.chartX + this.chartWidth / 2, this.chartY - 20, 'Reward History (Last 100 Episodes)', {
            fontSize: '14px', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5)
    }

    private updateRewardChart() {
        if (this.rewardHistory.length === 0) return
        this.rewardChart.clear()
        this.drawChartBackground()

        const maxReward = Math.max(...this.rewardHistory, 10)
        const minReward = Math.min(...this.rewardHistory, -10)
        const range = maxReward - minReward

        this.rewardChart.lineStyle(2, 0x00ff88, 1)
        this.rewardChart.beginPath()

        for (let i = 0; i < this.rewardHistory.length; i++) {
            const x = this.chartX + (i / Math.max(this.rewardHistory.length - 1, 1)) * this.chartWidth
            const normalizedReward = (this.rewardHistory[i] - minReward) / (range || 1)
            const y = this.chartY + this.chartHeight - normalizedReward * this.chartHeight
            if (i === 0) this.rewardChart.moveTo(x, y)
            else this.rewardChart.lineTo(x, y)
        }
        this.rewardChart.strokePath()
    }

    private showNotification(message: string, duration = 2000) {
        const notification = this.add.text(640, 680, message, {
            fontSize: '18px', color: '#00ff88', backgroundColor: '#000000',
            padding: { x: 20, y: 10 }, fontStyle: 'bold'
        }).setOrigin(0.5)

        this.tweens.add({
            targets: notification,
            alpha: 0,
            y: 650,
            duration,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        })
    }

    private backToMenu() {
        this.isTraining = false
        this.scene.stop('GameScene')
        this.dqnAgent?.dispose()
        this.scene.start('MenuScene')
    }
}
