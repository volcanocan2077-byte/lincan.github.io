# 从 raw/ 只读生成两档网页图：
#   images/p*-*.webp          大图，长边 1800px，质量 80（体积上限 350KB）
#   images/preview/p*-*.webp  预览图，长边 640px，质量 55，先加载用
# 复用 export-images.py 的来源表和读图逻辑；色卡不重新提取（docs/palette.json 不变）
import importlib.util
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('export_images', ROOT / 'scripts' / 'export-images.py')
export_images = importlib.util.module_from_spec(spec)
spec.loader.exec_module(export_images)

VARIANTS = [
    # (输出目录, 长边, 起始质量, 最低质量, 体积上限)
    (ROOT / 'images', 1800, 80, 60, 350_000),
    (ROOT / 'images' / 'preview', 640, 55, 40, 45_000),
]


def encode(image, edge, quality, min_quality, max_bytes):
    # 先降质量；降到最低仍超限，就从原图按 5% 递减重新缩小
    while True:
        resized = image.copy()
        resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
        for q in range(quality, min_quality - 1, -5):
            buffer = BytesIO()
            resized.save(buffer, format='WEBP', quality=q, method=6)
            if buffer.tell() <= max_bytes:
                return resized, buffer.getvalue(), q
        edge = int(edge * 0.95)


def main():
    for folder, *_ in VARIANTS:
        folder.mkdir(parents=True, exist_ok=True)
    for key, relative in export_images.SOURCES.items():
        original = export_images.load_image(ROOT / 'raw' / relative)
        for folder, edge, quality, min_quality, max_bytes in VARIANTS:
            resized, data, q = encode(original, edge, quality, min_quality, max_bytes)
            (folder / f'{key}.webp').write_bytes(data)
            print(f'{folder.name}/{key}.webp\t{resized.width}x{resized.height}\t{len(data) // 1000}KB\tq={q}')


if __name__ == '__main__':
    main()
