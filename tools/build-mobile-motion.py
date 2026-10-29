"""Create phone-sized decorative loops without changing duration or frame rate.
Requires ffmpeg. Full-size desktop originals remain untouched.
"""
from pathlib import Path
import subprocess

folder = Path(__file__).resolve().parents[1] / "assets" / "motion"
for original in sorted(folder.glob("*.mp4")):
    if original.stem.endswith("-mobile"):
        continue
    target = original.with_name(f"{original.stem}-mobile.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-i", str(original),
        "-vf", "scale=640:360", "-an", "-c:v", "libx264", "-preset", "slow",
        "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target)
    ], check=True)
    print(f"{target.name}: {target.stat().st_size:,} bytes (was {original.stat().st_size:,})")
