import * as THREE from "three";

const canvas = document.querySelector("#webgl");
const stage = document.querySelector(".visual-stage");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer, scene, camera, core, ringGroup, particles, animationId;
let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
let isVisible = true;

function makeScene() {
  if (!canvas || !stage) return;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    console.warn("WebGL is unavailable in this browser.", error);
    stage.classList.add("webgl-unavailable");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, stage.clientWidth / stage.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.IcosahedronGeometry(1.48, 5);
  const position = geometry.attributes.position;
  const basePositions = position.array.slice();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x5f8dff, metalness: 0.62, roughness: 0.22,
    transmission: 0.12, thickness: 0.8, clearcoat: 1, clearcoatRoughness: 0.15,
    wireframe: false
  });
  core = new THREE.Mesh(geometry, material);
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.53, 2),
    new THREE.MeshBasicMaterial({ color: 0x9ffcf0, wireframe: true, transparent: true, opacity: 0.17 })
  );
  group.add(wire);

  ringGroup = new THREE.Group();
  group.add(ringGroup);
  const ringSpecs = [
    { radius: 2.0, tube: 0.012, color: 0x7cf0e3, tilt: [1.05, 0.2, 0.25] },
    { radius: 2.25, tube: 0.008, color: 0x719aff, tilt: [0.35, 1.0, -0.55] },
    { radius: 1.82, tube: 0.006, color: 0xffffff, tilt: [1.5, 0.7, 0.9] }
  ];
  ringSpecs.forEach(spec => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 8, 220),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.62 })
    );
    ring.rotation.set(...spec.tilt);
    ringGroup.add(ring);
  });

  const particleCount = 950;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const radius = 2.4 + Math.random() * 2.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    color: 0x9bbcff, size: 0.014, transparent: true, opacity: 0.72, sizeAttenuation: true
  }));
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0x9abaff, 1.25));
  const keyLight = new THREE.PointLight(0x8deee4, 30, 15);
  keyLight.position.set(3, 3, 4);
  scene.add(keyLight);
  const blueLight = new THREE.PointLight(0x537bff, 24, 14);
  blueLight.position.set(-4, -2, 2);
  scene.add(blueLight);

  const resize = () => {
    if (!renderer || !camera) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  new ResizeObserver(resize).observe(stage);

  stage.addEventListener("pointermove", event => {
    const rect = stage.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 1.4;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 1.0;
  });
  stage.addEventListener("pointerleave", () => { targetX = 0; targetY = 0; });

  const visibilityObserver = new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting;
    if (isVisible && !animationId) animate();
  });
  visibilityObserver.observe(stage);

  // Keep the scene lightweight when the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
      animationId = null;
    } else if (isVisible && !animationId) animate();
  });

  animate();
  animatePage();
}

function animate() {
  if (!renderer || !isVisible || document.hidden) {
    animationId = null;
    return;
  }
  animationId = requestAnimationFrame(animate);
  const time = performance.now() * 0.00035;

  pointerX += (targetX - pointerX) * 0.035;
  pointerY += (targetY - pointerY) * 0.035;

  core.rotation.y = time * 1.4 + pointerX * 0.25;
  core.rotation.x = Math.sin(time * 1.1) * 0.16 + pointerY * 0.18;
  core.scale.setScalar(1 + Math.sin(time * 2.4) * 0.018);
  ringGroup.rotation.y = -time * 0.65;
  ringGroup.rotation.z = time * 0.24;
  particles.rotation.y = time * 0.08;
  particles.rotation.x = Math.sin(time) * 0.04;

  camera.position.x += (pointerX * 0.22 - camera.position.x) * 0.025;
  camera.position.y += (-pointerY * 0.18 - camera.position.y) * 0.025;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

function animatePage() {
  if (reduceMotion || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(".site-header", { y: -25, opacity: 0, duration: 0.8, ease: "power3.out" });
  gsap.from(".hero-copy > *", { y: 35, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.15 });
  gsap.from(".visual-stage", { scale: 0.88, opacity: 0, duration: 1.3, ease: "power3.out", delay: 0.2 });
  gsap.utils.toArray(".section-kicker, .section-title, .about-content, .about-stats, .skill-card, .project-row").forEach((element) => {
    gsap.from(element, {
      y: 34, opacity: 0, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: element, start: "top 88%", once: true }
    });
  });
  gsap.to(".contact-orb", {
    y: -45, scale: 1.12, ease: "none",
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: 1 }
  });
}

const glow = document.querySelector(".cursor-glow");
if (glow && matchMedia("(pointer:fine)").matches && !reduceMotion) {
  window.addEventListener("pointermove", event => {
    glow.animate(
      { left: `${event.clientX}px`, top: `${event.clientY}px` },
      { duration: 650, fill: "forwards", easing: "ease-out" }
    );
  }, { passive: true });
}

makeScene();
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(animationId);
  renderer?.dispose();
});
