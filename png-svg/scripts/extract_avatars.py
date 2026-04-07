#!/usr/bin/env python3
"""
Extract 49 individual avatars from PNG sprite (1024×1024px, 7×7 grid).
Each avatar is 146×146px (1024÷7).
"""

import os
from PIL import Image
import sys

def extract_avatars(sprite_path, output_dir):
    """Extract individual avatars from sprite."""

    # Verify sprite exists
    if not os.path.exists(sprite_path):
        print(f"❌ Error: Sprite not found at {sprite_path}")
        sys.exit(1)

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Open sprite
    sprite = Image.open(sprite_path)
    print(f"📦 Opened sprite: {sprite.size} {sprite.mode}")

    if sprite.size != (1024, 1024):
        print(f"⚠️  Warning: Expected 1024×1024, got {sprite.size}")

    # Extract avatars
    avatar_size = 146  # 1024 ÷ 7
    grid_size = 7
    extracted = 0

    for row in range(grid_size):
        for col in range(grid_size):
            avatar_id = row * grid_size + col + 1

            # Calculate crop box
            left = col * avatar_size
            top = row * avatar_size
            right = left + avatar_size
            bottom = top + avatar_size

            # Extract avatar
            avatar = sprite.crop((left, top, right, bottom))

            # Save avatar
            output_path = os.path.join(output_dir, f"avatar_{avatar_id:02d}.png")
            avatar.save(output_path, "PNG")
            extracted += 1

            if avatar_id % 7 == 0:
                print(f"✓ Extracted avatars {avatar_id-6}-{avatar_id}")

    print(f"\n✅ Successfully extracted {extracted} avatars to {output_dir}")
    return extracted

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))

    sprite_path = os.path.join(project_root, "src/static/images/avatars_sprite.png")
    output_dir = os.path.join(script_dir, "../temp/avatars")

    extract_avatars(sprite_path, output_dir)
