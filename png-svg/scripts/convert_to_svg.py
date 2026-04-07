#!/usr/bin/env python3
"""
Convert PNG avatars to SVG format.
Uses PIL to read PNG and embeds as base64 in SVG.
"""

import os
import base64
from pathlib import Path
import sys

def convert_to_svg(input_dir, output_dir):
    """Convert PNG avatars to SVG."""

    # Verify input directory
    if not os.path.exists(input_dir):
        print(f"Error: Input directory not found: {input_dir}")
        sys.exit(1)

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Get all PNG files
    png_files = sorted(Path(input_dir).glob("avatar_*.png"))

    if not png_files:
        print(f"Error: No PNG files found in {input_dir}")
        sys.exit(1)

    print(f"Converting {len(png_files)} PNG avatars to SVG...")

    converted = 0
    failed = []

    for png_file in png_files:
        avatar_id = png_file.stem.replace("avatar_", "")
        svg_file = os.path.join(output_dir, f"avatar_{avatar_id}.svg")

        try:
            # Read PNG file as base64
            with open(png_file, 'rb') as f:
                png_data = f.read()

            png_base64 = base64.b64encode(png_data).decode('utf-8')

            # Create SVG with embedded PNG image
            svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 146 146" width="146" height="146">
  <image href="data:image/png;base64,{png_base64}" x="0" y="0" width="146" height="146"/>
</svg>'''

            # Write SVG file
            with open(svg_file, 'w') as f:
                f.write(svg_content)

            converted += 1
            if converted % 7 == 0:
                print(f"  Converted avatars {converted-6}-{converted}")

        except Exception as e:
            failed.append((avatar_id, str(e)))
            print(f"  Error converting avatar_{avatar_id}: {e}")

    print(f"\nConverted {converted}/{len(png_files)} avatars to SVG")

    if failed:
        print(f"Failed conversions: {len(failed)}")
        for avatar_id, error in failed[:5]:
            print(f"  - avatar_{avatar_id}: {error}")
        return converted, failed

    return converted, []

if __name__ == "__main__":
    # Get absolute paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    input_dir = os.path.join(project_root, "temp", "avatars")
    output_dir = os.path.join(project_root, "temp", "svg")

    converted, failed = convert_to_svg(input_dir, output_dir)

    if failed:
        sys.exit(1)
