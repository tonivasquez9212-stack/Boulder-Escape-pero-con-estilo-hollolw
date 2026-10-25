import * as THREE from 'three';

/* =====================================================================
   BOULDER ESCAPE – versión "Hollow Knight"
   Personaje: el Caballero con su lámpara · Ambiente: cueva verde con zonas
   iluminadas y oscuras · Obstáculos: erizos de pinchos (conos). Al tocar un
   obstáculo la partida se REINICIA automáticamente (sin pantalla de Game Over).
   ===================================================================== */

/* ===================== CONFIGURACIÓN ===================== */
const ANCHO_CAMINO = 8;
const LIMITE_X = ANCHO_CAMINO / 2 - 0.6;
const LARGO_TRAMO = 40;
const NUM_TRAMOS = 6;
const VELOCIDAD = 10;
const VEL_LATERAL = 9;
const Z_SPAWN = 11;
const Z_DESPAWN = -75;
const LOOP = Z_SPAWN - Z_DESPAWN;             // longitud del "mundo" que se recicla

/* ===================== REQ-01: ESCENA, CÁMARA, LUCES ===================== */
const scene = new THREE.Scene();
const COLOR_AMBIENTE = 0x06130c;
scene.background = new THREE.Color(COLOR_AMBIENTE);
scene.fog = new THREE.Fog(COLOR_AMBIENTE, 22, 78);

// Cámara en perspectiva FRENTE al personaje (z+) mirando hacia él (-Z)
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

// Luz ambiente tenue (las zonas oscuras de la cueva)
scene.add(new THREE.HemisphereLight(0x6fa889, 0x0a1a10, 0.55));

// "Luz de luna" fría y suave con sombras
const luna = new THREE.DirectionalLight(0x9ec4e8, 0.55);
luna.position.set(-8, 14, 8);
luna.castShadow = true;
luna.shadow.mapSize.set(1024, 1024);
Object.assign(luna.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 50 });
scene.add(luna);
scene.add(luna.target);

/* ===================== TEXTURAS ===================== */
const loader = new THREE.TextureLoader();
const texPiedra = loader.load('textures/piedra.png');
texPiedra.colorSpace = THREE.SRGBColorSpace;
const texCamino = loader.load('textures/camino.png');
texCamino.colorSpace = THREE.SRGBColorSpace;
texCamino.wrapS = texCamino.wrapT = THREE.RepeatWrapping;
texCamino.repeat.set(2, 8);

/* ===================== ESCENARIO: CAMINO + CUEVA ===================== */
// El personaje corre hacia +Z (la cámara). El mundo se desplaza hacia -Z.
const tramos = [];
const geoTramo = new THREE.PlaneGeometry(ANCHO_CAMINO, LARGO_TRAMO);
const matTramo = new THREE.MeshStandardMaterial({ map: texCamino, roughness: 1 });
for (let i = 0; i < NUM_TRAMOS; i++) {
  const t = new THREE.Mesh(geoTramo, matTramo);
  t.rotation.x = -Math.PI / 2;
  t.position.z = -i * LARGO_TRAMO + LARGO_TRAMO * 1.5;
  t.receiveShadow = true;
  scene.add(t);
  tramos.push(t);
}

// Suelo de musgo a los lados
const pasto = [];
const geoPasto = new THREE.PlaneGeometry(70, LARGO_TRAMO);
const matPasto = new THREE.MeshStandardMaterial({ color: 0x1d4a26, roughness: 1 });
for (let i = 0; i < NUM_TRAMOS; i++) {
  const p = new THREE.Mesh(geoPasto, matPasto);
  p.rotation.x = -Math.PI / 2;
  p.position.set(0, -0.05, -i * LARGO_TRAMO + LARGO_TRAMO * 1.5);
  p.receiveShadow = true;
  scene.add(p);
  pasto.push(p);
}

// Bordes de piedra del camino
const matBorde = new THREE.MeshStandardMaterial({ color: 0x4a5a4c, roughness: 1 });
for (const lado of [-1, 1]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, LARGO_TRAMO * NUM_TRAMOS), matBorde);
  b.position.set(lado * (ANCHO_CAMINO / 2 + 0.15), 0.1, -LARGO_TRAMO * NUM_TRAMOS / 2 + LARGO_TRAMO * 1.5);
  scene.add(b);
}

// Decoración que se desplaza y se recicla (montículos de musgo, hongos, musgo colgante)
const decoracion = [];
function agregarDeco(obj, x, y, z) {
  obj.position.set(x, y, z);
  scene.add(obj);
  decoracion.push(obj);
}

const geoMontículo = new THREE.IcosahedronGeometry(1, 1);
const matMusgo = new THREE.MeshStandardMaterial({ color: 0x2f7a30, flatShading: true, roughness: 1, emissive: 0x06200a });
const matMusgoClaro = new THREE.MeshStandardMaterial({ color: 0x57a83a, flatShading: true, roughness: 1, emissive: 0x0a2a0a });
const geoTallo = new THREE.CylinderGeometry(0.12, 0.2, 1, 8);
const geoSombrero = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const matSeta = new THREE.MeshStandardMaterial({ color: 0x050d08, roughness: 0.9 });
const geoColgante = new THREE.ConeGeometry(0.7, 1, 7);

function crearMontículo() {
  const m = new THREE.Mesh(geoMontículo, Math.random() < 0.5 ? matMusgo : matMusgoClaro);
  const s = 0.8 + Math.random() * 1.6;
  m.scale.set(s * 1.5, s * 0.8, s * 1.5);
  m.castShadow = true;
  return m;
}
function crearSeta() {
  const g = new THREE.Group();
  const h = 2.5 + Math.random() * 3.5;
  const tallo = new THREE.Mesh(geoTallo, matSeta);
  tallo.scale.set(1, h, 1); tallo.position.y = h / 2;
  const sombrero = new THREE.Mesh(geoSombrero, matSeta);
  const r = 1.0 + Math.random() * 0.9;
  sombrero.scale.set(r, 0.35 * r, r); sombrero.position.y = h;
  g.add(tallo, sombrero);
  return g;
}
function crearColgante() {
  const c = new THREE.Mesh(geoColgante, matMusgoClaro);
  const h = 3 + Math.random() * 4;
  c.scale.set(1, h, 1);
  c.rotation.x = Math.PI;               // punta hacia abajo
  return c;
}
for (let z = Z_SPAWN; z > Z_DESPAWN; z -= 4.5) {
  for (const lado of [-1, 1]) {
    const x = lado * (ANCHO_CAMINO / 2 + 1.5 + Math.random() * 12);
    const r = Math.random();
    if (r < 0.45) agregarDeco(crearMontículo(), x, 0.2, z + Math.random() * 3);
    else if (r < 0.8) agregarDeco(crearSeta(), x, 0, z + Math.random() * 3);
    else agregarDeco(crearColgante(), lado * (3 + Math.random() * 12), 9 + Math.random() * 3, z + Math.random() * 3);
  }
}

// Luciérnagas (puntos brillantes)
const NUM_LUC = 110;
const posLuc = new Float32Array(NUM_LUC * 3);
const faseLuc = [];
for (let i = 0; i < NUM_LUC; i++) {
  posLuc[i * 3] = (Math.random() - 0.5) * 30;
  posLuc[i * 3 + 1] = 0.5 + Math.random() * 6;
  posLuc[i * 3 + 2] = Z_DESPAWN + Math.random() * LOOP;
  faseLuc.push(Math.random() * 6.28);
}
const geoLuc = new THREE.BufferGeometry();
geoLuc.setAttribute('position', new THREE.BufferAttribute(posLuc, 3));
const luciernagas = new THREE.Points(geoLuc, new THREE.PointsMaterial({
  color: 0xc9ff6a, size: 0.22, transparent: true, opacity: 0.9,
  blending: THREE.AdditiveBlending, depthWrite: false, fog: false
}));
scene.add(luciernagas);

/* ===================== ZONAS ILUMINADAS Y ZONAS OSCURAS ===================== */
// Dos "claros" de luz que se desplazan con el mundo; entre ellos el camino queda en penumbra.
const zonasLuz = [];
const geoHaz = new THREE.ConeGeometry(4.8, 11, 28, 1, true);
const matHaz = new THREE.MeshBasicMaterial({
  color: 0xd9ffb0, transparent: true, opacity: 0.07, side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending, depthWrite: false
});
for (let i = 0; i < 2; i++) {
  const luz = new THREE.PointLight(0xd8ffb0, 180, 26, 2);
  const haz = new THREE.Mesh(geoHaz, matHaz);
  const z0 = 2 - i * (LOOP / 2);
  luz.position.set(0, 7, z0);
  haz.position.set(0, 5.5, z0);
  scene.add(luz, haz);
  zonasLuz.push({ luz, haz });
}

/* ===================== RF02: PERSONAJE – EL CABALLERO (geometrías básicas) ===================== */
const personaje = new THREE.Group();
const matMascara = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, emissive: 0x8a8a82, emissiveIntensity: 0.55 });
const matNegroCuerpo = new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.8 });
const matCapa = new THREE.MeshStandardMaterial({ color: 0x8a9cf0, roughness: 0.7, flatShading: true, side: THREE.DoubleSide, emissive: 0x2a3470, emissiveIntensity: 0.6 });
const matOjo = new THREE.MeshBasicMaterial({ color: 0x020202 });

// Cabeza grande (máscara blanca)
const cabeza = new THREE.Group();
cabeza.position.y = 1.95;
const craneo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 22), matMascara);
craneo.scale.set(1.08, 0.95, 0.92);
cabeza.add(craneo);
for (const s of [-1, 1]) {
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), matOjo);
  ojo.scale.set(0.85, 1.25, 0.45);
  ojo.position.set(s * 0.25, 0.02, 0.5);
  cabeza.add(ojo);
  // Cuernos curvos (tubos a lo largo de una curva)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.28, 0.45, 0),
    new THREE.Vector3(s * 0.52, 0.8, 0),
    new THREE.Vector3(s * 0.7, 1.2, 0),
    new THREE.Vector3(s * 0.62, 1.55, 0)
  ]);
  const cuerno = new THREE.Mesh(new THREE.TubeGeometry(curva, 20, 0.12, 10, false), matMascara);
  const punta = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), matMascara);
  punta.position.set(s * 0.62, 1.55, 0);
  cabeza.add(cuerno, punta);
}
// Cuerpo, capa, piernas y brazos
const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.7, 10), matNegroCuerpo);
cuerpo.position.y = 1.05;
const capa = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 0.95, 9, 1, true), matCapa);
capa.position.y = 0.92;
function extremidad(radio, largo, mat, x, y) {
  const piv = new THREE.Group();
  piv.position.set(x, y, 0);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio * 0.8, largo, 8), mat);
  m.position.y = -largo / 2;
  piv.add(m);
  return piv;
}
const piernaI = extremidad(0.1, 0.6, matNegroCuerpo, -0.17, 0.6);
const piernaD = extremidad(0.1, 0.6, matNegroCuerpo, 0.17, 0.6);
const brazoI = extremidad(0.075, 0.55, matNegroCuerpo, -0.36, 1.3);
const brazoD = extremidad(0.075, 0.55, matNegroCuerpo, 0.36, 1.3);
brazoD.rotation.x = -1.3;                      // brazo derecho extendido sosteniendo la lámpara
personaje.add(cabeza, cuerpo, capa, piernaI, piernaD, brazoI, brazoD);

// Lámpara colgante con luz propia (siempre ilumina un poco al caballero)
const lampara = new THREE.Group();
lampara.position.set(0.4, 1.12, 0.55);
const matCristal = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffc860, emissiveIntensity: 2.4 });
const matMetal = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.6 });
const cadena = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), matMetal);
cadena.position.y = -0.15;
const tapa = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.14, 6), matMetal);
tapa.position.y = -0.37;
const cristal = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 8), matCristal);
cristal.position.y = -0.55;
const baseLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.06, 8), matMetal);
baseLamp.position.y = -0.72;
const luzLampara = new THREE.PointLight(0xffd98a, 38, 22, 2);
luzLampara.position.set(0, -0.5, 0.15);
lampara.add(cadena, tapa, cristal, baseLamp, luzLampara);
personaje.add(lampara);

personaje.traverse(o => { if (o.isMesh) o.castShadow = true; });
personaje.position.set(0, 0, 0);               // centro del camino
scene.add(personaje);

/* ===================== RF03: ROCA GIGANTE ===================== */
const RADIO_ROCA = 2.6;
const roca = new THREE.Mesh(
  new THREE.SphereGeometry(RADIO_ROCA, 48, 32),
  new THREE.MeshStandardMaterial({ map: texPiedra, color: 0xeef0e4, roughness: 0.95, emissive: 0x1a1d16, bumpMap: texPiedra, bumpScale: 2 })
);
roca.castShadow = true;
roca.position.set(0, RADIO_ROCA, -6);          // detrás del personaje, visible para la cámara
scene.add(roca);

/* ===================== RF04: OBSTÁCULOS PUNTIAGUDOS ===================== */
// Erizo: esfera negra + muchos CONOS radiales (punta clara, base oscura)
const geoPua = new THREE.ConeGeometry(0.09, 0.95, 5);
{
  const pos = geoPua.attributes.position;
  const col = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + 0.475) / 0.95;                 // 0 base … 1 punta
    const k = THREE.MathUtils.smoothstep(t, 0.55, 1.0);
    c.setRGB(0.03 + 0.85 * k, 0.03 + 0.9 * k, 0.06 + 0.95 * k);
    col.push(c.r, c.g, c.b);
  }
  geoPua.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}
const matPua = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: 0x0c1830 });
const matNucleo = new THREE.MeshStandardMaterial({ color: 0x08080f, roughness: 0.6 });
const geoNucleo = new THREE.SphereGeometry(0.45, 14, 12);
const PUNTOS_ERIZO = 30;
const dirsErizo = [];
for (let i = 0; i < PUNTOS_ERIZO; i++) {                   // distribución uniforme (espiral de Fibonacci)
  const y = 1 - (i / (PUNTOS_ERIZO - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  dirsErizo.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
}
function crearErizo() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geoNucleo, matNucleo));
  const arriba = new THREE.Vector3(0, 1, 0);
  for (const d of dirsErizo) {
    const p = new THREE.Mesh(geoPua, matPua);
    p.position.copy(d).multiplyScalar(0.32 + 0.475);
    p.quaternion.setFromUnitVectors(arriba, d);
    g.add(p);
  }
  g.scale.setScalar(0.85);
  g.position.y = 0.95;
  g.userData = { radio: 1.1, gira: 0.6 + Math.random() * 0.8 };
  return g;
}
// Estalagmita (cono alto) y pirámide triangular
const matEstal = new THREE.MeshStandardMaterial({ color: 0x1f3a2c, flatShading: true, roughness: 0.9, emissive: 0x04110a });
const matPira = new THREE.MeshStandardMaterial({ color: 0x2c4b4f, flatShading: true, roughness: 0.8, emissive: 0x06141a });
function crearEstalagmita() {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 7), matEstal);
  m.position.y = 1.3; m.castShadow = true;
  m.userData = { radio: 0.6, gira: 0 };
  return m;
}
function crearPiramide() {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.7, 3), matPira);
  m.position.y = 0.85; m.castShadow = true;
  m.userData = { radio: 0.8, gira: 0 };
  return m;
}
const obstaculos = [];
function crearObstaculo(z) {
  const r = Math.random();
  const o = r < 0.6 ? crearErizo() : (r < 0.8 ? crearEstalagmita() : crearPiramide());
  o.position.z = z;
  scene.add(o);
  obstaculos.push(o);
  return o;
}

// Cada fila deja al menos 1 de 3 carriles libre → siempre se puede esquivar
const SEPARACION_FILAS = 14;
const CARRILES = [-2.6, 0, 2.6];
let zSiguienteFila = Z_SPAWN;
function generarFila(z) {
  const cuantos = Math.random() < 0.5 ? 1 : 2;
  const libres = [0, 1, 2].sort(() => Math.random() - 0.5);
  for (let k = 0; k < cuantos; k++) {
    const o = crearObstaculo(z);
    o.position.x = CARRILES[libres[k]] + (Math.random() - 0.5) * 0.8;
  }
}
generarFila(Z_SPAWN - 3);

/* ===================== RF05: TECLADO ===================== */
const teclas = { izq: false, der: false };
addEventListener('keydown', e => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') teclas.izq = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') teclas.der = true;
});
addEventListener('keyup', e => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') teclas.izq = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') teclas.der = false;
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ===================== BUCLE DE ANIMACIÓN ===================== */
const reloj = new THREE.Clock();
const hudDist = document.getElementById('dist');
const hudPinchos = document.getElementById('pinchos');
let distancia = 0, t = 0, intentos = 1, invulnerable = 0, mejor = 0;

// Colisión = fin de la partida → se reinicia al instante (sin pantalla de Game Over)
function reiniciarPartida() {
  mejor = Math.max(mejor, Math.floor(distancia));
  intentos++;
  distancia = 0;
  obstaculos.forEach(o => scene.remove(o));
  obstaculos.length = 0;
  zSiguienteFila = Z_SPAWN;
  generarFila(Z_SPAWN - 3);
  personaje.position.x = 0;
  invulnerable = 0.9;                      // breve parpadeo para ubicarse
}

function animar() {
  requestAnimationFrame(animar);
  const dt = Math.min(reloj.getDelta(), 0.05);
  t += dt;

  // --- Movimiento lateral (A/D o flechas). La cámara mira a -Z: derecha de pantalla = +X ---
  let dir = 0;
  if (teclas.izq) dir -= 1;
  if (teclas.der) dir += 1;
  personaje.position.x += dir * VEL_LATERAL * dt;
  personaje.position.x = THREE.MathUtils.clamp(personaje.position.x, -LIMITE_X, LIMITE_X);
  personaje.rotation.z = THREE.MathUtils.lerp(personaje.rotation.z, -dir * 0.15, 0.15);

  // --- Animación de carrera ---
  const sw = Math.sin(t * 12) * 0.9;
  piernaI.rotation.x = sw; piernaD.rotation.x = -sw;
  brazoI.rotation.x = -sw;
  brazoD.rotation.x = -1.3 + Math.sin(t * 12) * 0.12;
  lampara.rotation.z = Math.sin(t * 6) * 0.1;
  personaje.position.y = Math.abs(Math.sin(t * 12)) * 0.12;
  capa.scale.y = 1 + Math.sin(t * 12) * 0.04;

  // --- Carrera automática: el entorno se mueve hacia atrás (movimiento relativo) ---
  const avance = VELOCIDAD * dt;
  distancia += avance;
  const wrapTramo = s => { s.position.z -= avance; if (s.position.z < -LARGO_TRAMO * (NUM_TRAMOS - 2.5)) s.position.z += LARGO_TRAMO * NUM_TRAMOS; };
  tramos.forEach(wrapTramo);
  pasto.forEach(wrapTramo);
  decoracion.forEach(d => { d.position.z -= avance; if (d.position.z < Z_DESPAWN) d.position.z += LOOP; });

  // Zonas de luz que pasan: claro → penumbra → claro
  zonasLuz.forEach(zn => {
    zn.luz.position.z -= avance; zn.haz.position.z -= avance;
    if (zn.luz.position.z < Z_DESPAWN + 15) { zn.luz.position.z += LOOP; zn.haz.position.z += LOOP; }
    const parpadeo = 1 + Math.sin(t * 2 + zn.luz.position.z) * 0.05;
    zn.luz.intensity = 180 * parpadeo;
  });

  // Luciérnagas
  for (let i = 0; i < NUM_LUC; i++) {
    posLuc[i * 3 + 2] -= avance;
    if (posLuc[i * 3 + 2] < Z_DESPAWN) posLuc[i * 3 + 2] += LOOP;
    posLuc[i * 3 + 1] += Math.sin(t * 1.5 + faseLuc[i]) * 0.004;
  }
  geoLuc.attributes.position.needsUpdate = true;

  // --- Obstáculos: mover, reciclar y generar nuevos continuamente ---
  invulnerable = Math.max(0, invulnerable - dt);
  let choco = false;
  for (let i = obstaculos.length - 1; i >= 0; i--) {
    const o = obstaculos[i];
    o.position.z -= avance;
    if (o.userData.gira) o.rotation.y += o.userData.gira * dt;
    const k = THREE.MathUtils.clamp((o.position.z + 5) / 3, 0, 1);   // se "aplastan" al llegar a la roca
    o.scale.y = (o.userData.gira ? 0.85 : 1) * k;
    if (o.position.z < -5) { scene.remove(o); obstaculos.splice(i, 1); continue; }
    // Colisión con el personaje → reinicio
    const dx = o.position.x - personaje.position.x, dz = o.position.z - personaje.position.z;
    if (invulnerable === 0 && Math.hypot(dx, dz) < o.userData.radio + 0.35) choco = true;
  }
  if (choco) reiniciarPartida();
  personaje.visible = invulnerable === 0 || Math.floor(t * 18) % 2 === 0;
  zSiguienteFila -= avance;
  if (zSiguienteFila <= Z_SPAWN - SEPARACION_FILAS) {
    zSiguienteFila += SEPARACION_FILAS;
    generarFila(Z_SPAWN);
  }

  // --- Roca: rotación continua (rueda hacia el personaje) + vaivén ---
  roca.rotation.x += (VELOCIDAD / RADIO_ROCA) * dt;
  roca.position.x = Math.sin(t * 1.3) * 0.5;
  roca.position.y = RADIO_ROCA + Math.abs(Math.sin(t * 6)) * 0.08;
  roca.position.z = -6 + Math.sin(t * 2) * 0.5;

  // --- Cámara frontal que sigue al personaje ---
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, personaje.position.x * 0.6, 0.08);
  camera.lookAt(personaje.position.x * 0.8, 1.2, -2);

  hudDist.textContent = 'Distancia: ' + Math.floor(distancia) + ' m';
  hudPinchos.textContent = 'Intento: ' + intentos + ' · Mejor: ' + mejor + ' m';
  renderer.render(scene, camera);
}
animar();
