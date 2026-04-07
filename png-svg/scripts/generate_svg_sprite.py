#!/usr/bin/env python3
"""
Generate optimized SVG sprite from individual SVG avatars.
Creates a single SVG file with all 49 avatars positioned in 7×7 grid.
Also generates CSS for background-position styling.
"""

import os
import xml.etree.ElementTree as ET
from pathlib import Path
import sys

def generate_svg_sprite(input_dir, output_svg, output_css):
    """Generate SVG sprite from individual SVG files."""

    # Verify input directory
    if not os.path.exists(input_dir):
        print(f"❌ Error: Input directory not found: {input_dir}")
        sys.exit(1)

    # Get all SVG files
    svg_files = sorted(Path(input_dir).glob("avatar_*.svg"))

    if not svg_files:
        print(f"❌ Error: No SVG files found in {input_dir}")
        sys.exit(1)

    print(f"🎨 Generating SVG sprite from {len(svg_files)} avatars...")

    # Grid parameters
    grid_size = 7
    avatar_size = 146
    sprite_size = avatar_size * grid_size  # 1024

    # Create root SVG element
    svg_root = ET.Element('svg')
    svg_root.set('xmlns', 'http://www.w3.org/2000/svg')
    svg_root.set('viewBox', f'0 0 {sprite_size} {sprite_size}')
    svg_root.set('width', str(sprite_size))
    svg_root.set('height', str(sprite_size))
    svg_root.set('class', 'avatar-sprite')

    # Create defs for reusable symbols
    defs = ET.SubElement(svg_root, 'defs')

    # Process each SVG file
    css_rules = []
    processed = 0

    for svg_file in svg_files:
        avatar_id = int(svg_file.stem.replace("avatar_", ""))

        # Calculate grid position
        row = (avatar_id - 1) // grid_size
        col = (avatar_id - 1) % grid_size
        x = col * avatar_size
        y = row * avatar_size

        # Parse individual SVG
        try:
            tree = ET.parse(svg_file)
            svg_elem = tree.getroot()

            # Create symbol for this avatar
            symbol = ET.SubElement(defs, 'symbol')
            symbol.set('id', f'avatar-{avatar_id}')
            symbol.set('viewBox', f'0 0 {avatar_size} {avatar_size}')

            # Copy content from individual SVG
            for child in svg_elem:
                symbol.append(child)

            # Add use element to sprite
            use_elem = ET.SubElement(svg_root, 'use')
            use_elem.set('href', f'#avatar-{avatar_id}')
            use_elem.set('x', str(x))
            use_elem.set('y', str(y))
            use_elem.set('width', str(avatar_size))
            use_elem.set('height', str(avatar_size))
            use_elem.set('class', f'avatar-item avatar-{avatar_id}')

            # Generate CSS rule for this avatar
            css_rule = f""".avatar-{avatar_id:02d} {{
  background-image: url('/static/images/avatars_sprite.svg');
  background-position: -{x}px -{y}px;
  background-size: {sprite_size}px {sprite_size}px;
  background-repeat: no-repeat;
}}"""
            css_rules.append(css_rule)

            processed += 1
            if processed % 7 == 0:
                print(f"✓ Processed avatars {processed-6}-{processed}")

        except Exception as e:
            print(f"✗ Error processing {svg_file}: {e}")
            continue

    # Write SVG sprite
    os.makedirs(os.path.dirname(output_svg), exist_ok=True)
    tree = ET.ElementTree(svg_root)
    tree.write(output_svg, encoding='utf-8', xml_declaration=True)
    print(f"\n✅ Generated SVG sprite: {output_svg}")

    # Write CSS file
    os.makedirs(os.path.dirname(output_css), exist_ok=True)
    with open(output_css, 'w') as f:
        f.write("/* Avatar sprite CSS - Auto-generated */\n")
        f.write(".sprite-avatar {\n")
        f.write("  display: block;\n")
        f.write("  width: 100%;\n")
        f.write("  height: 100%;\n")
        f.write("  background-repeat: no-repeat;\n")
        f.write("}\n\n")
        f.write("\n".join(css_rules))

    print(f"✅ Generated CSS file: {output_css}")

    # Print file sizes
    svg_size = os.path.getsize(output_svg) / 1024
    css_size = os.path.getsize(output_css) / 1024
    print(f"\n📊 File sizes:")
    print(f"   SVG sprite: {svg_size:.1f}KB")
    print(f"   CSS file: {css_size:.1f}KB")

    return processed

if __name__ == "__main__":
    input_dir = "../temp/svg"
    output_svg = "../output/avatars_sprite.svg"
    output_css = "../output/avatar-sprite.css"

    processed = generate_svg_sprite(input_dir, output_svg, output_css)

    if processed < 49:
        print(f"\n⚠️  Warning: Only processed {processed}/49 avatars")
        sys.exit(1)
