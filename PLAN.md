# PLAN：画廊内容替换为 LINCAN ZHOU 作品

> 状态：选图与文字已确认（2026-11-24），进入阶段 5 版式
> 总览图：docs/contact-sheets/01-Project_Ring.jpg ~ 04-Inhabiting_Heat.jpg
> 说明：Gemini 免费层全部 503，选图和文案由 Claude 看总览图完成。

## 一、选图与展示顺序（10 张，按项目分组）

用户确认：Project Ring 只放 01；Ring 03 不放；PMS 按最接近色号估算（标 ≈）；文字只用英文，不显示年份/地点。

| # | 项目 | 文件 | 尺寸 | 理由 |
|---|------|------|------|------|
| 01 | Project Ring | 01.png | 3840×2640 | 暗底光环轨迹，开场有冲击力，分辨率足 |
| 02 | Mortal Song | 05.png | 3840×2467 | 鸟瞰：步道丝带穿过城中村，交代场地 |
| 03 | Mortal Song | 02.png | 2560×2560 | 光之顶棚下两人对坐，最有情绪 |
| 04 | Mortal Song | 04.png | 3840×2467 | 夜间木构戏台与人群，交代使用场景 |
| 05 | Whisper of Earth | 01.png | 3840×2468 | 机械臂在废墟柱上打印，暗底，交代建造方式 |
| 06 | Whisper of Earth | 06.png | 2560×2560 | 骨骼状多孔结构攀附残楼，项目主视觉 |
| 07 | Whisper of Earth | 03.png | 2560×2560 | 结构内部有人坐卧行走，交代"再栖居" |
| 08 | Inhabiting Heat | 02.png | 4961×3508 | 点云街景+热成像拼贴，色彩最丰富 |
| 09 | Inhabiting Heat | 07.png | 3011×1775 | 紫色点云场景，画面干净，适合全屏 |
| 10 | Inhabiting Heat | 08.png | 2752×1536 | 速度光束收尾，动感强 |

不用：Ring 02/03/04（分辨率不足、肖像风险）。备选：Mortal 03/06；Whisper 08（鸟瞰）；Heat 01。

## 二、文字草稿（线上只显示英文项目名 + 英文简介；中文仅存档）

**01 Project Ring ／ 环**
- 中：以环、漂浮与线缆为线索，探索身体在技术与宇宙中的失重状态。
- EN: A visual study of bodies adrift — orbits, tethers and cables binding us to technology and space.
- 类型：视觉实验（推测）｜年份：待确认｜地点：待确认

**02 Mortal Song ／ 凡人之歌**
- 中：在密集的城中村上空织入步道与戏台，让夜晚的巷弄重新响起人间之歌。
- EN: Walkways and a timber stage woven above a dense urban village, giving its nights a public voice again.
- 类型：城市更新 / 公共空间（推测）｜年份：待确认｜地点：待确认（画面像华南城中村）

**03 Whisper of Earth ／ 大地低语**
- 中：机械臂在灾后废墟中打印骨骼般的多孔结构，让破碎的建筑重新成为庇护所。
- EN: Robotic fabrication grows bone-like lattices through ruined buildings, turning debris into shelter.
- 类型：灾后重建 / 数字建造（推测）｜年份：待确认｜地点：待确认

**04 Inhabiting Heat ／ 栖居热浪**
- 中：用激光点云与热成像重绘城市街区，探讨人如何在升温的城市里栖居。
- EN: LiDAR point clouds and thermal imaging remap the city to ask how we inhabit urban heat.
- 类型：城市热环境 / 数字媒介（推测）｜年份：待确认｜地点：待确认

## 三、现有代码怎么组织（阶段 3 结论）

- 内容全部在 `src/data/galleryData.js`：每张图一条，含 textureSrc、accentColor（色卡主色）、backgroundColor、blob1/2Color（背景雾化色）、label.word、label.pms、label.color（文字色）。
- 色卡：`Label.js` 只读 accentColor（HEX），RGB / CMYK 由代码自动换算；PMS 是手填字符串。
- 标题：`index.html` 的 `.frame__title`；meta / aria-label 里有"floral""five"等原文案。
- 写死处：`Gallery.js:81` 默认 3:4；`main.js:42,44` 的 floral 文案与 `current < 2`；`index.js` 的 frameDarkPlaneCount。
- 目前没有"项目名 / 简介"的显示位置，需要新增（版式由阶段 5 决定）。

## 四、执行方案

1. 图片：从 raw/ 只读导出 10 张 → images/p{项目}-{序号}.webp，长边 ≤2400，单张尽量 <500KB。
2. 色卡：脚本对每张图做主色聚类，取主色 → accentColor，并按最接近的 PMS C 色号估算 label.pms（显示为 ≈PMS xxx C），暗部 → backgroundColor，次色 → blob1/blob2，输出 docs/palette.json 供人工复核。
3. 数据：galleryData.js 改为 10 条，新增 project 字段（序号、中英文名、简介、年份、地点）；原 flower 图不再引用，文件保留不删。
4. 页面：标题改 LINCAN ZHOU；页脚保留"Based on Atmospheric Depth Gallery by Houmahani Kane"及 GitHub 链接；LICENSE、README 署名不动。
5. 实测：npm run dev + Playwright，电脑 1440×900、手机 390×844 各截一张，查控制台报错。
6. 审查：/codex:adversarial-review → 修改 → handoff + STATUS + commit → 停下来等确认 push。

## 五、任务卡

| 卡 | 内容 | 负责 |
|----|------|------|
| T02 | 导出 10 张 webp + 提取色卡 | Codex |
| T03 | 项目信息版式草图（Figma） | Claude |
| T04 | 替换数据、标题、新增项目信息层 | Claude |
| T05 | 中英文案润色与统一 | DeepSeek |
| T06 | 本地实测与截图 | Antigravity（Claude 用 Playwright 兜底） |
| T07 | 对抗式审查 | Codex |
