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
    // 已加载的全部贴图（预览图 + 大图），dispose 时统一释放
    this.loadedTextures = new Set()
    this.textureLoader = new THREE.TextureLoader()
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
      // 只等第一张预览图（约 10KB），页面尽快出现；其余在 init 之后后台加载
      const firstPreview = await this.loadTexture(this.experience.gallery.planeConfig[0]?.previewSrc)
      // 加载期间已被销毁：释放迟到的贴图，不再继续初始化
      if (this.isDisposed) {
        this.releaseTexture(firstPreview)
        return
      }
      this.experience.gallery.setPreloadedTextures(new Map())

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
      if (firstPreview) this.applyPlaneTexture(0, firstPreview, 'preview')
      this.loadTexturesProgressively().catch((error) => {
        console.warn('Background texture loading stopped.', error)
      })
    } finally {
      document.body.classList.remove('loading')
    }
  }

  // 后台加载：先并行拿全部预览图（共约 280KB），再两路并发下载大图，离当前位置最近的优先
  async loadTexturesProgressively() {
    const gallery = this.experience.gallery
    const config = gallery.planeConfig

    const previews = Promise.all(
      config.map(async (planeDefinition, index) => {
        if (index === 0) return
        const texture = await this.loadTexture(planeDefinition.previewSrc)
        if (this.isDisposed) return this.releaseTexture(texture)
        if (texture) this.applyPlaneTexture(index, texture, 'preview')
      })
    )
    // 预览阶段最多等 4 秒：个别预览图卡住时，大图也照常开始下载
    await Promise.race([previews, new Promise((resolve) => setTimeout(resolve, 4000))])

    const pending = new Set(config.map((_, index) => index))
    const takeNearest = () => {
      const current = this.getCurrentPlaneIndex()
      let best = -1
      let bestScore = Infinity
      pending.forEach((index) => {
        // 往前（还没看到的）优先，往回的稍微靠后
        const score = index >= current ? index - current : (current - index) + 0.5
        if (score < bestScore) {
          bestScore = score
          best = index
        }
      })
      pending.delete(best)
      return best
    }
    const worker = async () => {
      while (pending.size && !this.isDisposed) {
        const index = takeNearest()
        const texture = await this.loadTexture(config[index].textureSrc)
        if (this.isDisposed) return this.releaseTexture(texture)
        if (texture) this.applyPlaneTexture(index, texture, 'full')
      }
    }
    await Promise.all([worker(), worker(), previews])
  }

  getCurrentPlaneIndex() {
    const blendData = this.experience.gallery.getPlaneBlendData(this.camera.position.z)
    if (!blendData) return 0
    return blendData.blend >= 0.5 ? blendData.nextPlaneIndex : blendData.currentPlaneIndex
  }

  // 把贴图换到指定平面；被替换下来的旧贴图（预览图）随即释放
  applyPlaneTexture(planeIndex, texture, quality) {
    const previous = this.experience.gallery.planes[planeIndex]?.userData.texture
    if (!this.experience.gallery.applyPlaneTexture(planeIndex, texture, quality)) {
      this.releaseTexture(texture)
      return
    }
    if (previous && previous !== texture) this.releaseTexture(previous)
    if (this.reducedMotion && !document.hidden) this.renderFrame(0)
  }

  async loadTexture(textureSource) {
    if (!textureSource) return null
    try {
      const texture = await this.textureLoader.loadAsync(textureSource)
      texture.colorSpace = THREE.SRGBColorSpace
      this.loadedTextures.add(texture)
      return texture
    } catch (error) {
      console.warn(`Texture failed to load: ${textureSource}`, error)
      return null
    }
  }

  releaseTexture(texture) {
    if (!texture) return
    texture.dispose()
    this.loadedTextures.delete(texture)
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

    this.loadedTextures.forEach((texture) => texture.dispose())
    this.loadedTextures.clear()
    this.stats?.dom.remove()
    this.stats = null
    this.experience.dispose?.()
  }
}

export { Engine }
