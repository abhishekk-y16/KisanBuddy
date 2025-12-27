import base64
import sys
import os
from io import BytesIO
from PIL import Image, ImageDraw

# Ensure project root is on sys.path so `backend` package can be imported during tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.vision import compute_poi_from_image_base64


def create_synthetic_leaf_with_lesion(size=(512, 512)):
    img = Image.new('RGB', size, (30, 160, 30))  # green background (leaf)
    draw = ImageDraw.Draw(img)
    # Draw a brown circular lesion
    cx, cy = size[0] // 2, size[1] // 2
    r = min(size) // 8
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.ellipse(bbox, fill=(130, 70, 50))
    buf = BytesIO()
    img.save(buf, format='JPEG')
    return base64.b64encode(buf.getvalue()).decode('ascii')


def test_compute_poi_detects_lesion():
    b64 = create_synthetic_leaf_with_lesion()
    out = compute_poi_from_image_base64(b64)
    assert isinstance(out, dict)
    assert set(['DLA', 'TLA', 'POI', 'stage']).issubset(out.keys())
    assert out['TLA'] > 0
    # POI should be >0 because we drew a lesion
    assert out['POI'] > 0
