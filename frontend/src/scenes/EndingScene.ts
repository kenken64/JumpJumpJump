import Phaser from 'phaser'
import { GameAPI } from '../services/api'

export default class EndingScene extends Phaser.Scene {
  private storyText!: Phaser.GameObjects.Text
  private scrollSpeed: number = 0.15 // Reduced speed for dramatic effect

  constructor() {
    super('EndingScene')
  }

  preload() {
    this.load.audio('endingMusic', '/assets/music/ending.mp3')
  }

  create() {
    const { width, height } = this.cameras.main

    // Stop game music and play ending music
    this.sound.stopAll()
    this.sound.play('endingMusic', { loop: true, volume: 0.5 })

    // Background (Blackhole effect or just black)
    this.cameras.main.setBackgroundColor('#000000')
    this.createStarfield()

    const storyContent = `
They Came From the Dark Between Stars

The first ships arrived without warning.
Massive obsidian pyramids descended through Earth's atmosphere and hovered over seven major cities. No communication. No demands. No explanation.
Then the abductions began.

The Chosen
They didn't take the weak. They didn't take the elderly or the sick or the young.
They took warriors.
Special forces operatives vanished from military bases. Champion fighters disappeared from arenas. Survivalists were plucked from remote wilderness. Anyone who had proven themselves dangerous—anyone who had killed and survived—woke up in the same place.
An infinite arena of floating platforms, suspended over an abyss that had no bottom.
The Hunting Grounds.

The Awakening
You remember the light first.
A blue pulse that cut through your bedroom wall, your barracks, your cabin in the mountains—wherever they found you. Then weightlessness. Then nothing.
Now you stand on cold metal, wind howling from somewhere impossibly far below. The platform beneath your feet stretches maybe twenty meters before ending in void. Another platform floats ahead. Then another. An endless corridor of jumping stones arranged across seven vertical planes, disappearing into mist and distance.
Your weapons are gone. Your team is gone. Your world is gone.
But you are not alone.

The Watchers
They observe from obsidian towers that rise between the platforms like black teeth. Tall. Silent. Their faces hidden behind biomechanical masks that click and whir with alien calculation.
You never see them clearly. Just shapes in the peripheral darkness. The glint of targeting lasers. The shimmer of cloaking fields engaging and disengaging.
They are studying you.
Evaluating you.
And somewhere in their ancient hierarchy, they are betting on you.

The Game
You learn the rules through death.
The platforms generate as you move—solid blocks, thin ledges, surfaces that crumble seconds after you touch them. Stand still, and the ground beneath you dissolves. The only way to survive is forward.
Always forward.
Creatures materialize from the void. Some skitter on too many legs. Some lumber with armored hides. Some fly on wings that shouldn't exist in any atmosphere. They are not from Earth. They are trophies from other conquered worlds, released into the arena to test you.
Kill them, and golden markers appear—data fragments the Watchers use as currency. Collect enough, and hidden terminals flicker to life, offering weapons: pulse guns, thermal lances, plasma blades. Tools scavenged from a hundred dead civilizations.
The Watchers want you armed.
They want you dangerous.
Prey that cannot fight back is prey not worth hunting.

The Leaderboard
A holographic display burns in the sky above every platform cluster. Names. Numbers. Rankings.
At first, you don't understand. Then you see your own name appear at the bottom, a score of zero beside it.
Every meter you travel adds points. Every creature you kill adds more. Every fragment you collect, every weapon you claim, every second you refuse to die—it all counts.
The Watchers are keeping score.
And the highest names on that board? They haven't been seen in weeks. Months. Some say they ascended to the deeper levels, where the platforms grow sparse and the gravity shifts without warning.
Some say they were deemed worthy of the real hunt.

The Notorious Ones
Every fifth level, the arena changes.
The platforms stop generating. The lesser creatures retreat. The wind dies. And from the darkness above, one of them descends.
Not a Watcher.
Something worse.
A hunter.
Twenty-four elite killers rotate through the arena, each one a legend among their kind. They have names that translate roughly into human language—names earned through millennia of slaughter:
The one who tears dimensions.
The one who drinks light.
The one who burns worlds.
They are larger than the Watchers. Faster. Their armor has been forged from the bones of apex predators across the galaxy. Their weapons have ended species.
They do not hide.
They announce themselves with roars that shake the platforms, then they hunt you across the arena until one of you stops moving.
Kill one, and your name rockets up the leaderboard. The Watchers howl with something that might be approval. More weapons appear. Better weapons. The next stretch of platforms becomes almost generous.
You have proven yourself entertaining.
Die to one, and you are nothing. A footnote. A skull added to a trophy wall that stretches across light-years.

The Lie They Tell You
"Reach the end," the survivors whisper. "Kill all twenty-four. There's a way out. A portal. A ship. Something."
You've heard the rumors in the brief moments between levels, when the platforms stabilize and humans can find each other. They speak of a final boss—a twenty-fifth hunter who guards the exit. They speak of Earth, still spinning somewhere beyond the void.
They speak of escape.
But you've also seen the leaderboard.
The top ten names have been static for months. No one rises to first place. No one claims the final victory. Either they are still fighting somewhere in the deep levels, or the "escape" is just another game the Watchers play.
Hope as entertainment.
Despair as sport.

What You Know
You know the platforms will keep generating as long as you keep moving.
You know the creatures will keep coming, worth more points the deeper you go.
You know the fragments can buy you speed, shields, second chances.
You know twenty-four nightmares stand between you and whatever lies at the end.
And you know one thing the Watchers haven't figured out yet:
Humans don't break.
We adapt. We learn. We turn the rules against the rulemakers. Every warrior they abducted carries generations of combat evolution in their blood. Every survivor on these platforms is someone who has already looked death in the face and refused.
The Watchers wanted dangerous prey.
They're about to learn what that really means.

Your Hunt Begins
The platform hums beneath your boots.
Ahead, the first creature materializes—something with too many eyes and a hunger older than your species. The leaderboard flickers, waiting for your name to rise.
Somewhere in the darkness, a Watcher leans forward to observe.
Somewhere deeper, the first of the Notorious Ones sharpens a blade that has tasted the blood of a thousand worlds.
They think you are prey.
Prove them wrong.
`

    this.storyText = this.add.text(width / 2, height + 50, storyContent, {
      fontSize: '32px',
      fontFamily: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif',
      color: '#FFE81F', // Star Wars Yellow
      align: 'justify',
      fontStyle: 'bold',
      wordWrap: { width: width * 0.6 } // Narrower column
    })
    this.storyText.setOrigin(0.5, 0)
    this.storyText.setStroke('#000000', 4)
    this.storyText.setShadow(2, 2, '#000000', 2, true, true)

    // Skip button
    const skipBtn = this.add.text(width - 100, height - 50, 'SKIP [ESC]', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(1, 1).setInteractive()

    skipBtn.on('pointerdown', () => {
      this.returnToMenu()
    })
    this.input.keyboard?.on('keydown-ESC', () => {
      this.returnToMenu()
    })
  }

  update(_time: number, delta: number) {
    this.storyText.y -= (this.scrollSpeed * delta) / 16

    // Reset or end when text goes off screen
    if (this.storyText.y + this.storyText.height < 0) {
      this.returnToMenu()
    }
  }

  private async returnToMenu() {
    this.sound.stopAll()
    
    // Delete save game so user starts fresh
    const playerName = localStorage.getItem('player_name')
    if (playerName) {
      try {
        await GameAPI.deleteSave(playerName)
        console.log('Save game deleted for', playerName)

        // Clear defeated bosses locally
        localStorage.removeItem('defeatedBossLevels')
        for (let i = 0; i < 24; i++) {
          localStorage.removeItem(`${playerName}_boss_${i}`)
        }
        console.log('Cleared local boss records for', playerName)
      } catch (error) {
        console.error('Failed to delete save game:', error)
      }
    }
    
    this.scene.start('MenuScene')
  }

  private createStarfield() {
     // Simple starfield
     for (let i = 0; i < 200; i++) {
        const x = Phaser.Math.Between(0, 1280)
        const y = Phaser.Math.Between(0, 720)
        const size = Phaser.Math.FloatBetween(0.5, 2)
        this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.2, 1))
     }
  }
}
