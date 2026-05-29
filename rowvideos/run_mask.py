"""wisdel2: 手绘遮罩 + u2netp 背景去除"""
import os, io, subprocess, shutil, tempfile
import numpy as np
from PIL import Image, ImageFilter
import imageio, imageio_ffmpeg
from backgroundremover.bg import remove

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
INPUT = "E:/clone/mrfzVSzoombie/rowvideos/wisdel2.mp4"
MASK_PATH = "E:/clone/mrfzVSzoombie/rowvideos/mask_ref.png"
OUTPUT_MOV = "E:/clone/mrfzVSzoombie/rowvideos/wisdel2-mask.mov"
OUTPUT_MP4 = "E:/clone/mrfzVSzoombie/rowvideos/wisdel2-mask.mp4"
MODEL = "u2netp"
ALPHA_BOOST = 2.5
MASK_BLUR = 2  # mask 边界羽化（减小=更锐利）
MASK_FLOOR = 0.9  # mask 白区内最低 alpha 保证（提高=武器更明显）

print(f"Device: CUDA (RTX 5070 Ti)")
print(f"模型: {MODEL}, boost={ALPHA_BOOST}x, mask_floor={MASK_FLOOR}")

# 加载视频
reader = imageio.get_reader(INPUT)
fps = reader.get_meta_data()['fps']
total = reader.count_frames()
w = reader.get_meta_data()['source_size'][0]
h = reader.get_meta_data()['source_size'][1]
print(f"视频: {total}帧, {w}x{h}, {fps}fps")

# 加载手绘遮罩 → 灰度 → 高斯模糊羽化
mask_img = Image.open(MASK_PATH).convert('L').resize((w, h), Image.LANCZOS)
mask_arr = np.array(mask_img, dtype=np.float32) / 255.0
mask_blur = Image.fromarray((mask_arr * 255).astype(np.uint8))
mask_blur = mask_blur.filter(ImageFilter.GaussianBlur(MASK_BLUR))
mask_arr = np.array(mask_blur, dtype=np.float32) / 255.0
# 反转遮罩（用户涂的白色=背景，黑色=人物，需要反过来）
mask_arr = 1.0 - mask_arr
print(f"遮罩已反转: 白→黑(删除), 黑→白(保留)")
print(f"遮罩保留区占比: {(mask_arr > 0.5).sum() / mask_arr.size * 100:.1f}%")

# 临时帧目录
tmpdir = tempfile.mkdtemp(prefix="wisdel2_mask_")
print(f"临时目录: {tmpdir}")

for i in range(total):
    frame = reader.get_data(i)

    # u2netp 去背景
    result_bytes = remove(frame, model_name=MODEL)
    result_img = Image.open(io.BytesIO(result_bytes)).resize((w, h), Image.LANCZOS)
    arr = np.array(result_img).astype(np.float32)

    ai_alpha = arr[:, :, 3] / 255.0
    boosted = np.clip(ai_alpha * ALPHA_BOOST, 0.0, 1.0)

    # mask 白区用 max(boosted, mask*floor) 保证武器不被删
    # mask 黑区 ≈ 0，不受影响
    final_alpha = np.maximum(boosted, mask_arr * MASK_FLOOR)

    arr[:, :, 3] = (np.clip(final_alpha, 0.0, 1.0) * 255).astype(np.uint8)

    frame_path = os.path.join(tmpdir, f"frame_{i:05d}.png")
    Image.fromarray(arr.astype(np.uint8), "RGBA").save(frame_path)

    pct = (final_alpha > 0.3).sum() / final_alpha.size * 100
    print(f"遮罩处理: {i+1}/{total} (可见{pct:.1f}%)")

reader.close()

# 合成透明 MOV
print("合成透明 MOV ...")
subprocess.run([FFMPEG,
    '-framerate', str(fps), '-i', f'{tmpdir}/frame_%05d.png',
    '-c:v', 'prores_ks', '-pix_fmt', 'yuva444p10le',
    '-profile:v', '4444', '-alpha_bits', '16',
    '-y', OUTPUT_MOV], check=True)

# 合成绿幕 MP4
print("合成绿幕 MP4 ...")
subprocess.run([FFMPEG,
    '-i', OUTPUT_MOV,
    '-vf', "color=#00ff00:s=2304x1440:d=4[bg];[bg][0]overlay=format=auto:shortest=1",
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', str(fps),
    '-y', OUTPUT_MP4], check=True)

shutil.rmtree(tmpdir)
print("完成!")
print(f"  MOV: {OUTPUT_MOV}")
print(f"  MP4: {OUTPUT_MP4}")
