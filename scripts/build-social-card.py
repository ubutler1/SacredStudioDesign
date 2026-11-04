"""Rebuild the share card from approved assets without cropping the painting.

Optional authoring dependency: Pillow. The generated JPEG is
committed; normal website builds have no Python or graphics dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
image = Image.new("RGB", (1200, 630), "#faf7f1")
draw = ImageDraw.Draw(image)
logo = Image.open(root / "assets/logo-horizontal-transparent.png").convert("RGBA")
logo.thumbnail((610, 196), Image.Resampling.LANCZOS)
image.paste(logo, (56, 50), logo)
fonts = Path("/usr/share/fonts/truetype/dejavu")
serif = ImageFont.truetype(str(fonts / "DejaVuSerif.ttf"), 42)
sans = lambda size: ImageFont.truetype(str(fonts / "DejaVuSans.ttf"), size)
draw.text((56, 325), "Portraits with presence.", fill="#27211f", font=serif, anchor="ls")
draw.text((56, 385), "Color without permission.", fill="#7c424d", font=serif, anchor="ls")
draw.text((58, 465), "Original paintings · Bronx, New York", fill="#62564e", font=sans(23), anchor="ls")
draw.text((58, 518), "urielalexanderstudio.com", fill="#62564e", font=sans(22), anchor="ls")
draw.line((58, 555, 155, 555), fill="#ad7c3d", width=3)
draw.rectangle((773, 30, 1168, 589), fill="#e7dcd2")
painting = Image.open(root / "assets/city-figure-provisional.webp").convert("RGB")
painting.thumbnail((355, 519), Image.Resampling.LANCZOS)
image.paste(painting, (793 + (355 - painting.width) // 2, 50 + (519 - painting.height) // 2))
draw.text((793, 612), "Skyline State of Mind · Uriel Alexander", fill="#62564e", font=sans(15), anchor="ls")
image.save(root / "assets/studio-social-card-20261104.jpg", quality=92,
           subsampling=0, optimize=True)
print("Built 1200 × 630 studio share card from the approved logo and full artwork.")
