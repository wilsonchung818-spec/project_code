from pathlib import Path
import math

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "assets" / "icons"


def rounded_line(draw, points, fill, width):
    draw.line(points, fill=fill, width=width, joint="curve")
    radius = width // 2
    for x, y in (points[0], points[-1]):
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def make_icon(size):
    scale = size / 512
    image = Image.new("RGB", (size, size), "#316BFF")
    draw = ImageDraw.Draw(image)

    def point(x, y):
        return round(x * scale), round(y * scale)

    def box(values):
        return tuple(round(value * scale) for value in values)

    draw.ellipse(box((80, 62, 432, 414)), fill="#DDEAFF")
    left = [point(*value) for value in [(83, 162), (126, 147), (174, 148), (214, 163), (256, 188), (256, 397), (206, 369), (153, 362), (83, 379)]]
    right = [point(*value) for value in [(429, 162), (386, 147), (338, 148), (298, 163), (256, 188), (256, 397), (306, 369), (359, 362), (429, 379)]]
    draw.polygon(left, fill="#FFFFFF")
    draw.polygon(right, fill="#FFFFFF")
    stroke = max(4, round(18 * scale))
    rounded_line(draw, left + [left[0]], "#17365F", stroke)
    rounded_line(draw, right + [right[0]], "#17365F", stroke)
    rounded_line(draw, [point(256, 188), point(256, 397)], "#17365F", stroke)

    line_width = max(3, round(14 * scale))
    for y in (221, 270):
        rounded_line(draw, [point(126, y), point(202, y)], "#9BB8E8", line_width)
        rounded_line(draw, [point(310, y), point(386, y)], "#9BB8E8", line_width)

    cx, cy = point(347, 352)
    outer, inner = 44 * scale, 19 * scale
    star = []
    for index in range(10):
        angle = math.radians(-90 + index * 36)
        radius = outer if index % 2 == 0 else inner
        star.append((round(cx + math.cos(angle) * radius), round(cy + math.sin(angle) * radius)))
    draw.polygon(star, fill="#FFD257")
    return image


if __name__ == "__main__":
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    make_icon(192).save(ICON_DIR / "icon-192.png", optimize=True)
    make_icon(512).save(ICON_DIR / "icon-512.png", optimize=True)
    make_icon(512).save(ICON_DIR / "icon-maskable-512.png", optimize=True)
