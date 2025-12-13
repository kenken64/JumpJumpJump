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
    this.load.image('planetEarth', '/assets/kenny_planets/Planets/planet09.png')
    this.load.image('spaceship', '/assets/kenney_sci-fi-rts/PNG/Default size/Unit/scifiUnit_06.png')
    this.load.image('particle', '/assets/kenney_platformer-art-requests/Tiles/laserRedBurst.png') // Use existing burst asset for particles
  }

  create() {
    const { width, height } = this.cameras.main

    // Stop game music and play ending music
    this.sound.stopAll()
    this.sound.play('endingMusic', { loop: true, volume: 0.5 })

    // Background (Blackhole effect or just black)
    this.cameras.main.setBackgroundColor('#000000')
    this.createStarfield()
    
    // Create the crash animation behind the text
    this.createCrashAnimation()

    const storyContent = `
The Chrysalis Protocol

The last thing Dr. Maya Chen remembered before everything went wrong was her hand slamming the eject button. Her ship had been dying around her, alarms screaming, the hull breaching in three places, and then—nothing. Just darkness and the sensation of falling forever.

When she woke up, she knew immediately something was off. Her hands looked wrong. Three thick fingers instead of five, skin that glowed faintly blue in the darkness like some deep-sea creature. She tried to scream but the sound that came out was layered, harmonic, inhuman. The kind of sound that shouldn't come from a human throat.

Because she wasn't human anymore.

The emergency pod had buried itself deep in Kepler-442b's surface, which wasn't rock or dirt but something that felt almost organic, warm and pulsing. And the planet's atmosphere hadn't killed her—it had done something much worse. It had changed her on a molecular level.

The pod's damaged AI crackled to life, making her jump. "Xenomorphic contamination detected. Cellular structure compromised. Reversal requires Synthesis Formula. Location: planetary core."

"Of course it is," Maya muttered, her voice still wrong, still multi-toned.

She pulled herself out of the wreckage, and her new body moved differently—stronger, faster, but foreign. The planet stretched out before her in impossible colors. Crystalline trees that seemed to breathe in rhythm, rivers that ran uphill defying gravity, everything slightly alive in a way that made her stomach turn. Well, whatever organs she had now that passed for a stomach.

She'd walked maybe a mile, still getting used to legs that bent at slightly wrong angles, when the first guardian appeared. The thing was massive, easily thirty feet tall, translucent like a jellyfish but vaguely humanoid. Inside its body, organs floated suspended in fluid, pulsing with light. She'd later think of it as the Membrane Colossus, but right then she just thought: I'm going to die on this planet as something that isn't even me.

It attacked without warning. A limb that phased between solid and liquid struck at her. Maya dove behind a crystal formation, her heart—hearts?—racing. She felt something building in her hands, energy crackling between her fingers. It was instinct, this new body knowing things her mind didn't.

Desperate, she released it. An electromagnetic blast erupted from her palms, hitting the creature. Suddenly it was solid, completely physical, vulnerable. Maya didn't think. She just ran forward, roaring, and drove her fist into the glowing core in its chest.

The creature exploded into crystalline fragments. In the debris, a strand of DNA glowed, hovering in the air. When she touched it, information flooded her mind—genetic code, part of something larger. Part of the formula to change her back.

One piece down. How many more?

The journey took her deeper into the planet's strange anatomy. She learned to hunt, to fight, to survive with this body she hadn't asked for. The Breathing Caverns were worse than the surface—walls that literally inhaled and exhaled, making the space expand and contract like being inside massive lungs. The air was thick, humid, wrong.

The Parasite Sovereign wasn't one creature but thousands—a swarm intelligence that moved like a living shadow. They covered her in seconds, tiny bodies trying to absorb her into their collective consciousness. Maya felt them probing her mind, trying to make her part of the hive.

But her mutated cells were toxic to them. She'd never know if it was luck or design, but when she focused, she could broadcast on their frequency. She sent out signals—not their harmonious network chatter but something discordant, chaotic. The swarm turned on itself in confusion, thousands of small creatures suddenly fighting, consuming each other.

She grabbed the second genetic fragment from the carnage and kept moving, trying not to think about how natural it felt to kill with this body. How easy. How good.

By the time she reached the Resonance Plains, where gravity folded in on itself and up became sideways, Maya was changing in ways that had nothing to do with biology. She was starting to forget what coffee tasted like. Starting to lose the memory of her daughter Elena's exact voice.

The Echo Tyrant was waiting—a being that existed across multiple timelines simultaneously. It attacked from past, present, and future versions of itself at once. But her enhanced perception could track the temporal echoes like following threads in a tapestry. She watched, learned the pattern, and waited for the single moment when all its versions converged into one point in space-time.

She struck once. The Tyrant collapsed into a single timeline and vanished. The third fragment was hers.

The core chamber took her breath away—walls made of concentrated starlight, a pool in the center that looked like someone had liquefied a rainbow. Something rose from that pool. Not really a body, more like a presence, an intelligence so vast it made her feel microscopic.

"Why fight this?" it asked inside her head, the voice kind, almost sad. "You are stronger now. Faster. You could live for centuries. Why choose limitation?"

"Because limitation is what makes us human," Maya said, surprised at the certainty in her voice. "Because I have a daughter who needs her mother, not some immortal alien thing wearing her mother's memories."

It tested her then, not with violence but with visions. Futures where she stayed changed, became something powerful and eternal. She saw herself exploring galaxies, living through the heat death of stars, accumulating knowledge that would make her godlike.

Maya pushed back with smaller memories. Elena's face when she lost her first tooth. The smell of her lab on Monday mornings. Her dad teaching her to fish in the creek behind their house, his patience when she kept tangling the line. Stupid, small, perfectly human things that mattered more than immortality.

"I don't want perfect," she said quietly. "I just want to go home."

The presence seemed to consider this, a vast intelligence trying to understand human stubbornness. Then it retreated, almost respectfully. The three DNA fragments swirled together in the pool—pieces of her original self the planet had preserved like a backup.

Maya jumped in without hesitation.

The transformation back was excruciating. She felt her body tearing itself apart cell by cell and reforming, alien structures dying, human DNA reasserting dominance like reclaiming invaded territory. Her extra fingers dissolved, her chitinous armor softened back into skin, her multi-spectrum vision collapsed into normal human sight. When she finally crawled out, gasping and shaking, she was Maya Chen again.

Mostly.

The pod's beacon activated automatically, its pulse steady and strong. Rescue ships would come. Her ordeal was over.

Maya collapsed against the pod's hull, exhausted beyond measure. Her hands—five-fingered, calloused, human hands—were shaking. She touched her face, her arms, her chest, feeling the familiar architecture of her own body. Real. Solid. Hers.

But she could still see those flecks of blue in her reflection on the pod's metal surface. Her eyes glowed faintly in the dim light. And when she closed them, she could still perceive things no human should—faint electromagnetic fields, the subtle vibration of the planet's core beneath her.

The changes weren't completely gone. Maybe they never would be.

Above her, Kepler-442b's sky shifted through colors that had no names in any human language. Maya thought about Elena, probably convinced her mother was dead by now. She thought about her lab, her colleagues, her small apartment with the plants she'd probably killed by now from neglect.

She'd fought through hell to get back to all of that. To be ordinary again. To be human.

And sitting there, waiting for rescue, feeling her heart beat its familiar rhythm, Maya realized something. The planet hadn't just tested her strength. It had tested what she valued most—and she'd passed. She'd chosen limitation over power, mortality over eternity, home over the infinite.

That choice, she thought, was the most human thing of all.

The beacon pulsed. Help was coming.

Maya closed her eyes—those slightly-wrong, faintly-glowing eyes—and waited for the ship that would take her home.
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
    this.storyText.setDepth(10) // Ensure text is above planet animation

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

  private createCrashAnimation() {
    const { width, height } = this.cameras.main
    
    // 1. Planet (Earth-like)
    const planet = this.add.image(width * 0.7, height * 0.6, 'planetEarth')
    planet.setScale(0.5)
    planet.setDepth(1) // Behind text (text will be higher)
    
    // 2. Spaceship
    const ship = this.add.image(-100, height * 0.2, 'spaceship')
    ship.setScale(0.8)
    ship.setRotation(Phaser.Math.DegToRad(45)) // Angle towards planet
    ship.setDepth(2)
    
    // Engine trail particles
    const trailParticles = this.add.particles(0, 0, 'particle', {
      speed: 100,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      follow: ship,
      followOffset: { x: -20, y: -20 } // Adjust based on ship rotation
    })
    trailParticles.setDepth(1)

    // 3. Crash Sequence Function
    const playCrash = () => {
      // Reset ship position
      ship.setPosition(-100, height * 0.2)
      ship.setVisible(true)
      ship.setAlpha(1)
      trailParticles.start()
      
      // Calculate angle to planet
      const angle = Phaser.Math.Angle.Between(ship.x, ship.y, planet.x, planet.y)
      ship.setRotation(angle + Math.PI/2) // Adjust for sprite orientation

      // Tween ship to planet
      this.tweens.add({
        targets: ship,
        x: planet.x,
        y: planet.y,
        duration: 3000,
        ease: 'Power2', // Accelerate
        onUpdate: () => {
          // Add some shake/vibration
          ship.x += Phaser.Math.Between(-2, 2)
          ship.y += Phaser.Math.Between(-2, 2)
        },
        onComplete: () => {
          // Explosion!
          ship.setVisible(false)
          trailParticles.stop()
          
          // Explosion particles
          const explosion = this.add.particles(planet.x, planet.y, 'particle', {
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 800,
            quantity: 50,
            emitting: false
          })
          explosion.setDepth(3)
          explosion.explode(100)
          
          // Flash effect
          this.cameras.main.flash(200, 255, 200, 0)
          
          // Shake camera slightly
          this.cameras.main.shake(200, 0.005)
          
          // Loop animation after delay
          this.time.delayedCall(2000, () => {
             if (this.scene.isActive()) {
                 playCrash()
             }
          })
        }
      })
    }

    // Start initial animation
    playCrash()
  }

  private async returnToMenu() {
    this.sound.stopAll()
    
    // Clear local progression data immediately
    localStorage.removeItem('defeatedBossLevels')
    
    const playerName = localStorage.getItem('player_name')
    if (playerName) {
      // Clear player-specific boss records
      for (let i = 0; i < 24; i++) {
        localStorage.removeItem(`${playerName}_boss_${i}`)
      }

      try {
        await GameAPI.deleteSave(playerName)
        console.log('Save game deleted for', playerName)
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
