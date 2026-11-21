import '@/css/base.css'
import '@/css/canvas.css'

import { Engine } from '@/Experience/Engine'
import { galleryPlaneData } from '@/data/galleryData'

const canvas = document.querySelector('.webgl')

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Missing .webgl canvas element in index.html')
}

// A static, navigable fallback uses the original photographs, never preview media.
function showFallback(error) {
  console.warn('WebGL gallery unavailable; using the accessible image gallery.', error)
  document.body.classList.remove('loading')
  document.body.classList.add('gallery-fallback')
  canvas.hidden = true
  const stage = document.createElement('section')
  stage.className = 'fallback-stage'
  stage.setAttribute('aria-label', 'Atmospheric depth gallery photographs')
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
    image.alt = `${plane.label.word} floral photograph`
    caption.textContent = `${String(current + 1).padStart(2, '0')} · ${plane.label.word} · ${plane.accentColor.toUpperCase()} · ${plane.label.pms}`
    document.body.classList.toggle('frame-text-dark', current < 2)
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
