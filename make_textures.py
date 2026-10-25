#-----------piedra  y camino de musgo (ambiente tipo verde)
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
rng = np.random.default_rng(7)

def noise(size, octaves=6):
    out = np.zeros((size, size))
    for o in range(octaves):
        n = 2 ** (o + 2)
        small = rng.random((n, n))
        img = Image.fromarray((small * 255).astype('uint8')).resize((size, size), Image.BICUBIC)
        out += np.asarray(img, dtype=float) / 255 / (1.7 ** o)
    out -= out.min(); out /= out.max()
    return out

size = 512

#----------piedra ----------
n = noise(size)
cr = noise(size, 4)
cracks = (np.abs(cr - 0.5) < 0.012).astype(float)
base = np.array([128, 122, 114])
img = np.zeros((size, size, 3))
for c in range(3):
    img[..., c] = base[c] * (0.55 + 0.7 * n)
img *= (1 - 0.6 * cracks[..., None])
img += rng.normal(0, 6, img.shape)
Image.fromarray(np.clip(img, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6)).save('textures/piedra.png')

#-----------camino ----------
im = Image.new('RGB', (size, size), (12, 22, 14))
d = ImageDraw.Draw(im)
celdas = 4
w = size // celdas
for i in range(celdas):
    for j in range(celdas):
        g = int(rng.integers(70, 110))
        col = (g - 10, g + 5, g - 5)
        m = int(rng.integers(5, 12))
        d.rounded_rectangle([i * w + m, j * w + m, (i + 1) * w - m, (j + 1) * w - m],
                            radius=int(rng.integers(10, 28)), fill=col)
a = np.asarray(im, dtype=float)
n2 = noise(size, 7)
moss = np.zeros_like(a)
moss[..., 0] = 40; moss[..., 1] = 110; moss[..., 2] = 40
mask = np.clip((n2 - 0.45) * 2.2, 0, 1)[..., None]
a = a * (1 - 0.65 * mask) + moss * (0.65 * mask)
a += rng.normal(0, 5, a.shape)
Image.fromarray(np.clip(a, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8)).save('textures/camino.png')
print('ok')
