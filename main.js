import * as THREE from 'three';
import { cards, site } from './content.js';

/* ---------- teks halaman ---------- */
document.getElementById('brand').textContent = site.title;
document.getElementById('hint').textContent = site.hint;
document.title = site.title;

/* ---------- WebGL2 ---------- */
const canvas = document.getElementById('stage');
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
if (!gl) { document.getElementById('fallback').hidden = false; throw new Error('WebGL2 tidak tersedia'); }

const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
renderer.autoClear = false;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- konstanta ---------- */
const CW = 2.4, CH = 3.4, RAD = 0.14;     // ukuran kartu (unit dunia)
const TW = 800, TH = 1133;                // ukuran tekstur kartu
const FOV = 38;
const MIN_SLOTS = 6;                      // kartu diulang agar ring terisi
const reps = Math.ceil(MIN_SLOTS / cards.length);
const N = cards.length * reps;
const STEP = Math.PI * 2 / N;
const R = Math.max(4.2, (CW * 1.15) / (2 * Math.sin(STEP / 2)));

/* ---------- scene ---------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
const bgScene = new THREE.Scene();
const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ---------- latar kertas sketsa ---------- */
const bgMat = new THREE.ShaderMaterial({
  depthTest: false, depthWrite: false,
  uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uShift: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: `
    uniform vec2 uRes, uMouse; uniform float uTime, uShift; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    void main(){
      vec2 uv = vUv;
      vec2 p = (uv - .5) * uRes / min(uRes.x, uRes.y);
      p += uMouse * .03 + vec2(uShift * .02, 0.);
      vec3 col = vec3(.985, .978, .955);
      col -= h(floor(gl_FragCoord.xy)) * .022;                 // butir kertas
      col -= n(p * vec2(220., 14.)) * .012;                    // serat
      float y = p.y * 9. + n(p * vec2(2.5, 1.) + 3.) * .7;     // garis pensil bergoyang
      float l = smoothstep(.465, .5, abs(fract(y) - .5));
      l *= smoothstep(.3, .65, n(vec2(p.x * 3., floor(y) * 5.7)));
      col -= l * vec3(.05, .05, .035);
      float hd = abs(fract((p.x + p.y) * 38. + n(p * 6.) * .8) - .5);   // arsiran di pojok
      float corner = smoothstep(.62, 1.15, length(uv - .5) * 1.5);
      col -= smoothstep(.40, .5, hd) * corner * .14 * smoothstep(.2, .7, n(p * 9.));
      gl_FragColor = vec4(col, 1.);
    }`
});
bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

/* ---------- tekstur kartu (digambar bergaya sketsa) ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function roughLine(c, x1, y1, x2, y2, r, j = 2.4) {
  const len = Math.hypot(x2 - x1, y2 - y1), seg = Math.max(2, Math.round(len / 55));
  c.beginPath(); c.moveTo(x1 + (r() - .5) * j, y1 + (r() - .5) * j);
  for (let i = 1; i <= seg; i++) { const t = i / seg; c.lineTo(x1 + (x2 - x1) * t + (r() - .5) * j * 1.6, y1 + (y2 - y1) * t + (r() - .5) * j * 1.6); }
  c.stroke();
}
function roughRect(c, x, y, w, h, r, passes = 2) {
  for (let p = 0; p < passes; p++) {
    const o = () => r() * 7;
    roughLine(c, x - o(), y + (r() - .5) * 3, x + w + o(), y + (r() - .5) * 3, r);
    roughLine(c, x + w + (r() - .5) * 3, y - o(), x + w + (r() - .5) * 3, y + h + o(), r);
    roughLine(c, x + w + o(), y + h + (r() - .5) * 3, x - o(), y + h + (r() - .5) * 3, r);
    roughLine(c, x + (r() - .5) * 3, y + h + o(), x + (r() - .5) * 3, y - o(), r);
  }
}
function hatch(c, x, y, w, h, gap, r) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (let k = -h; k < w; k += gap) roughLine(c, x + k, y + h, x + k + h, y, r, 1.4);
  c.restore();
}
function paper(c, r) {
  c.fillStyle = '#fffdf8'; c.fillRect(0, 0, TW, TH);
  c.fillStyle = 'rgba(120,110,90,.06)';
  for (let i = 0; i < 900; i++) c.fillRect(r() * TW, r() * TH, 1 + r() * 2, 1 + r() * 2);
}
const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
const FONT_H = '"Caveat","Segoe Print","Bradley Hand","Comic Sans MS",cursive';
const FONT_B = '"Patrick Hand","Segoe Print","Comic Sans MS",cursive';

function wrap(c, text, maxW, maxLines) {
  const words = text.split(/\s+/), lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
  return lines;
}

function drawFront(item, img, seed) {
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const c = cv.getContext('2d'), r = rng(seed);
  paper(c, r);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#2a2a2a';
  c.lineWidth = 3.4; roughRect(c, 30, 30, TW - 60, TH - 60, r);

  // nama
  let fs = 84; c.fillStyle = '#1e1e1e'; c.textBaseline = 'alphabetic';
  do { c.font = `700 ${fs}px ${FONT_H}`; fs -= 3; } while (c.measureText(item.name).width > 672 && fs > 30);
  c.fillText(item.name, 64, 126);
  const nw = Math.min(c.measureText(item.name).width, 672);
  c.lineWidth = 3; c.strokeStyle = '#ff8f6b';
  roughLine(c, 62, 146, 62 + nw, 144, r, 3); roughLine(c, 70, 154, 62 + nw * .8, 152, r, 3);

  // foto
  const px = 64, py = 182, pw = 672, ph = 470;
  c.strokeStyle = 'rgba(40,40,40,.35)'; c.lineWidth = 2; hatch(c, px + 12, py + ph, pw, 14, 9, r); hatch(c, px + pw, py + 12, 14, ph, 9, r);
  c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
  if (img) {
    const s = Math.max(pw / img.width, ph / img.height), dw = img.width * s, dh = img.height * s;
    c.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  } else { c.fillStyle = '#eee'; c.fillRect(px, py, pw, ph); c.strokeStyle = '#999'; roughLine(c, px, py, px + pw, py + ph, r); roughLine(c, px + pw, py, px, py + ph, r); }
  c.restore();
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 3.6; roughRect(c, px, py, pw, ph, r, 2);

  // keterangan
  c.fillStyle = '#3b3b3b'; c.font = `400 40px ${FONT_B}`;
  wrap(c, item.description, 672, 6).forEach((ln, i) => c.fillText(ln, 64, 725 + i * 50));

  // tombol link
  const bx = 64, by = 985, bw = 672, bh = 88;
  c.strokeStyle = 'rgba(255,143,107,.55)'; c.lineWidth = 2.4; hatch(c, bx, by, bw, bh, 12, r);
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 3.6; roughRect(c, bx, by, bw, bh, r, 2);
  c.fillStyle = '#1e1e1e'; c.font = `700 46px ${FONT_H}`; c.textBaseline = 'middle';
  c.fillText('Buka di Threads ↗', bx + 26, by + bh / 2 + 2);
  const m = item.threads.match(/@([\w.]+)/);
  if (m) { c.font = `400 34px ${FONT_B}`; c.fillStyle = '#444'; c.textAlign = 'right'; c.fillText('@' + m[1], bx + bw - 26, by + bh / 2 + 2); c.textAlign = 'left'; }
  return cv;
}

function drawBack(seed) {
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const c = cv.getContext('2d'), r = rng(seed);
  paper(c, r);
  c.lineCap = 'round'; c.strokeStyle = 'rgba(40,40,40,.12)'; c.lineWidth = 2; hatch(c, 30, 30, TW - 60, TH - 60, 16, r);
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 3.4; roughRect(c, 30, 30, TW - 60, TH - 60, r);
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 3.2; c.beginPath();
  for (let t = 0; t < 22; t += .08) { const rr = 9 * t; const x = TW / 2 + Math.cos(t) * rr + (r() - .5) * 1.5, y = TH / 2 + Math.sin(t) * rr + (r() - .5) * 1.5; t ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
  c.save(); c.translate(TW / 2, TH - 170); c.rotate(-.1); c.fillStyle = '#1e1e1e'; c.font = `700 76px ${FONT_H}`; c.textAlign = 'center'; c.fillText(site.title, 0, 0); c.restore();
  return cv;
}

/* ---------- bentuk kartu ---------- */
function roundedShape(w, h, rad) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + rad, y); s.lineTo(x + w - rad, y); s.quadraticCurveTo(x + w, y, x + w, y + rad);
  s.lineTo(x + w, y + h - rad); s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  s.lineTo(x + rad, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rad);
  s.lineTo(x, y + rad); s.quadraticCurveTo(x, y, x + rad, y); return s;
}
const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(CW, CH, RAD), { depth: 0.06, bevelEnabled: false, curveSegments: 8 });
bodyGeo.translate(0, 0, -0.03);
const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 30);
const faceGeo = new THREE.PlaneGeometry(CW, CH);
const bodyMat = new THREE.MeshBasicMaterial({ color: 0xf1ede3 });
const edgeMat = new THREE.LineBasicMaterial({ color: 0x2a2a2a, transparent: true, opacity: .8 });

function faceMaterial(tex) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uBlur: { value: new THREE.Vector2() }, uFade: { value: 0 }, uSize: { value: new THREE.Vector2(CW, CH) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform vec2 uBlur, uSize; uniform float uFade; varying vec2 vUv;
      void main(){
        vec2 p = (vUv - .5) * uSize; vec2 q = abs(p) - uSize * .5 + ${RAD.toFixed(3)};
        if (length(max(q, 0.)) + min(max(q.x, q.y), 0.) - ${RAD.toFixed(3)} > 0.) discard;
        vec4 acc = vec4(0.); float tw = 0.;
        for (int i = -4; i <= 4; i++) { float w = exp(-float(i * i) / 8.); acc += texture2D(uMap, vUv + uBlur * float(i) / 4.) * w; tw += w; }
        vec3 col = mix(acc.rgb / tw, vec3(.98, .973, .953), uFade);
        gl_FragColor = vec4(col, 1.);
      }`
  });
}

/* ---------- bangun carousel ---------- */
const aniso = renderer.capabilities.getMaxAnisotropy();
function toTex(cv) { const t = new THREE.CanvasTexture(cv); t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }

const ring = new THREE.Group(); scene.add(ring);
const groups = [];

async function build() {
  await Promise.race([
    Promise.all([document.fonts.load('700 60px Caveat'), document.fonts.load('40px "Patrick Hand"')]),
    new Promise(r => setTimeout(r, 2500))
  ]).catch(() => {});
  const imgs = await Promise.all(cards.map(c => loadImg(c.photo)));
  const front = cards.map((c, i) => toTex(drawFront(c, imgs[i], 11 + i * 7)));
  const back = toTex(drawBack(99));
  for (let k = 0; k < N; k++) {
    const idx = k % cards.length;
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    const edges = new THREE.LineSegments(edgeGeo, edgeMat); edges.raycast = () => {};
    const f = new THREE.Mesh(faceGeo, faceMaterial(front[idx])); f.position.z = 0.032;
    const b = new THREE.Mesh(faceGeo, faceMaterial(back)); b.position.z = -0.032; b.rotation.y = Math.PI;
    g.add(body, edges, f, b);
    g.userData = { slot: k, idx, mats: [f.material, b.material], hover: 0 };
    ring.add(g); groups.push(g);
  }
}

/* ---------- asap ---------- */
const SN = 110, sp = new Float32Array(SN * 3), sSeed = new Float32Array(SN), sPhase = new Float32Array(SN);
for (let i = 0; i < SN; i++) {
  sp[i * 3] = (Math.random() - .5) * 18; sp[i * 3 + 1] = 0; sp[i * 3 + 2] = -R * 2 + Math.random() * (R * 2 + 2.5);
  sSeed[i] = Math.random(); sPhase[i] = Math.random();
}
const smokeGeo = new THREE.BufferGeometry();
smokeGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
smokeGeo.setAttribute('aPhase', new THREE.BufferAttribute(sPhase, 1));
const smokeMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uTime: { value: 0 }, uShift: { value: 0 }, uScale: { value: 500 } },
  vertexShader: `
    attribute float aSeed; attribute float aPhase; uniform float uTime, uShift, uScale; varying float vA;
    void main(){
      vec3 p = position;
      float life = fract(aPhase + uTime * (.016 + aSeed * .018));
      p.y = -2.8 + life * 6.4;
      p.x += sin(uTime * .22 + aSeed * 20.) * .9 + life * (aSeed - .5) * 2.4 - uShift;
      p.x = mod(p.x + 10., 20.) - 10.;
      vA = smoothstep(0., .22, life) * smoothstep(1., .5, life);
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_PointSize = (3.4 + aSeed * 4.6 + life * 3.2) * uScale / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying float vA; uniform float uTime;
    void main(){
      vec2 c = gl_PointCoord - .5; float d = length(c);
      d += sin(c.x * 9. + uTime * .3) * sin(c.y * 8. - uTime * .2) * .09;
      float a = smoothstep(.5, 0., d);
      gl_FragColor = vec4(vec3(.56, .56, .59), a * a * vA * .24);
    }`
});
const smoke = new THREE.Points(smokeGeo, smokeMat); smoke.frustumCulled = false; scene.add(smoke);

/* ---------- ukuran layar ---------- */
let dist = 8;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  dist = Math.max(8, (CW * 1.4) / (2 * t * camera.aspect), (CH * 1.4) / (2 * t));
  camera.updateProjectionMatrix();
  bgMat.uniforms.uRes.value.set(w, h);
  smokeMat.uniforms.uScale.value = renderer.domElement.height / (2 * t);
}
addEventListener('resize', resize); resize();

/* ---------- input ---------- */
const state = { cur: reduce ? 0 : -3.2, target: 0, rate: 2.6 };
const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const hintEl = document.getElementById('hint');
let drag = null, vel = 0, lastMoveT = 0, wheelLock = 0, hovered = null;

const wrapSlot = d => ((d % N) + N + N / 2) % N - N / 2;
function pick(ev) {
  ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(groups, true)[0];
  if (!hit) return null;
  let o = hit.object; while (o && !o.userData.mats) o = o.parent;
  return o;
}
const dragK = () => 1 / (Math.min(innerWidth, 900) * 0.3);

canvas.addEventListener('pointerdown', e => {
  if (drag) return;
  canvas.setPointerCapture(e.pointerId);
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), start: state.target, moved: 0, lastX: e.clientX };
  state.rate = 18; vel = 0; hintEl.classList.add('gone');
});
canvas.addEventListener('pointermove', e => {
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (drag && e.pointerId === drag.id) {
    const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.hypot(dx, e.clientY - drag.y));
    const prev = state.target; state.target = drag.start - dx * dragK();
    const now = performance.now(), dt = Math.max((now - lastMoveT) / 1000, 0.008); lastMoveT = now;
    vel += ((state.target - prev) / dt - vel) * 0.4;
  } else if (e.pointerType === 'mouse') {
    const g = pick(e); hovered = g; canvas.style.cursor = g ? 'pointer' : 'grab';
  }
});
function release(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  if (d.moved < 8 && performance.now() - d.t < 600) {            // ketukan
    const g = pick(e);
    if (g) {
      const off = wrapSlot(g.userData.slot - state.cur);
      if (Math.abs(off) < 0.4) window.open(cards[g.userData.idx].threads, '_blank', 'noopener');
      else { state.target = Math.round(state.cur + off); state.rate = 5.5; }
    } else { state.target = Math.round(state.target); state.rate = 5.5; }
    return;
  }
  if (performance.now() - lastMoveT > 120) vel = 0;
  const base = state.target + THREE.MathUtils.clamp(vel * 0.22, -2.5, 2.5);
  state.target = Math.round(base); state.rate = 5.5;
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('wheel', e => {
  e.preventDefault(); hintEl.classList.add('gone');
  const now = performance.now(); if (now < wheelLock) return;
  const dlt = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (Math.abs(dlt) < 4) return;
  state.target = Math.round(state.target) + Math.sign(dlt); state.rate = 5.5; wheelLock = now + 380;
}, { passive: false });
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { state.target = Math.round(state.target) + 1; state.rate = 5.5; }
  if (e.key === 'ArrowLeft') { state.target = Math.round(state.target) - 1; state.rate = 5.5; }
});

/* ---------- loop ---------- */
const clock = new THREE.Clock();
const sstep = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  const prev = state.cur;
  state.cur += (state.target - state.cur) * (1 - Math.exp(-state.rate * dt));
  if (state.rate < 5 && Math.abs(state.target - state.cur) < 0.04) state.rate = 5.5;
  const speed = dt > 0 ? Math.abs(state.cur - prev) / dt : 0;
  const motionBlur = Math.min(speed * 0.0065, 0.04);

  mouseS.lerp(mouse, 1 - Math.exp(-4 * dt));
  camera.position.set(mouseS.x * 0.35, 0.25 + mouseS.y * 0.2, dist);
  camera.lookAt(0, 0, -R * 0.15);

  for (const g of groups) {
    const a = (g.userData.slot - state.cur) * STEP;
    const c = Math.cos(a), away = (1 - c) / 2;
    const frontness = sstep(0.8, 1, c);
    const bob = reduce ? 0 : Math.sin(time * 0.9 + g.userData.slot * 1.7) * 0.06;
    g.position.set(Math.sin(a) * R, bob, c * R - R);
    g.rotation.set(0, a, reduce ? 0 : Math.sin(time * 0.6 + g.userData.slot) * 0.015);
    g.rotation.x = -mouseS.y * 0.12 * frontness;
    g.rotation.y += mouseS.x * 0.18 * frontness;
    const hv = (hovered === g && frontness > 0.5) ? 1 : 0;
    g.userData.hover += (hv - g.userData.hover) * (1 - Math.exp(-8 * dt));
    g.scale.setScalar(1 + g.userData.hover * 0.04);
    const depthBlur = away * 0.012;
    const bx = Math.max(motionBlur, depthBlur), by = depthBlur * 0.6;
    for (const m of g.userData.mats) { m.uniforms.uBlur.value.set(bx, by); m.uniforms.uFade.value = Math.pow(away, 1.2) * 0.8; }
  }

  smokeMat.uniforms.uTime.value = time;
  smokeMat.uniforms.uShift.value = state.cur * 1.8;
  bgMat.uniforms.uTime.value = time;
  bgMat.uniforms.uMouse.value.copy(mouseS);
  bgMat.uniforms.uShift.value = state.cur;

  renderer.clear();
  renderer.render(bgScene, bgCam);
  renderer.clearDepth();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

build().then(() => requestAnimationFrame(frame));
