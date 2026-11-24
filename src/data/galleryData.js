// 画廊数据：10 张作品，按项目分组。色值来自 docs/palette.json（T02 脚本提取）
// 两档图片：大图（长边 ≤1800）与预览图（长边 640，先加载）。由 scripts/make-variants.py 生成
const fullImages = import.meta.glob('../../images/*.webp', { eager: true, import: 'default' })
const previewImages = import.meta.glob('../../images/preview/*.webp', { eager: true, import: 'default' })

function images(key) {
  const textureSrc = fullImages[`../../images/${key}.webp`]
  const previewSrc = previewImages[`../../images/preview/${key}.webp`]
  if (!textureSrc || !previewSrc) throw new Error(`Missing image for ${key}`)
  return { textureSrc, previewSrc }
}

// 项目信息（方案 B：显示在左侧，替换原色词）
const projects = {
  ring: {
    number: 1,
    title: 'Project Ring',
    intro: 'A visual study of bodies adrift: orbits, tethers and light tracing how we are bound to space.',
  },
  mortal: {
    number: 2,
    title: 'Mortal Song',
    intro: 'Walkways and a timber stage woven above a dense urban village, giving its nights a public voice again.',
  },
  whisper: {
    number: 3,
    title: 'Whisper of Earth',
    intro: 'Robotic fabrication grows bone-like lattices through ruined buildings, turning debris into shelter.',
  },
  heat: {
    number: 4,
    title: 'Inhabiting Heat',
    intro: 'LiDAR point clouds and thermal imaging remap the city to ask how we inhabit urban heat.',
  },
}

// 生成一条画廊记录；x 左右交错，形成景深中的错位感
function plane({ textureSrc, previewSrc }, project, x, palette, alt, aspect) {
  return {
    // 图片宽高比：贴图还没下载完时也能按正确比例占位
    aspect,
    fallbackColor: palette.accent,
    accentColor: palette.accent,
    textureSrc,
    previewSrc,
    position: { x, y: 0 },
    backgroundColor: palette.background,
    blob1Color: palette.blob1,
    blob2Color: palette.blob2,
    project,
    alt,
    label: {
      word: palette.word,
      pms: palette.pms,
      color: palette.labelColor,
    },
  }
}

const galleryPlaneData = [
  plane(images('p1-1'), projects.ring, -0.05,
    { accent: '#a9b8cf', background: '#000000', blob1: '#1c2433', blob2: '#3c5b71', labelColor: '#f4f4f4', word: 'silver', pms: '≈ PMS 429 C' },
    'Luminous orbital rings around a distant star', 1.4545),
  plane(images('p2-1'), projects.mortal, 0.12,
    { accent: '#a88978', background: '#0f0808', blob1: '#635752', blob2: '#574b48', labelColor: '#f4f4f4', word: 'taupe', pms: '≈ PMS 408 C' },
    'Aerial night view of a ribbon walkway winding over an urban village', 1.556),
  plane(images('p2-2'), projects.mortal, -0.05,
    { accent: '#57413d', background: '#100909', blob1: '#504746', blob2: '#3f3230', labelColor: '#f4f4f4', word: 'taupe', pms: '≈ PMS 438 C' },
    'Two people sitting beneath a glowing canopy in a narrow alley', 1),
  plane(images('p2-3'), projects.mortal, 0.12,
    { accent: '#7d554a', background: '#181111', blob1: '#625653', blob2: '#57433e', labelColor: '#f4f4f4', word: 'brown', pms: '≈ PMS 478 C' },
    'A lit timber stage structure with an audience at night', 1.556),
  plane(images('p3-1'), projects.whisper, -0.05,
    { accent: '#76777f', background: '#000000', blob1: '#525254', blob2: '#3f3b3f', labelColor: '#f4f4f4', word: 'gray', pms: '≈ PMS 424 C' },
    'A robotic arm fabricating a lattice on a ruined column', 1.5554),
  plane(images('p3-2'), projects.whisper, 0.12,
    { accent: '#747a94', background: '#272b36', blob1: '#696c78', blob2: '#595e6e', labelColor: '#f4f4f4', word: 'slate', pms: '≈ PMS 430 C' },
    'A white porous structure climbing a damaged building', 1),
  plane(images('p3-3'), projects.whisper, -0.05,
    { accent: '#5b627a', background: '#555c73', blob1: '#7a8093', blob2: '#07080c', labelColor: '#f4f4f4', word: 'slate', pms: '≈ PMS 431 C' },
    'People resting and walking inside a cave-like white structure', 1),
  plane(images('p4-1'), projects.heat, 0.12,
    { accent: '#d66947', background: '#050000', blob1: '#6b5049', blob2: '#4f3128', labelColor: '#f4f4f4', word: 'coral', pms: '≈ PMS 470 C' },
    'Point-cloud street scene overlaid with thermal imagery', 1.4146),
  plane(images('p4-2'), projects.heat, -0.05,
    { accent: '#8e3a89', background: '#000000', blob1: '#4a203e', blob2: '#803ea9', labelColor: '#f4f4f4', word: 'magenta', pms: '≈ PMS 259 C' },
    'A violet point-cloud landscape', 1.6969),
  plane(images('p4-3'), projects.heat, 0.12,
    { accent: '#8d7975', background: '#020202', blob1: '#5a5554', blob2: '#444544', labelColor: '#f4f4f4', word: 'taupe', pms: '≈ PMS 403 C' },
    'Streaks of light rushing through a dark city', 1.7916),
]

export { galleryPlaneData }
