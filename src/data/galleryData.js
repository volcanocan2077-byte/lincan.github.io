// 画廊数据：10 张作品，按项目分组。色值来自 docs/palette.json（T02 脚本提取）
import P1_1 from '../../images/p1-1.webp'
import P2_1 from '../../images/p2-1.webp'
import P2_2 from '../../images/p2-2.webp'
import P2_3 from '../../images/p2-3.webp'
import P3_1 from '../../images/p3-1.webp'
import P3_2 from '../../images/p3-2.webp'
import P3_3 from '../../images/p3-3.webp'
import P4_1 from '../../images/p4-1.webp'
import P4_2 from '../../images/p4-2.webp'
import P4_3 from '../../images/p4-3.webp'

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
function plane(textureSrc, project, x, palette, alt) {
  return {
    fallbackColor: palette.accent,
    accentColor: palette.accent,
    textureSrc,
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
  plane(P1_1, projects.ring, -0.05,
    { accent: '#a9b8cf', background: '#000000', blob1: '#1c2433', blob2: '#3c5b71', labelColor: '#f4f4f4', word: 'silver', pms: '≈ PMS 429 C' },
    'Luminous orbital rings around a distant star'),
  plane(P2_1, projects.mortal, 0.12,
    { accent: '#a88978', background: '#0f0808', blob1: '#635752', blob2: '#574b48', labelColor: '#f4f4f4', word: 'taupe', pms: '≈ PMS 408 C' },
    'Aerial night view of a ribbon walkway winding over an urban village'),
  plane(P2_2, projects.mortal, -0.05,
    { accent: '#57413d', background: '#100909', blob1: '#504746', blob2: '#3f3230', labelColor: '#f4f4f4', word: 'taupe', pms: '≈ PMS 438 C' },
    'Two people sitting beneath a glowing canopy in a narrow alley'),
  plane(P2_3, projects.mortal, 0.12,
    { accent: '#7d554a', background: '#181111', blob1: '#625653', blob2: '#57433e', labelColor: '#f4f4f4', word: 'brown', pms: '≈ PMS 478 C' },
    'A lit timber stage structure with an audience at night'),
  plane(P3_1, projects.whisper, -0.05,
    { accent: '#76777f', background: '#000000', blob1: '#525254', blob2: '#3f3b3f', labelColor: '#f4f4f4', word: 'gray', pms: '≈ PMS 424 C' },
    'A robotic arm fabricating a lattice on a ruined column'),
  plane(P3_2, projects.whisper, 0.12,
    { accent: '#747a94', background: '#272b36', blob1: '#696c78', blob2: '#595e6e', labelColor: '#f4f4f4', word: 'slate', pms: '≈ PMS 430 C' },
    'A white porous structure climbing a damaged building'),
  plane(P3_3, projects.whisper, -0.05,
    { accent: '#5b627a', background: '#555c73', blob1: '#7a8093', blob2: '#07080c', labelColor: '#f4f4f4', word: 'slate', pms: '≈ PMS 431 C' },
    'People resting and walking inside a cave-like white structure'),
  plane(P4_1, projects.heat, 0.12,
    { accent: '#d66947', background: '#050000', blob1: '#6b5049', blob2: '#4f3128', labelColor: '#f4f4f4', word: 'coral', pms: '≈ PMS 470 C' },
    'Point-cloud street scene overlaid with thermal imagery'),
  plane(P4_2, projects.heat, -0.05,
    { accent: '#8e3a89', background: '#000000', blob1: '#4a203e', blob2: '#803ea9', labelColor: '#f4f4f4', word: 'magenta', pms: '≈ PMS 259 C' },
    'A violet point-cloud landscape'),
  plane(P4_3, projects.heat, 0.12,
    { accent: '#8d7975', background: '#020202', blob1: '#5a5554', blob2: '#444544', labelColor: '#f4f4f4', word: 'taupe', pms: '≈ PMS 403 C' },
    'Streaks of light rushing through a dark city'),
]

export { galleryPlaneData }
