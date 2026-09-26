"""Generate deterministic PWA PNG icons from the product's design tokens."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "icons"
NAVY = "#172554"
WHITE = "#FFFFFF"
AMBER = "#F59E0B"


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def make_icon(size: int, filename: str, maskable: bool = False) -> None:
    image = Image.new("RGB", (size, size), NAVY)
    draw = ImageDraw.Draw(image)
    inset = int(size * (0.16 if maskable else 0.11))
    radius = int(size * 0.22)
    if not maskable:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=NAVY)
    label_font = font(int(size * 0.35))
    label = "BA"
    bounds = draw.textbbox((0, 0), label, font=label_font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    draw.text(((size - width) / 2, (size - height) / 2 - bounds[1]), label, fill=WHITE, font=label_font)
    dot_radius = int(size * 0.055)
    dot_x = size - inset - dot_radius
    dot_y = inset + dot_radius
    draw.ellipse((dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius), fill=AMBER)
    image.save(OUTPUT / filename, optimize=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    make_icon(192, "icon-192.png")
    make_icon(512, "icon-512.png")
    make_icon(512, "icon-maskable-512.png", maskable=True)
