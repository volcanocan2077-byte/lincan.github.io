import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { world } from '@/Experience/'
import { Scroll } from '@/Experience/Scroll'

class Engine {
  constructor(canvas, experience = world) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Engine requires a valid canvas element')
    }

    // Initialization
    this.canvas = canvas
    this.experience = experience
    this.debug = this.experience.debug
    this.isInitialized = false
    this.isRunning = false
    this.isDebugBound = false
    this.animationFrameRequestId = null
    this.preloadedTextures = new Map()
    this.stats = null
    this.showFps = true
    this.isDebugUiVisible = false
    this.scene = new THREE.Scene()
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = false
    this.motionDefaults = null

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.set(0, 0, 6)

    // Scroll
    this.scroll = new Scroll(this.camera, this.experience.gallery, this.debug)
    this.scroll.onInput = () => {
      if (this.reducedMotion && this.isInitialized && !document.hidden) this.renderFrame(0)
    }

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.autoClear = false

    this.onResize = () => {
      this.resize()
    }
    this.onKeyDown = (event) => {
      if (event.repeat) return
      if (event.key.toLowerCase() !== 'd') return
      this.setDebugUiVisible(!this.isDebugUiVisible)
    }
    this.onMotionChange = () => this.applyMotionPreference()
    this.onVisibilityChange = () => {
      if (document.hidden) this.stop()
      else if (this.reducedMotion) this.renderFrame(0)
      else this.start()
    }

    this.animate = this.update.bind(this)
  }

  async init() {
    if (this.isInitialized) return

    document.body.classList.add('loading')

    try {
      // 只等第一张图，页面尽快出现；其余在 init 之后后台加载
      const textureSources = this.experience.gallery.getTextureSources()
      this.preloadedTextures = await this.preloadTextures(textureSources.slice(0, 1))
      this.experience.gallery.setPreloadedTextures(this.preloadedTextures)

      await this.experience.init(this.scene, this.camera)
      this.scroll.init()
      this.initStats()
      this.bindDebug()
      this.setDebugUiVisible(false)

      this.resize()
      window.addEventListener('resize', this.onResize)
      window.addEventListener('keydown', this.onKeyDown)
      this.scroll.bindEvents()

      this.isInitialized = true
      this.motionPreference.addEventListener('change', this.onMotionChange)
      document.addEventListener('visibilitychange', this.onVisibilityChange)
      this.applyMotionPreference()
      this.loadRemainingTextures(textureSources.slice(1))
    } finally {
      document.body.classList.remove('loading')
    }
  }

  // 按展示顺序逐张加载，离镜头近的先到；不阻塞页面
  async loadRemainingTextures(textureSources) {
    for (const textureSource of textureSources) {
      if (this.isDisposed) return
      const [texture] = (await this.preloadTextures([textureSource])).values()
      if (!texture || this.isDisposed) {
        texture?.dispose()
        continue
      }
      this.preloadedTextures.set(textureSource, texture)
      this.experience.gallery.applyTexture(textureSource, texture)
      if (this.reducedMotion && !document.hidden) this.renderFrame(0)
    }
  }

  start() {
    if (!this.isInitialized || this.isRunning || this.reducedMotion || document.hidden) return

    this.isRunning = true
    this.update()
  }

  stop() {
    this.isRunning = false
    if (this.animationFrameRequestId !== null) {
      cancelAnimationFrame(this.animationFrameRequestId)
      this.animationFrameRequestId = null
    }
  }

  applyMotionPreference() {
    const gallery = this.experience.gallery
    const background = this.experience.background
    const trail = this.experience.trailController.configuration
    this.reducedMotion = this.motionPreference.matches
    this.scroll.reducedMotion = this.reducedMotion

    if (this.reducedMotion) {
      this.motionDefaults ??= {
        gallery: Object.fromEntries(['parallaxEnabled', 'breathEnabled', 'gestureParallaxEnabled', 'planeFadeSmoothing', 'breathSmoothing', 'gestureParallaxSmoothing'].map(key => [key, gallery[key]])),
        background: background.motionSmoothing,
        trail: trail.isEnabled,
      }
      this.stop()
      gallery.parallaxEnabled = gallery.breathEnabled = gallery.gestureParallaxEnabled = false
      gallery.planeFadeSmoothing = gallery.breathSmoothing = gallery.gestureParallaxSmoothing = 1
      background.motionSmoothing = 1
      trail.isEnabled = false
      const step = this.experience.gallery.planeGap / this.scroll.scrollToWorldFactor
      this.scroll.scrollTarget = Math.round(this.scroll.scrollTarget / step) * step
      if (!document.hidden) this.renderFrame(0)
    } else {
      if (this.motionDefaults) {
        Object.assign(gallery, this.motionDefaults.gallery)
        background.motionSmoothing = this.motionDefaults.background
        trail.isEnabled = this.motionDefaults.trail
        this.motionDefaults = null
      }
      this.start()
    }
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth || 1
    const height = this.canvas.clientHeight || window.innerHeight || 1
    if (width <= 0 || height <= 0) return

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.experience.gallery.updatePlaneScale()
    this.experience.gallery.layoutPlanes()
    this.experience.label.resize(width, height)
    if (this.isInitialized && this.reducedMotion && !document.hidden) this.renderFrame(0)
  }

  async preloadTextures(textureSources = this.experience.gallery.getTextureSources()) {
    if (!textureSources.length) return new Map()

    const textureLoader = new THREE.TextureLoader()
    const loadedTextures = new Map()

    await Promise.all(
      textureSources.map(async (textureSource) => {
        try {
          const texture = await textureLoader.loadAsync(textureSource)
          texture.colorSpace = THREE.SRGBColorSpace
          loadedTextures.set(textureSource, texture)
        } catch (error) {
          console.warn(`Texture failed to load: ${textureSource}`, error)
        }
      })
    )

    return loadedTextures
  }

  update() {
    if (!this.isRunning) return

    this.animationFrameRequestId = requestAnimationFrame(this.animate)
    this.renderFrame(performance.now())
  }

  renderFrame(time) {
    this.stats?.begin()

    this.scroll.update()
    this.experience.update(time, this.camera, this.scroll)

    this.renderer.clear(true, true, true)
    this.experience.background.render(this.renderer)
    this.renderer.clearDepth()
    this.renderer.render(this.scene, this.camera)
    this.experience.label.render()
    this.stats?.end()
  }

  initStats() {
    if (this.stats) return

    this.stats = new Stats()
    this.stats.showPanel(0)
    this.stats.dom.classList.add('fps-stats')
    document.body.append(this.stats.dom)
    this.setFpsVisible(this.showFps)
  }

  setFpsVisible(isVisible) {
    if (!this.stats) return
    const shouldShow = Boolean(isVisible) && this.isDebugUiVisible
    this.stats.dom.style.display = shouldShow ? 'block' : 'none'
  }

  setDebugUiVisible(isVisible) {
    this.isDebugUiVisible = Boolean(isVisible)
    this.debug?.setVisible(this.isDebugUiVisible)
    this.scroll?.setDebugUiVisible(this.isDebugUiVisible)
    this.setFpsVisible(this.showFps)
  }

  bindDebug() {
    if (!this.debug || this.isDebugBound) return

    this.debug.addBinding({
      folderTitle: 'Engine',
      targetObject: this,
      property: 'showFps',
      label: 'Show FPS',
      onChange: (value) => {
        this.setFpsVisible(value)
      },
    })

    this.isDebugBound = true
  }

  dispose() {
    this.isDisposed = true // 让后台贴图加载停止
    this.stop()

    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('keydown', this.onKeyDown)
    this.motionPreference.removeEventListener('change', this.onMotionChange)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.scroll.dispose()

    this.preloadedTextures.forEach((texture) => {
      texture.dispose()
    })
    this.preloadedTextures.clear()
    this.stats?.dom.remove()
    this.stats = null
    this.experience.dispose?.()
  }
}

export { Engine }
