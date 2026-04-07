# PNG to SVG Sprite Conversion Tool

This tool converts PNG images to SVG format and generates sprite sheets for efficient web usage.

## Prerequisites

- ImageMagick (for image processing)
- Potrace (for bitmap to vector conversion)
- Python 3.7+

## Installation

1. Install system dependencies:
   ```bash
   brew install imagemagick potrace
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Directory Structure

- `scripts/` - Python conversion scripts
- `temp/` - Temporary files during conversion
- `output/` - Final SVG sprite output

## Usage

Place PNG images in the input directory and run the conversion scripts from the `scripts/` folder.
