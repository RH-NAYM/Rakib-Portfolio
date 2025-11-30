/**
 * Principal AI Engineer Portfolio
 * Dynamic Three.js Neural Visualization with Scroll-Reactive Effects
 * Updated particles to be smaller glowing dots
 */

;(() => {
  const THREE = window.THREE
  if (!THREE) return

  const CONFIG = {
    // Neural network
    nodeCount: 120,
    connectionDistance: 100,
    signalCount: 50,

    particleCount: 600,
    particleFieldSize: 900,
    particleMinSize: 0.3,
    particleMaxSize: 1.5,

    // Data streams
    streamCount: 6,
    streamParticles: 40,

    // Energy waves
    waveCount: 3,

    // Camera
    cameraDistance: 500,
    cameraDriftSpeed: 0.0003,
    cameraDriftRadius: 100,

    // Scroll reactivity
    scrollMultiplier: 2.5,
  }

  // Colors
  const COLORS = {
    primary: 0x00d4ff,
    secondary: 0x00ffaa,
    tertiary: 0x0066ff,
    background: 0x050508,
    node: 0x00d4ff,
    connection: 0x1a2a3a,
    particle: 0x00d4ff,
  }

  // State
  let scene, camera, renderer
  const nodes = [],
    connections = [],
    signals = []
  let particles,
    dataStreams = [],
    energyWaves = []
  let animationId,
    time = 0
  let scrollY = 0,
    targetScrollY = 0
  let mouseX = 0,
    mouseY = 0

  // Shaders
  const nodeVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;
    uniform float scroll;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      vec3 pos = position;
      pos.y += sin(time * 2.0 + position.x * 0.5) * 2.0;
      pos.x += cos(time * 1.5 + position.z * 0.3) * 1.5;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `

  const nodeFragmentShader = `
    uniform vec3 glowColor;
    uniform float intensity;
    uniform float time;
    uniform float scroll;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      float pulse = 0.7 + 0.3 * sin(time * 3.0 + vPosition.x * 0.1 + scroll * 0.5);
      float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
      float core = 0.3 + rim * 0.7;

      vec3 color = glowColor * intensity * pulse * core;
      float alpha = core * 0.9;

      gl_FragColor = vec4(color, alpha);
    }
  `

  const signalFragmentShader = `
    uniform vec3 color;
    uniform float time;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      float glow = 1.0 - dist * 2.0;
      glow = pow(glow, 1.5);

      float pulse = 0.8 + 0.2 * sin(time * 5.0);
      vec3 finalColor = color * glow * pulse;

      gl_FragColor = vec4(finalColor, glow * 0.95);
    }
  `

  const particleVertexShader = `
    attribute float size;
    attribute float alpha;
    attribute float twinkle;
    varying float vAlpha;
    varying float vTwinkle;
    uniform float time;

    void main() {
      vAlpha = alpha;
      vTwinkle = twinkle;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const particleFragmentShader = `
    uniform vec3 color;
    uniform float time;
    varying float vAlpha;
    varying float vTwinkle;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      // Sharp glowing dot effect
      float glow = 1.0 - dist * 2.0;
      glow = pow(glow, 2.5);

      // Twinkle effect
      float twinkleEffect = 0.6 + 0.4 * sin(time * 3.0 + vTwinkle * 10.0);

      vec3 finalColor = color * glow * 1.5;
      float finalAlpha = glow * vAlpha * twinkleEffect;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `

  const streamVertexShader = `
    attribute float size;
    attribute float alpha;
    varying float vAlpha;
    uniform float time;

    void main() {
      vAlpha = alpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (400.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const streamFragmentShader = `
    uniform vec3 color;
    uniform float time;
    varying float vAlpha;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      float glow = 1.0 - dist * 2.0;
      glow = pow(glow, 1.5);

      gl_FragColor = vec4(color * glow, glow * vAlpha);
    }
  `

  // Initialize
  function init() {
    const canvas = document.getElementById("neural-bg")
    if (!canvas) return

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(COLORS.background)
    scene.fog = new THREE.FogExp2(COLORS.background, 0.0008)

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000)
    camera.position.z = CONFIG.cameraDistance

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Create elements
    createNodes()
    createConnections()
    createSignals()
    createParticleField()
    createDataStreams()
    createEnergyWaves()

    // Events
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll)
    window.addEventListener("mousemove", onMouseMove)

    // Start
    animate()
  }

  // Create neural nodes
  function createNodes() {
    const geometry = new THREE.SphereGeometry(2, 12, 12)

    for (let i = 0; i < CONFIG.nodeCount; i++) {
      const layer = Math.floor(i / (CONFIG.nodeCount / 5))

      const x = (Math.random() - 0.5) * 600
      const y = (Math.random() - 0.5) * 450
      const z = (layer - 2) * 70 + (Math.random() - 0.5) * 50

      const material = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(COLORS.node) },
          intensity: { value: 0.4 + Math.random() * 0.4 },
          time: { value: 0 },
          scroll: { value: 0 },
        },
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const node = new THREE.Mesh(geometry, material)
      node.position.set(x, y, z)
      node.userData = {
        originalPos: new THREE.Vector3(x, y, z),
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.3,
        amplitude: 8 + Math.random() * 15,
      }

      scene.add(node)
      nodes.push(node)
    }
  }

  // Create connections
  function createConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position)

        if (dist < CONFIG.connectionDistance) {
          const opacity = 0.06 + (1 - dist / CONFIG.connectionDistance) * 0.1

          const material = new THREE.LineBasicMaterial({
            color: COLORS.connection,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
          })

          const geometry = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position])

          const line = new THREE.Line(geometry, material)
          line.userData = { startIdx: i, endIdx: j, baseOpacity: opacity }

          scene.add(line)
          connections.push(line)
        }
      }
    }
  }

  // Create traveling signals
  function createSignals() {
    if (connections.length === 0) return

    const positions = new Float32Array(CONFIG.signalCount * 3)
    const sizes = new Float32Array(CONFIG.signalCount)

    for (let i = 0; i < CONFIG.signalCount; i++) {
      sizes[i] = 2 + Math.random() * 4
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(COLORS.primary) },
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: signalFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    for (let i = 0; i < CONFIG.signalCount; i++) {
      signals.push({
        points,
        index: i,
        connection: Math.floor(Math.random() * connections.length),
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.006,
        direction: Math.random() > 0.5 ? 1 : -1,
      })
    }
  }

  function createParticleField() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(CONFIG.particleCount * 3)
    const sizes = new Float32Array(CONFIG.particleCount)
    const alphas = new Float32Array(CONFIG.particleCount)
    const twinkles = new Float32Array(CONFIG.particleCount)

    for (let i = 0; i < CONFIG.particleCount; i++) {
      // Distribute particles in a larger volume
      positions[i * 3] = (Math.random() - 0.5) * CONFIG.particleFieldSize
      positions[i * 3 + 1] = (Math.random() - 0.5) * CONFIG.particleFieldSize
      positions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.particleFieldSize * 0.6

      sizes[i] = CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize)
      alphas[i] = 0.3 + Math.random() * 0.7
      twinkles[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute("twinkle", new THREE.BufferAttribute(twinkles, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(COLORS.particle) },
        time: { value: 0 },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    particles = new THREE.Points(geometry, material)
    scene.add(particles)
  }

  // Create data streams
  function createDataStreams() {
    for (let s = 0; s < CONFIG.streamCount; s++) {
      const positions = new Float32Array(CONFIG.streamParticles * 3)
      const sizes = new Float32Array(CONFIG.streamParticles)
      const alphas = new Float32Array(CONFIG.streamParticles)

      const angle = (s / CONFIG.streamCount) * Math.PI * 2
      const radius = 180 + Math.random() * 80

      for (let i = 0; i < CONFIG.streamParticles; i++) {
        const t = i / CONFIG.streamParticles
        positions[i * 3] = Math.cos(angle + t * 2) * radius * (1 - t * 0.3)
        positions[i * 3 + 1] = (t - 0.5) * 450
        positions[i * 3 + 2] = Math.sin(angle + t * 2) * radius * (1 - t * 0.3)
        sizes[i] = 1 + (1 - t) * 3
        alphas[i] = (1 - t) * 0.7
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
      geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1))

      const hue = s / CONFIG.streamCount
      const color = new THREE.Color().setHSL(0.5 + hue * 0.12, 1, 0.5)

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: color },
          time: { value: 0 },
        },
        vertexShader: streamVertexShader,
        fragmentShader: streamFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const stream = new THREE.Points(geometry, material)
      stream.userData = {
        angle,
        radius,
        speed: 0.25 + Math.random() * 0.25,
        offset: Math.random() * Math.PI * 2,
      }

      scene.add(stream)
      dataStreams.push(stream)
    }
  }

  // Create energy waves
  function createEnergyWaves() {
    for (let w = 0; w < CONFIG.waveCount; w++) {
      const geometry = new THREE.RingGeometry(40 + w * 60, 44 + w * 60, 64)
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.primary,
        transparent: true,
        opacity: 0.08 - w * 0.015,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })

      const wave = new THREE.Mesh(geometry, material)
      wave.rotation.x = Math.PI / 2
      wave.position.z = -100
      wave.userData = {
        baseScale: 1,
        speed: 0.4 + w * 0.15,
        phase: w * 0.5,
      }

      scene.add(wave)
      energyWaves.push(wave)
    }
  }

  // Animation loop
  function animate() {
    animationId = requestAnimationFrame(animate)
    time += 0.016

    // Smooth scroll interpolation
    scrollY += (targetScrollY - scrollY) * 0.08
    const scrollNorm = Math.min(scrollY / (document.body.scrollHeight - window.innerHeight), 1)

    const driftX = Math.sin(time * CONFIG.cameraDriftSpeed * 1000) * CONFIG.cameraDriftRadius
    const driftY = Math.cos(time * CONFIG.cameraDriftSpeed * 800) * CONFIG.cameraDriftRadius * 0.7
    const driftZ = Math.sin(time * CONFIG.cameraDriftSpeed * 600) * 30

    camera.position.x += (driftX + mouseX * 50 - camera.position.x) * 0.02
    camera.position.y += (driftY - mouseY * 30 - camera.position.y) * 0.02
    camera.position.z = CONFIG.cameraDistance - scrollNorm * 200 + driftZ
    camera.lookAt(0, 0, 0)

    // Update nodes with more movement
    nodes.forEach((node, i) => {
      const ud = node.userData
      const scrollEffect = Math.sin(scrollNorm * Math.PI * 3 + ud.phase) * 25

      node.position.x = ud.originalPos.x + Math.sin(time * ud.speed + ud.phase) * ud.amplitude
      node.position.y =
        ud.originalPos.y + Math.cos(time * ud.speed * 0.7 + ud.phase) * ud.amplitude * 0.8 + scrollEffect
      node.position.z = ud.originalPos.z + Math.sin(time * ud.speed * 0.4 + ud.phase) * 8

      node.material.uniforms.time.value = time
      node.material.uniforms.scroll.value = scrollNorm
    })

    // Update connections
    connections.forEach((conn) => {
      const start = nodes[conn.userData.startIdx]
      const end = nodes[conn.userData.endIdx]

      const positions = conn.geometry.attributes.position.array
      positions[0] = start.position.x
      positions[1] = start.position.y
      positions[2] = start.position.z
      positions[3] = end.position.x
      positions[4] = end.position.y
      positions[5] = end.position.z
      conn.geometry.attributes.position.needsUpdate = true

      // Pulse connections based on scroll
      const pulse = 0.7 + 0.3 * Math.sin(time * 2.5 + conn.userData.startIdx * 0.1)
      conn.material.opacity = conn.userData.baseOpacity * pulse * (1 + scrollNorm * 0.8)
    })

    // Update signals with scroll speed boost
    if (signals.length > 0 && connections.length > 0) {
      const positions = signals[0].points.geometry.attributes.position.array

      signals.forEach((signal) => {
        signal.progress += signal.speed * signal.direction * (1 + scrollNorm * CONFIG.scrollMultiplier)

        if (signal.progress >= 1 || signal.progress <= 0) {
          signal.connection = Math.floor(Math.random() * connections.length)
          signal.progress = signal.direction > 0 ? 0 : 1
          signal.direction = Math.random() > 0.5 ? 1 : -1
        }

        const conn = connections[signal.connection]
        if (conn) {
          const start = nodes[conn.userData.startIdx]
          const end = nodes[conn.userData.endIdx]

          positions[signal.index * 3] = start.position.x + (end.position.x - start.position.x) * signal.progress
          positions[signal.index * 3 + 1] = start.position.y + (end.position.y - start.position.y) * signal.progress
          positions[signal.index * 3 + 2] = start.position.z + (end.position.z - start.position.z) * signal.progress
        }
      })

      signals[0].points.geometry.attributes.position.needsUpdate = true
      signals[0].points.material.uniforms.time.value = time
    }

    if (particles) {
      particles.rotation.y = time * 0.03 + scrollNorm * 0.8
      particles.rotation.x = Math.sin(time * 0.02) * 0.1

      particles.material.uniforms.time.value = time

      const positions = particles.geometry.attributes.position.array
      for (let i = 0; i < CONFIG.particleCount; i++) {
        // Gentle floating motion
        positions[i * 3 + 1] += Math.sin(time * 0.5 + i * 0.05) * 0.15
        positions[i * 3] += Math.cos(time * 0.3 + i * 0.03) * 0.08
      }
      particles.geometry.attributes.position.needsUpdate = true
    }

    // Update data streams with more reactivity
    dataStreams.forEach((stream, i) => {
      const ud = stream.userData
      stream.rotation.y = time * ud.speed + ud.offset + scrollNorm * 3

      const positions = stream.geometry.attributes.position.array
      for (let j = 0; j < CONFIG.streamParticles; j++) {
        const t = j / CONFIG.streamParticles
        const yOffset = Math.sin(time * 2.5 + j * 0.25 + ud.offset) * 12
        positions[j * 3 + 1] = (t - 0.5) * 450 + yOffset + scrollNorm * 120
      }
      stream.geometry.attributes.position.needsUpdate = true
      stream.material.uniforms.time.value = time
    })

    // Update energy waves
    energyWaves.forEach((wave, i) => {
      const ud = wave.userData
      const scale = ud.baseScale + Math.sin(time * ud.speed + ud.phase) * 0.4 + scrollNorm * 0.6
      wave.scale.set(scale, scale, 1)
      wave.rotation.z = time * 0.12 * (i % 2 === 0 ? 1 : -1)
      wave.material.opacity = (0.06 - i * 0.015) * (1 + Math.sin(time * 2.5) * 0.4)
    })

    renderer.render(scene, camera)
  }

  // Event handlers
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  function onScroll() {
    targetScrollY = window.scrollY
    updateScrollProgress()
    updateActiveSection()
  }

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1
    mouseY = (e.clientY / window.innerHeight) * 2 - 1
  }

  // UI Functions
  function updateScrollProgress() {
    const scrollHeight = document.body.scrollHeight - window.innerHeight
    const progress = (window.scrollY / scrollHeight) * 100
    const bar = document.querySelector(".scroll-progress-bar")
    if (bar) bar.style.width = `${progress}%`
  }

  function updateActiveSection() {
    const sections = document.querySelectorAll(".section")
    const navLinks = document.querySelectorAll(".nav-link")
    const dots = document.querySelectorAll(".section-dot")

    let current = ""

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect()
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        current = section.id
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.dataset.section === current) {
        link.classList.add("active")
      }
    })

    dots.forEach((dot) => {
      dot.classList.remove("active")
      if (dot.dataset.section === current) {
        dot.classList.add("active")
      }
    })
  }

  function initNavigation() {
    const toggle = document.querySelector(".nav-toggle")
    const links = document.querySelector(".nav-links")

    if (toggle && links) {
      toggle.addEventListener("click", () => {
        links.classList.toggle("active")
        toggle.classList.toggle("active")
      })

      // Close menu on link click
      links.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          links.classList.remove("active")
          toggle.classList.remove("active")
        })
      })
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute("href"))
        if (target) {
          target.scrollIntoView({ behavior: "smooth" })
        }
      })
    })
  }

  function initScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.1 },
    )

    document.querySelectorAll(".project-card, .blog-card, .sidebar-card").forEach((el) => {
      observer.observe(el)
    })
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init()
      initNavigation()
      initScrollReveal()
      updateActiveSection()
    })
  } else {
    init()
    initNavigation()
    initScrollReveal()
    updateActiveSection()
  }

  window.addEventListener("beforeunload", () => {
    if (animationId) cancelAnimationFrame(animationId)
  })
})()
