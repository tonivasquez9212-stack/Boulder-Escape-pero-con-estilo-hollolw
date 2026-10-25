# Boulder Escape – Videojuego 3D con Three.js (tema Hollow Knight)

Evaluación T2 – Computación Gráfica y Visual (Unidad II, Semana 10).
Un personaje corre automáticamente por un camino mientras una roca gigante lo persigue. El jugador esquiva obstáculos puntiagudos moviéndose de lado a lado.

## Cómo ejecutarlo
Como el proyecto usa módulos ES y carga texturas, **hay que abrirlo con un servidor local** (no con doble clic en `index.html`).

**Opción A – Python (recomendada)**
```
cd boulder-escape
python -m http.server 8000
```
Luego abre http://localhost:8000 en Chrome/Edge/Firefox.

**Opción B – VS Code:** instala la extensión *Live Server*, clic derecho en `index.html` → *Open with Live Server*.

**Opción C – GitHub Pages:** sube la carpeta a un repositorio público y activa Pages.

## Ambientación
- **Personaje:** el Caballero (máscara blanca con cuernos, capa azul) hecho solo con geometrías de Three.js; lleva una **lámpara** con luz propia.
- **Ambiente:** cueva verde con musgo, hongos oscuros, musgo colgante y luciérnagas. Hay **zonas iluminadas** (claros de luz) y **zonas oscuras** entre ellas.
- **Obstáculos:** erizos hechos con esferas y muchos **conos**, más estalagmitas y pirámides triangulares. **Si el caballero toca un obstáculo, la partida se reinicia automáticamente** (sin pantalla de Game Over); en pantalla se ve el intento y la mejor distancia.

## Controles
- **A / D** o **← / →**: mover al personaje a izquierda / derecha.
- El avance es automático.

## Estructura
```
boulder-escape/
├── index.html          # Página principal (import map hacia Three.js local)
├── style.css           # Estilos del HUD
├── js/main.js          # Código del juego (escena, personaje, roca, obstáculos, bucle)
├── lib/three.module.js # Three.js r160 (local, sin internet)
├── textures/
│   ├── piedra.png      # Textura de la roca (TextureLoader)
│   └── camino.png      # Textura del camino
└── make_textures.py    # Script que genera las texturas (opcional)
```

## Requerimientos cubiertos
| Req. | Qué se hizo | Dónde (js/main.js) |
|------|-------------|--------------------|
| REQ-01 | Escena, cámara en perspectiva frontal, luces (hemisférica + direccional con sombras), niebla y `requestAnimationFrame` | secciones "ESCENA" y "BUCLE" |
| RF02 | Personaje con cajas, esferas y conos; inicia en el centro; A/D o flechas; límites con `clamp`; animación de carrera opcional | "PERSONAJE" y "TECLADO" |
| RF03 | `SphereGeometry` + `TextureLoader` (piedra.png), detrás del personaje, rotación continua (`ω = v / r`) y leve vaivén | "ROCA GIGANTE" |
| RF04 | Conos, pirámides triangulares y estalagmitas; posiciones aleatorias; se desplazan y se generan nuevos continuamente; cada fila deja al menos 1 de 3 carriles libre (siempre se puede esquivar) | "OBSTÁCULOS" |
| RF05 | Carrera automática por movimiento relativo del entorno (suelo, árboles, obstáculos), cámara que sigue al personaje, respuesta al teclado | "BUCLE DE ANIMACIÓN" |

## Notas
- Colisión simple por distancia: al tocar un obstáculo el juego finaliza y se reinicia solo, sin pantalla de Game Over.
- Los obstáculos se encogen al llegar a la roca y se reciclan.
