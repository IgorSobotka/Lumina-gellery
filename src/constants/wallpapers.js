export const WALLPAPERS = {
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    background: `
      radial-gradient(ellipse 80% 60% at 15% 40%,  rgba(148,56,220,0.72) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 85% 15%,  rgba(255,90,50,0.55)  0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 70% 85%,  rgba(0,200,180,0.52)  0%, transparent 55%),
      radial-gradient(ellipse 40% 40% at 40% 75%,  rgba(30,120,255,0.42) 0%, transparent 50%),
      radial-gradient(ellipse 70% 40% at 90% 60%,  rgba(255,200,0,0.28)  0%, transparent 50%),
      linear-gradient(160deg, #0d0820 0%, #0a1628 40%, #0f1220 100%)
    `,
    preview: [
      'rgba(148,56,220,0.9)',
      'rgba(255,90,50,0.8)',
      'rgba(0,200,180,0.8)',
      'rgba(30,120,255,0.7)',
    ],
  },

  midnight: {
    id: 'midnight',
    label: 'Midnight',
    background: `
      radial-gradient(ellipse 70% 60% at 20% 30%,  rgba(30,60,220,0.65)  0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 80% 70%,  rgba(0,120,255,0.50)  0%, transparent 55%),
      radial-gradient(ellipse 60% 40% at 60% 20%,  rgba(80,0,200,0.40)   0%, transparent 50%),
      radial-gradient(ellipse 40% 60% at 10% 80%,  rgba(0,180,255,0.30)  0%, transparent 50%),
      linear-gradient(150deg, #020818 0%, #040d20 50%, #020612 100%)
    `,
    preview: [
      'rgba(30,60,220,0.9)',
      'rgba(0,120,255,0.9)',
      'rgba(80,0,200,0.7)',
      'rgba(0,180,255,0.6)',
    ],
  },

  forest: {
    id: 'forest',
    label: 'Forest',
    background: `
      radial-gradient(ellipse 70% 60% at 10% 60%,  rgba(0,140,80,0.70)   0%, transparent 60%),
      radial-gradient(ellipse 55% 50% at 80% 20%,  rgba(0,200,140,0.55)  0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 55% 85%,  rgba(20,180,100,0.45) 0%, transparent 55%),
      radial-gradient(ellipse 40% 40% at 85% 65%,  rgba(0,100,120,0.40)  0%, transparent 50%),
      linear-gradient(150deg, #020e08 0%, #041408 50%, #020c0a 100%)
    `,
    preview: [
      'rgba(0,140,80,0.9)',
      'rgba(0,200,140,0.85)',
      'rgba(20,180,100,0.7)',
      'rgba(0,100,120,0.7)',
    ],
  },

  sunset: {
    id: 'sunset',
    label: 'Sunset',
    background: `
      radial-gradient(ellipse 75% 55% at 20% 35%,  rgba(255,60,120,0.70)  0%, transparent 60%),
      radial-gradient(ellipse 60% 55% at 80% 20%,  rgba(255,140,0,0.65)   0%, transparent 55%),
      radial-gradient(ellipse 55% 55% at 65% 80%,  rgba(200,0,120,0.50)   0%, transparent 55%),
      radial-gradient(ellipse 45% 45% at 90% 60%,  rgba(255,80,0,0.40)    0%, transparent 50%),
      linear-gradient(150deg, #120208 0%, #1a0610 50%, #120408 100%)
    `,
    preview: [
      'rgba(255,60,120,0.9)',
      'rgba(255,140,0,0.9)',
      'rgba(200,0,120,0.75)',
      'rgba(255,80,0,0.7)',
    ],
  },

  obsidian: {
    id: 'obsidian',
    label: 'Obsidian',
    background: `
      radial-gradient(ellipse 60% 50% at 25% 40%,  rgba(60,60,80,0.50)   0%, transparent 60%),
      radial-gradient(ellipse 50% 45% at 75% 65%,  rgba(40,40,60,0.40)   0%, transparent 55%),
      radial-gradient(ellipse 70% 40% at 50% 10%,  rgba(80,80,100,0.30)  0%, transparent 50%),
      linear-gradient(150deg, #090909 0%, #0e0e12 50%, #080808 100%)
    `,
    preview: [
      'rgba(80,80,100,0.8)',
      'rgba(60,60,80,0.7)',
      'rgba(40,40,60,0.6)',
      'rgba(30,30,40,0.5)',
    ],
  },

  nebula: {
    id: 'nebula',
    label: 'Nebula',
    background: `
      radial-gradient(ellipse 65% 55% at 15% 50%,  rgba(200,0,255,0.65)  0%, transparent 60%),
      radial-gradient(ellipse 55% 50% at 85% 20%,  rgba(0,220,255,0.60)  0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 60% 85%,  rgba(120,0,220,0.50)  0%, transparent 55%),
      radial-gradient(ellipse 45% 40% at 80% 70%,  rgba(0,180,200,0.40)  0%, transparent 50%),
      radial-gradient(ellipse 35% 35% at 40% 30%,  rgba(255,0,180,0.35)  0%, transparent 45%),
      linear-gradient(150deg, #080010 0%, #0a0818 50%, #050010 100%)
    `,
    preview: [
      'rgba(200,0,255,0.9)',
      'rgba(0,220,255,0.85)',
      'rgba(120,0,220,0.75)',
      'rgba(255,0,180,0.65)',
    ],
  },
}

export const DEFAULT_WALLPAPER = 'aurora'
