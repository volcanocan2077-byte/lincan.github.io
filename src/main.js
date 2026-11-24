import '@/css/base.css'
import '@/css/canvas.css'

import { Engine } from '@/Experience/Engine'
import { galleryPlaneData } from '@/data/galleryData'

const canvas = document.querySelector('.webgl')

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Missing .webgl canvas element in index.html')
}

// WebGL 不可用时的静态回退画廊，直接展示作品图
function showFallback(error) {
  console.warn('WebGL gallery unavailable; using the accessible image gallery.', error)
  document.body.classList.remove('loading')
  document.body.classList.add('gallery-fallback')
  canvas.hidden = true
  const stage = document.createElement('section')
  stage.className = 'fallback-stage'
  stage.setAttribute('aria-label', 'Portfolio works')
  stage.innerHTML = `
    <figure class="fallback-photo">
      <img alt="" width="750" height="1000">
      <figcaption aria-live="polite"></figcaption>
    </figure>
    <nav class="fallback-controls" aria-label="Gallery navigation">
      <button type="button">Previous</button>
      <button type="button">Next</button>
    </nav>`
  canvas.after(stage)
  const image = stage.querySelector('img')
  const caption = stage.querySelector('figcaption')
  const [previous, next] = stage.querySelectorAll('button')
  let current = 0
  const render = () => {
    const plane = galleryPlaneData[current]
    stage.style.setProperty('--fallback-bg', plane.backgroundColor)
    stage.style.setProperty('--fallback-mood', plane.blob1Color)
    stage.style.setProperty('--fallback-color', plane.label.color)
    image.src = plane.textureSrc
    const title = plane.project?.title || plane.label.word
    image.alt = plane.alt || title
    const meta = `${String(current + 1).padStart(2, '0')} / ${galleryPlaneData.length} · ${title} · ${plane.accentColor.toUpperCase()} · ${plane.label.pms}`
    // 与主画廊一致：同时显示项目简介
    caption.textContent = plane.project?.intro ? `${meta} — ${plane.project.intro}` : meta
    // 页眉明暗跟随该图的文字色
    document.body.classList.toggle('frame-text-dark', plane.label.color === '#2e2e2e')
    previous.disabled = current === 0
    next.disabled = current === galleryPlaneData.length - 1
  }
  previous.addEventListener('click', () => { current -= 1; render() })
  next.addEventListener('click', () => { current += 1; render() })
  render()
}

try {
  const engine = new Engine(canvas)
  engine.init().catch(showFallback)
} catch (error) {
  showFallback(error)
}
