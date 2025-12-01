// /**
//  * Principal AI Engineer Portfolio
//  * Dynamic Three.js Neural Visualization - Clean & Professional
//  */

// ;(() => {
//   const THREE = window.THREE
//   if (!THREE) return

//   const CONFIG = {
//     nodeCount: 100,
//     connectionDistance: 90,
//     signalCount: 40,
//     particleCount: 800,
//     particleFieldSize: 1000,
//     particleMinSize: 0.2,
//     particleMaxSize: 0.8,
//     streamCount: 5,
//     streamParticles: 35,
//     waveCount: 2,
//     cameraDistance: 450,
//     cameraDriftSpeed: 0.0002,
//     cameraDriftRadius: 80,
//     scrollMultiplier: 2,
//   }

//   const COLORS = {
//     primary: 0x00d4ff,
//     secondary: 0x00ff88,
//     tertiary: 0x0066ff,
//     background: 0x030306,
//     node: 0x00d4ff,
//     connection: 0x1a2535,
//     particle: 0x00d4ff,
//   }

//   let scene, camera, renderer
//   const nodes = [],
//     connections = [],
//     signals = []
//   let particles,
//     dataStreams = [],
//     energyWaves = []
//   let animationId,
//     time = 0
//   let scrollY = 0,
//     targetScrollY = 0
//   let mouseX = 0,
//     mouseY = 0

//   // Shaders
//   const nodeVertexShader = `
//         varying vec3 vNormal;
//         varying vec3 vPosition;
//         uniform float time;

//         void main() {
//             vNormal = normalize(normalMatrix * normal);
//             vPosition = position;
//             vec3 pos = position;
//             pos.y += sin(time * 1.5 + position.x * 0.4) * 1.5;
//             pos.x += cos(time * 1.2 + position.z * 0.3) * 1.0;
//             gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
//         }
//     `

//   const nodeFragmentShader = `
//         uniform vec3 glowColor;
//         uniform float intensity;
//         uniform float time;

//         varying vec3 vNormal;
//         varying vec3 vPosition;

//         void main() {
//             float pulse = 0.75 + 0.25 * sin(time * 2.5 + vPosition.x * 0.08);
//             float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
//             float core = 0.35 + rim * 0.65;
//             vec3 color = glowColor * intensity * pulse * core;
//             gl_FragColor = vec4(color, core * 0.85);
//         }
//     `

//   const particleVertexShader = `
//         attribute float size;
//         attribute float alpha;
//         attribute float twinkle;
//         varying float vAlpha;
//         varying float vTwinkle;
//         uniform float time;

//         void main() {
//             vAlpha = alpha;
//             vTwinkle = twinkle;
//             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//             gl_PointSize = size * (250.0 / -mvPosition.z);
//             gl_Position = projectionMatrix * mvPosition;
//         }
//     `

//   const particleFragmentShader = `
//         uniform vec3 color;
//         uniform float time;
//         varying float vAlpha;
//         varying float vTwinkle;

//         void main() {
//             float dist = length(gl_PointCoord - vec2(0.5));
//             if (dist > 0.5) discard;

//             float glow = 1.0 - dist * 2.0;
//             glow = pow(glow, 3.0);

//             float twinkleEffect = 0.5 + 0.5 * sin(time * 2.5 + vTwinkle * 8.0);
//             vec3 finalColor = color * glow * 1.8;
//             float finalAlpha = glow * vAlpha * twinkleEffect * 0.9;

//             gl_FragColor = vec4(finalColor, finalAlpha);
//         }
//     `

//   const signalFragmentShader = `
//         uniform vec3 color;
//         uniform float time;

//         void main() {
//             float dist = length(gl_PointCoord - vec2(0.5));
//             if (dist > 0.5) discard;

//             float glow = 1.0 - dist * 2.0;
//             glow = pow(glow, 1.8);

//             float pulse = 0.85 + 0.15 * sin(time * 4.0);
//             vec3 finalColor = color * glow * pulse;

//             gl_FragColor = vec4(finalColor, glow * 0.9);
//         }
//     `

  function init() {
    const canvas = document.getElementById("neural-bg")
    if (!canvas) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(COLORS.background)
    scene.fog = new THREE.FogExp2(COLORS.background, 0.0006)

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 2000)
    camera.position.z = CONFIG.cameraDistance

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    createNodes()
    createConnections()
    createSignals()
    createParticleField()
    createDataStreams()
    createEnergyWaves()

    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll)
    window.addEventListener("mousemove", onMouseMove)

    animate()
  }

//   function createNodes() {
//     const geometry = new THREE.SphereGeometry(1.8, 10, 10)

//     for (let i = 0; i < CONFIG.nodeCount; i++) {
//       const layer = Math.floor(i / (CONFIG.nodeCount / 5))
//       const x = (Math.random() - 0.5) * 550
//       const y = (Math.random() - 0.5) * 400
//       const z = (layer - 2) * 60 + (Math.random() - 0.5) * 40

//       const material = new THREE.ShaderMaterial({
//         uniforms: {
//           glowColor: { value: new THREE.Color(COLORS.node) },
//           intensity: { value: 0.35 + Math.random() * 0.35 },
//           time: { value: 0 },
//         },
//         vertexShader: nodeVertexShader,
//         fragmentShader: nodeFragmentShader,
//         transparent: true,
//         blending: THREE.AdditiveBlending,
//         depthWrite: false,
//       })

//       const node = new THREE.Mesh(geometry, material)
//       node.position.set(x, y, z)
//       node.userData = {
//         originalPos: new THREE.Vector3(x, y, z),
//         phase: Math.random() * Math.PI * 2,
//         speed: 0.15 + Math.random() * 0.25,
//         amplitude: 6 + Math.random() * 12,
//       }

//       scene.add(node)
//       nodes.push(node)
//     }
//   }

//   function createConnections() {
//     for (let i = 0; i < nodes.length; i++) {
//       for (let j = i + 1; j < nodes.length; j++) {
//         const dist = nodes[i].position.distanceTo(nodes[j].position)

//         if (dist < CONFIG.connectionDistance) {
//           const opacity = 0.04 + (1 - dist / CONFIG.connectionDistance) * 0.08

//           const material = new THREE.LineBasicMaterial({
//             color: COLORS.connection,
//             transparent: true,
//             opacity,
//             blending: THREE.AdditiveBlending,
//           })

//           const geometry = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position])

//           const line = new THREE.Line(geometry, material)
//           line.userData = { startIdx: i, endIdx: j, baseOpacity: opacity }

//           scene.add(line)
//           connections.push(line)
//         }
//       }
//     }
//   }

//   function createSignals() {
//     if (connections.length === 0) return

//     const positions = new Float32Array(CONFIG.signalCount * 3)
//     const sizes = new Float32Array(CONFIG.signalCount)

//     for (let i = 0; i < CONFIG.signalCount; i++) {
//       sizes[i] = 1.5 + Math.random() * 3
//     }

//     const geometry = new THREE.BufferGeometry()
//     geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
//     geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

//     const material = new THREE.ShaderMaterial({
//       uniforms: {
//         color: { value: new THREE.Color(COLORS.primary) },
//         time: { value: 0 },
//       },
//       vertexShader: `
//                 attribute float size;
//                 void main() {
//                     vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//                     gl_PointSize = size * (250.0 / -mvPosition.z);
//                     gl_Position = projectionMatrix * mvPosition;
//                 }
//             `,
//       fragmentShader: signalFragmentShader,
//       transparent: true,
//       blending: THREE.AdditiveBlending,
//       depthWrite: false,
//     })

//     const points = new THREE.Points(geometry, material)
//     scene.add(points)

//     for (let i = 0; i < CONFIG.signalCount; i++) {
//       signals.push({
//         points,
//         index: i,
//         connection: Math.floor(Math.random() * connections.length),
//         progress: Math.random(),
//         speed: 0.002 + Math.random() * 0.004,
//         direction: Math.random() > 0.5 ? 1 : -1,
//       })
//     }
//   }

//   function createParticleField() {
//     const geometry = new THREE.BufferGeometry()
//     const positions = new Float32Array(CONFIG.particleCount * 3)
//     const sizes = new Float32Array(CONFIG.particleCount)
//     const alphas = new Float32Array(CONFIG.particleCount)
//     const twinkles = new Float32Array(CONFIG.particleCount)

//     for (let i = 0; i < CONFIG.particleCount; i++) {
//       positions[i * 3] = (Math.random() - 0.5) * CONFIG.particleFieldSize
//       positions[i * 3 + 1] = (Math.random() - 0.5) * CONFIG.particleFieldSize
//       positions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.particleFieldSize * 0.5

//       sizes[i] = CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize)
//       alphas[i] = 0.2 + Math.random() * 0.6
//       twinkles[i] = Math.random() * Math.PI * 2
//     }

//     geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
//     geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
//     geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1))
//     geometry.setAttribute("twinkle", new THREE.BufferAttribute(twinkles, 1))

//     const material = new THREE.ShaderMaterial({
//       uniforms: {
//         color: { value: new THREE.Color(COLORS.particle) },
//         time: { value: 0 },
//       },
//       vertexShader: particleVertexShader,
//       fragmentShader: particleFragmentShader,
//       transparent: true,
//       blending: THREE.AdditiveBlending,
//       depthWrite: false,
//     })

//     particles = new THREE.Points(geometry, material)
//     scene.add(particles)
//   }

//   function createDataStreams() {
//     for (let s = 0; s < CONFIG.streamCount; s++) {
//       const positions = new Float32Array(CONFIG.streamParticles * 3)
//       const sizes = new Float32Array(CONFIG.streamParticles)
//       const alphas = new Float32Array(CONFIG.streamParticles)

//       const angle = (s / CONFIG.streamCount) * Math.PI * 2
//       const radius = 160 + Math.random() * 60

//       for (let i = 0; i < CONFIG.streamParticles; i++) {
//         const t = i / CONFIG.streamParticles
//         positions[i * 3] = Math.cos(angle + t * 2) * radius * (1 - t * 0.3)
//         positions[i * 3 + 1] = (t - 0.5) * 400
//         positions[i * 3 + 2] = Math.sin(angle + t * 2) * radius * (1 - t * 0.3)
//         sizes[i] = 0.8 + (1 - t) * 2
//         alphas[i] = (1 - t) * 0.6
//       }

//       const geometry = new THREE.BufferGeometry()
//       geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
//       geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
//       geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1))

//       const hue = s / CONFIG.streamCount
//       const color = new THREE.Color().setHSL(0.5 + hue * 0.1, 0.9, 0.55)

//       const material = new THREE.ShaderMaterial({
//         uniforms: {
//           color: { value: color },
//           time: { value: 0 },
//         },
//         vertexShader: `
//                     attribute float size;
//                     attribute float alpha;
//                     varying float vAlpha;
//                     void main() {
//                         vAlpha = alpha;
//                         vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//                         gl_PointSize = size * (350.0 / -mvPosition.z);
//                         gl_Position = projectionMatrix * mvPosition;
//                     }
//                 `,
//         fragmentShader: `
//                     uniform vec3 color;
//                     uniform float time;
//                     varying float vAlpha;
//                     void main() {
//                         float dist = length(gl_PointCoord - vec2(0.5));
//                         if (dist > 0.5) discard;
//                         float glow = 1.0 - dist * 2.0;
//                         glow = pow(glow, 1.8);
//                         gl_FragColor = vec4(color * glow, glow * vAlpha);
//                     }
//                 `,
//         transparent: true,
//         blending: THREE.AdditiveBlending,
//         depthWrite: false,
//       })

//       const stream = new THREE.Points(geometry, material)
//       stream.userData = {
//         angle,
//         radius,
//         speed: 0.2 + Math.random() * 0.2,
//         offset: Math.random() * Math.PI * 2,
//       }

//       scene.add(stream)
//       dataStreams.push(stream)
//     }
//   }

//   function createEnergyWaves() {
//     for (let w = 0; w < CONFIG.waveCount; w++) {
//       const geometry = new THREE.RingGeometry(35 + w * 50, 38 + w * 50, 64)
//       const material = new THREE.MeshBasicMaterial({
//         color: COLORS.primary,
//         transparent: true,
//         opacity: 0.06 - w * 0.015,
//         side: THREE.DoubleSide,
//         blending: THREE.AdditiveBlending,
//       })

//       const wave = new THREE.Mesh(geometry, material)
//       wave.rotation.x = Math.PI / 2
//       wave.position.z = -80
//       wave.userData = {
//         baseScale: 1,
//         speed: 0.35 + w * 0.12,
//         phase: w * 0.4,
//       }

//       scene.add(wave)
//       energyWaves.push(wave)
//     }
//   }

//   function animate() {
//     animationId = requestAnimationFrame(animate)
//     time += 0.016

//     scrollY += (targetScrollY - scrollY) * 0.06
//     const scrollNorm = Math.min(scrollY / (document.body.scrollHeight - window.innerHeight), 1)

//     const driftX = Math.sin(time * CONFIG.cameraDriftSpeed * 1000) * CONFIG.cameraDriftRadius
//     const driftY = Math.cos(time * CONFIG.cameraDriftSpeed * 800) * CONFIG.cameraDriftRadius * 0.6
//     const driftZ = Math.sin(time * CONFIG.cameraDriftSpeed * 500) * 25

//     camera.position.x += (driftX + mouseX * 40 - camera.position.x) * 0.015
//     camera.position.y += (driftY - mouseY * 25 - camera.position.y) * 0.015
//     camera.position.z = CONFIG.cameraDistance - scrollNorm * 180 + driftZ
//     camera.lookAt(0, 0, 0)

//     nodes.forEach((node) => {
//       const ud = node.userData
//       const scrollEffect = Math.sin(scrollNorm * Math.PI * 2.5 + ud.phase) * 20

//       node.position.x = ud.originalPos.x + Math.sin(time * ud.speed + ud.phase) * ud.amplitude
//       node.position.y =
//         ud.originalPos.y + Math.cos(time * ud.speed * 0.7 + ud.phase) * ud.amplitude * 0.7 + scrollEffect
//       node.position.z = ud.originalPos.z + Math.sin(time * ud.speed * 0.35 + ud.phase) * 6

//       node.material.uniforms.time.value = time
//     })

//     connections.forEach((conn) => {
//       const start = nodes[conn.userData.startIdx]
//       const end = nodes[conn.userData.endIdx]

//       const positions = conn.geometry.attributes.position.array
//       positions[0] = start.position.x
//       positions[1] = start.position.y
//       positions[2] = start.position.z
//       positions[3] = end.position.x
//       positions[4] = end.position.y
//       positions[5] = end.position.z
//       conn.geometry.attributes.position.needsUpdate = true

//       const pulse = 0.7 + 0.3 * Math.sin(time * 2 + conn.userData.startIdx * 0.08)
//       conn.material.opacity = conn.userData.baseOpacity * pulse * (1 + scrollNorm * 0.6)
//     })

//     if (signals.length > 0 && connections.length > 0) {
//       const positions = signals[0].points.geometry.attributes.position.array

//       signals.forEach((signal) => {
//         signal.progress += signal.speed * signal.direction * (1 + scrollNorm * CONFIG.scrollMultiplier)

//         if (signal.progress >= 1 || signal.progress <= 0) {
//           signal.connection = Math.floor(Math.random() * connections.length)
//           signal.progress = signal.direction > 0 ? 0 : 1
//           signal.direction = Math.random() > 0.5 ? 1 : -1
//         }

//         const conn = connections[signal.connection]
//         if (conn) {
//           const start = nodes[conn.userData.startIdx]
//           const end = nodes[conn.userData.endIdx]

//           positions[signal.index * 3] = start.position.x + (end.position.x - start.position.x) * signal.progress
//           positions[signal.index * 3 + 1] = start.position.y + (end.position.y - start.position.y) * signal.progress
//           positions[signal.index * 3 + 2] = start.position.z + (end.position.z - start.position.z) * signal.progress
//         }
//       })

//       signals[0].points.geometry.attributes.position.needsUpdate = true
//       signals[0].points.material.uniforms.time.value = time
//     }

//     if (particles) {
//       particles.rotation.y = time * 0.02 + scrollNorm * 0.6
//       particles.rotation.x = Math.sin(time * 0.015) * 0.08
//       particles.material.uniforms.time.value = time

//       const positions = particles.geometry.attributes.position.array
//       for (let i = 0; i < CONFIG.particleCount; i++) {
//         positions[i * 3 + 1] += Math.sin(time * 0.4 + i * 0.04) * 0.1
//         positions[i * 3] += Math.cos(time * 0.25 + i * 0.025) * 0.06
//       }
//       particles.geometry.attributes.position.needsUpdate = true
//     }

//     dataStreams.forEach((stream) => {
//       const ud = stream.userData
//       stream.rotation.y = time * ud.speed + ud.offset + scrollNorm * 2.5

//       const positions = stream.geometry.attributes.position.array
//       for (let j = 0; j < CONFIG.streamParticles; j++) {
//         const t = j / CONFIG.streamParticles
//         const yOffset = Math.sin(time * 2 + j * 0.2 + ud.offset) * 10
//         positions[j * 3 + 1] = (t - 0.5) * 400 + yOffset + scrollNorm * 100
//       }
//       stream.geometry.attributes.position.needsUpdate = true
//       stream.material.uniforms.time.value = time
//     })

//     energyWaves.forEach((wave, i) => {
//       const ud = wave.userData
//       const scale = ud.baseScale + Math.sin(time * ud.speed + ud.phase) * 0.35 + scrollNorm * 0.5
//       wave.scale.set(scale, scale, 1)
//       wave.rotation.z = time * 0.1 * (i % 2 === 0 ? 1 : -1)
//       wave.material.opacity = (0.05 - i * 0.012) * (1 + Math.sin(time * 2) * 0.35)
//     })

//     renderer.render(scene, camera)
//   }

//   function onResize() {
//     camera.aspect = window.innerWidth / window.innerHeight
//     camera.updateProjectionMatrix()
//     renderer.setSize(window.innerWidth, window.innerHeight)
//   }

//   function onScroll() {
//     targetScrollY = window.scrollY
//     updateScrollProgress()
//     updateActiveSection()
//   }

//   function onMouseMove(e) {
//     mouseX = (e.clientX / window.innerWidth) * 2 - 1
//     mouseY = (e.clientY / window.innerHeight) * 2 - 1
//   }

//   function updateScrollProgress() {
//     const scrollHeight = document.body.scrollHeight - window.innerHeight
//     const progress = (window.scrollY / scrollHeight) * 100
//     const bar = document.querySelector(".scroll-progress-bar")
//     if (bar) bar.style.width = `${progress}%`
//   }

//   function updateActiveSection() {
//     const sections = document.querySelectorAll(".section")
//     const navLinks = document.querySelectorAll(".nav-link")
//     const dots = document.querySelectorAll(".section-dot")

//     let current = ""

//     sections.forEach((section) => {
//       const rect = section.getBoundingClientRect()
//       if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
//         current = section.id
//       }
//     })

//     navLinks.forEach((link) => {
//       link.classList.remove("active")
//       if (link.dataset.section === current) {
//         link.classList.add("active")
//       }
//     })

//     dots.forEach((dot) => {
//       dot.classList.remove("active")
//       if (dot.dataset.section === current) {
//         dot.classList.add("active")
//       }
//     })
//   }

//   function initNavigation() {
//     const toggle = document.querySelector(".nav-toggle")
//     const links = document.querySelector(".nav-links")

//     if (toggle && links) {
//       toggle.addEventListener("click", () => {
//         links.classList.toggle("open")
//         toggle.classList.toggle("open")
//       })
//     }

//     document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
//       anchor.addEventListener("click", function (e) {
//         e.preventDefault()
//         const target = document.querySelector(this.getAttribute("href"))
//         if (target) {
//           target.scrollIntoView({ behavior: "smooth" })
//           if (links) links.classList.remove("open")
//           if (toggle) toggle.classList.remove("open")
//         }
//       })
//     })
//   }

//   // Initialize when DOM is ready
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", () => {
//       init()
//       initNavigation()
//     })
//   } else {
//     init()
//     initNavigation()
//   }

//   // Cleanup on page unload
//   window.addEventListener("beforeunload", () => {
//     if (animationId) cancelAnimationFrame(animationId)
//     if (renderer) renderer.dispose()
//   })
// })()
