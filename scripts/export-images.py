"""T02：只读原图，导出网页图片并提取可复现的配色。"""

from io import BytesIO
import colorsys
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageCms, ImageOps


Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[1]
MAX_EDGE = 2400
MAX_BYTES = 500_000
MIN_QUALITY = 70
SOURCES = {
    "p1-1": "01-Project_Ring/01.png",
    "p2-1": "02-Mortal_Song/05.png",
    "p2-2": "02-Mortal_Song/02.png",
    "p2-3": "02-Mortal_Song/04.png",
    "p3-1": "03-Whisper_of_Earth/01.png",
    "p3-2": "03-Whisper_of_Earth/06.png",
    "p3-3": "03-Whisper_of_Earth/03.png",
    "p4-1": "04-Inhabiting_Heat/02.png",
    "p4-2": "04-Inhabiting_Heat/07.png",
    "p4-3": "04-Inhabiting_Heat/08.png",
}

# 150 个常用 PMS Solid Coated 色号的屏幕近似值，运行时无需联网。
# 数值来源：https://github.com/brettapeters/pantones/blob/master/pantone-coated.json
# 仅用于屏幕配色估算；在此有限表内求最近色，不代表完整实体色卡匹配。
PMS_C = {
    '100 C': '#f6eb61', '102 C': '#fce300', '109 C': '#ffd100', '116 C': '#ffcd00', '123 C': '#ffc72c', '130 C': '#f2a900',
    '137 C': '#ffa300', '143 C': '#f1b434', '151 C': '#ff8200', '158 C': '#e87722', '165 C': '#ff671f', '172 C': '#fa4616',
    '179 C': '#e03c31', '185 C': '#e4002b', '186 C': '#c8102e', '192 C': '#e40046', '199 C': '#d50032', '200 C': '#ba0c2f',
    '202 C': '#862633', '207 C': '#a50034', '213 C': '#e31c79', '219 C': '#da1884', '225 C': '#df1995', '226 C': '#d0006f',
    '233 C': '#c6007e', '239 C': '#db3eb1', '240 C': '#c5299b', '247 C': '#bb16a3', '253 C': '#ad1aac', '259 C': '#6d2077',
    '260 C': '#642667', '266 C': '#753bbd', '268 C': '#582c83', '273 C': '#24135f', '274 C': '#211551', '280 C': '#012169',
    '281 C': '#00205b', '286 C': '#0033a0', '287 C': '#003087', '289 C': '#0c2340', '290 C': '#b9d9eb', '292 C': '#69b3e7',
    '293 C': '#003da5', '295 C': '#002855', '297 C': '#71c5e8', '299 C': '#00a3e0', '300 C': '#005eb8', '301 C': '#004b87',
    '303 C': '#002a3a', '305 C': '#59cbe8', '306 C': '#00b5e2', '308 C': '#00587c', '310 C': '#6ad1e3', '312 C': '#00a9ce',
    '314 C': '#007fa3', '316 C': '#004851', '318 C': '#88dbdf', '320 C': '#009ca6', '321 C': '#008c95', '323 C': '#005f61',
    '325 C': '#64ccc9', '327 C': '#008675', '329 C': '#00685e', '331 C': '#a7e6d7', '333 C': '#3cdbc0', '335 C': '#007b5f',
    '337 C': '#8fd6bd', '339 C': '#00b388', '341 C': '#007a53', '343 C': '#115740', '345 C': '#91d6ac', '347 C': '#009a44',
    '349 C': '#046a38', '351 C': '#a2e4b8', '353 C': '#80e0a7', '355 C': '#009639', '357 C': '#215732', '359 C': '#a1d884',
    '361 C': '#43b02a', '363 C': '#4c8c2b', '365 C': '#c2e189', '367 C': '#a4d65e', '369 C': '#64a70b', '371 C': '#546223',
    '372 C': '#d4eb8e', '374 C': '#c5e86c', '376 C': '#84bd00', '378 C': '#59621d', '379 C': '#e2e868', '381 C': '#cedc00',
    '383 C': '#a8ad00', '385 C': '#787121', '386 C': '#e9ec6b', '388 C': '#e0e721', '390 C': '#b5bd00', '392 C': '#827a04',
    '393 C': '#f0ec74', '395 C': '#ece81a', '397 C': '#bfb800', '399 C': '#a09200', '400 C': '#c4bfb6', '401 C': '#afa9a0',
    '402 C': '#9d968d', '403 C': '#8c857b', '404 C': '#776e64', '405 C': '#696158', '406 C': '#c4bcb7', '408 C': '#978c87',
    '410 C': '#746661', '412 C': '#382f2d', '420 C': '#c7c9c7', '421 C': '#b2b4b2', '422 C': '#9ea2a2', '423 C': '#898d8d',
    '424 C': '#707372', '425 C': '#54585a', '426 C': '#25282a', '427 C': '#d0d3d4', '428 C': '#c1c6c8', '429 C': '#a2aaad',
    '430 C': '#7c878e', '431 C': '#5b6770', '432 C': '#333f48', '433 C': '#1d252d', '434 C': '#d0c4c5', '436 C': '#ab989d',
    '438 C': '#584446', '440 C': '#382e2c', '445 C': '#505759', '448 C': '#4a412a', '450 C': '#594a25', '452 C': '#b0aa7e',
    '454 C': '#cac7a7', '456 C': '#a28e2a', '458 C': '#d9c756', '460 C': '#e4d77e', '462 C': '#5c462b', '464 C': '#8b5b29',
    '466 C': '#c6aa76', '468 C': '#ddcba4', '470 C': '#a45a2a', '472 C': '#e59e6d', '474 C': '#f1c6a7', '476 C': '#4e3629',
    '478 C': '#703f2a', '480 C': '#c6a992', '482 C': '#dbc8b6', '484 C': '#9a3324', '486 C': '#e8927c', '488 C': '#ecbaa8',
}


def linear_rgb(rgb):
    values = np.asarray(rgb, dtype=float) / 255.0
    return np.where(values <= 0.04045, values / 12.92, ((values + 0.055) / 1.055) ** 2.4)


def rgb_to_lab(rgb):
    # sRGB → XYZ（D65 白点）→ CIELAB；后续使用欧氏距离 ΔE76。
    matrix = np.array([[0.4124564, 0.3575761, 0.1804375],
                       [0.2126729, 0.7151522, 0.0721750],
                       [0.0193339, 0.1191920, 0.9503041]])
    xyz = linear_rgb(rgb) @ matrix.T / np.array([0.95047, 1.0, 1.08883])
    delta = 6.0 / 29.0
    values = np.where(xyz > delta ** 3, np.cbrt(xyz), xyz / (3 * delta ** 2) + 4.0 / 29.0)
    return np.stack([116 * values[..., 1] - 16,
                     500 * (values[..., 0] - values[..., 1]),
                     200 * (values[..., 1] - values[..., 2])], axis=-1)


def from_hex(value):
    return tuple(int(value[index:index + 2], 16) for index in (1, 3, 5))


def to_hex(rgb):
    return '#' + ''.join(f'{int(channel):02x}' for channel in rgb)


def relative_luminance(rgb):
    return float(linear_rgb(rgb) @ np.array([0.2126, 0.7152, 0.0722]))


def label_color(background):
    # 根据背景相对亮度，在指定的两种文字色中选择对比度更高者。
    luminance = relative_luminance(background)
    def contrast(value):
        other = relative_luminance(from_hex(value))
        return (max(luminance, other) + 0.05) / (min(luminance, other) + 0.05)
    return max(('#f4f4f4', '#2e2e2e'), key=contrast)


def color_word(rgb):
    hue, saturation, value = colorsys.rgb_to_hsv(*(np.asarray(rgb) / 255.0))
    # 低彩度原图保留灰阶或冷暖灰，不人为添加饱和度。
    if saturation < 0.12:
        return 'charcoal' if value < 0.3 else ('silver' if value > 0.7 else 'gray')
    if saturation < 0.3:
        if hue < 0.19 or hue > 0.95:
            return 'taupe'
        if hue < 0.46:
            return 'sage'
        return 'slate' if hue < 0.75 else 'mauve'
    degrees = hue * 360
    if degrees < 45 and saturation < 0.65 and value < 0.7:
        return 'brown'
    if 10 <= degrees < 25 and value >= 0.7 and saturation < 0.8:
        return 'coral'
    for boundary, word in ((15, 'red'), (45, 'bronze' if value < 0.7 else 'orange'),
                           (70, 'gold'), (165, 'green'), (195, 'teal'),
                           (255, 'blue'), (290, 'violet'), (345, 'magenta'), (361, 'red')):
        if degrees < boundary:
            return word


def extract_palette(image):
    # 固定尺寸和中位切分量化，无随机种子；透明区域按画廊黑底合成。
    sample = image.copy()
    sample.thumbnail((768, 768), Image.Resampling.LANCZOS)
    if sample.mode == 'RGBA':
        base = Image.new('RGBA', sample.size, (0, 0, 0, 255))
        sample = Image.alpha_composite(base, sample)
    quantized = sample.convert('RGB').quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    histogram = sorted(quantized.getcolors(), key=lambda item: (-item[0], item[1]))
    table = quantized.getpalette()
    colors = np.array([table[index * 3:index * 3 + 3] for count, index in histogram])
    weights = np.array([count for count, index in histogram], dtype=float)
    weights /= weights.sum()
    labs = rgb_to_lab(colors)
    chroma = np.linalg.norm(labs[:, 1:], axis=1)
    # 主色需占至少 0.15%，剔除极暗和近白，再平衡彩度与覆盖面积。
    candidates = np.flatnonzero((weights >= 0.0015) & (labs[:, 0] >= 20) & (labs[:, 0] <= 90))
    if not len(candidates):
        candidates = np.arange(len(colors))
    accent = int(max(candidates, key=lambda index: (chroma[index] + 1) * weights[index] ** 0.25))
    # 另对彩色像素聚类，避免黑底吞没细线和点云中的饱和色。
    # 最近邻只用于抽样，不改变导出图片；它不会将相邻的光谱细线混色。
    color_sample = image.copy()
    color_sample.thumbnail((768, 768), Image.Resampling.NEAREST)
    if color_sample.mode == 'RGBA':
        base = Image.new('RGBA', color_sample.size, (0, 0, 0, 255))
        color_sample = Image.alpha_composite(base, color_sample)
    pixels = np.asarray(color_sample.convert('RGB')).reshape(-1, 3)
    pixel_labs = rgb_to_lab(pixels)
    mask = ((pixel_labs[:, 0] >= 20) & (pixel_labs[:, 0] <= 90) &
            (np.linalg.norm(pixel_labs[:, 1:], axis=1) >= 12))
    colored = pixels[mask]
    if len(colored) >= len(pixels) * 0.0015:
        swatches = Image.fromarray(colored.reshape(-1, 1, 3)).quantize(
            colors=16, method=Image.Quantize.MEDIANCUT)
        swatch_table = swatches.getpalette()
        choices = []
        for count, index in swatches.getcolors():
            weight = count / len(pixels)
            if weight >= 0.0015:
                rgb = swatch_table[index * 3:index * 3 + 3]
                lab = rgb_to_lab(rgb)
                choices.append(((np.linalg.norm(lab[1:]) + 1) * weight ** 0.25, rgb))
        if choices:
            rgb = max(choices, key=lambda item: item[0])[1]
            accent = len(colors)
            colors = np.vstack([colors, rgb])
            labs = np.vstack([labs, rgb_to_lab(rgb)])
            weights = np.append(weights, 0)
    # 在较暗的 35% 画面中取最大色簇；亮图也不只盯住孤立黑点。
    ordered = np.argsort(labs[:, 0], kind='stable')
    cutoff = ordered[np.searchsorted(np.cumsum(weights[ordered]), 0.35)]
    dark_limit = max(35, labs[cutoff, 0])
    dark = np.flatnonzero((labs[:, 0] <= dark_limit) & (weights >= 0.01))
    if not len(dark):
        dark = np.array([int(np.argmin(labs[:, 0]))])
    background = int(max(dark, key=lambda index: weights[index]))
    selected = [accent, background]
    for _ in range(2):
        remaining = [index for index in range(len(colors)) if index not in selected]
        if not remaining:
            selected.append(accent)
            continue
        # 次要色兼顾出现面积和与已选色的差异。
        selected.append(max(remaining, key=lambda index: weights[index] ** 0.5 *
                            min(np.linalg.norm(labs[index] - labs[other]) for other in selected)))
    pms_names = list(PMS_C)
    pms_labs = rgb_to_lab([from_hex(PMS_C[name]) for name in pms_names])
    nearest = int(np.argmin(np.linalg.norm(pms_labs - labs[accent], axis=1)))
    return {
        'accent': to_hex(colors[accent]),
        'background': to_hex(colors[background]),
        'blob1': to_hex(colors[selected[2]]),
        'blob2': to_hex(colors[selected[3]]),
        'labelColor': label_color(colors[background]),
        'word': color_word(colors[accent]),
        'pms': '≈ PMS ' + pms_names[nearest],
    }


def load_image(path):
    with Image.open(path) as original:
        profile = original.info.get('icc_profile')
        image = ImageOps.exif_transpose(original)
        mode = 'RGBA' if 'A' in image.getbands() or 'transparency' in image.info else 'RGB'
        image = image.convert(mode)
        if profile:
            image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(BytesIO(profile)),
                                             ImageCms.createProfile('sRGB'), outputMode=mode)
        # 输出不携带原始 EXIF 等元数据。
        image.info.clear()
        return image


def encode_webp(image):
    original = image
    image = image.copy()
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    for quality in range(92, MIN_QUALITY - 1, -2):
        buffer = BytesIO()
        image.save(buffer, format='WEBP', quality=quality, method=6)
        data = buffer.getvalue()
        if len(data) < MAX_BYTES:
            return image, data, quality
    # 质量到 70 仍超限时继续等比缩小，始终从原图重采样，避免反复缩放。
    edge = max(image.size)
    while len(data) >= MAX_BYTES:
        edge = int(edge * 0.95)
        image = original.copy()
        image.thumbnail((edge, edge), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        image.save(buffer, format='WEBP', quality=MIN_QUALITY, method=6)
        data = buffer.getvalue()
    return image, data, MIN_QUALITY


def main():
    for relative in SOURCES.values():
        if not (ROOT / 'raw' / relative).is_file():
            raise FileNotFoundError(relative)
    (ROOT / 'images').mkdir(exist_ok=True)
    (ROOT / 'docs').mkdir(exist_ok=True)
    palette = {}
    for key, relative in SOURCES.items():
        original = load_image(ROOT / 'raw' / relative)
        resized, data, quality = encode_webp(original)
        target = ROOT / 'images' / (key + '.webp')
        target.write_bytes(data)
        # 从最终交付的解码图片提取色卡，使配色对应实际网页素材。
        with Image.open(target) as exported:
            exported.load()
            assert exported.format == 'WEBP' and exported.size == resized.size
            assert max(exported.size) <= MAX_EDGE and target.stat().st_size < MAX_BYTES
            palette[key] = extract_palette(exported)
        print(f'{key}.webp\t{resized.width}x{resized.height}\t{len(data)} bytes\tquality={quality}', flush=True)
    (ROOT / 'docs' / 'palette.json').write_text(json.dumps(palette, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
