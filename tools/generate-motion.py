"""Render original seamless fluid loops. Requires numpy, Pillow, imageio-ffmpeg.
Run: python tools/generate-motion.py. No external stock footage is used.
"""
from pathlib import Path
import numpy as np
from PIL import Image
import imageio_ffmpeg
import subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/motion'; OUT.mkdir(parents=True,exist_ok=True)
palettes={
 'violet': ['06030f','29135d','713bcd','b39ce1'],
 'blue': ['020812','072c67','1674b4','8cced0'],
 'magenta': ['100208','580725','cf0050','ff86ae'],
 'silver': ['050608','25282c','72777d','c8cccf'],
 'health': ['04090e','063b54','0085ac','c5cd80'],
 'cobalt': ['020713','0c246d','315bea','8aabff'],
 'lime': ['050a01','234501','619e05','b4df67'],
 'orange': ['110500','672000','ed5600','ffb26a'],
 'teal': ['020b0c','063b40','16878c','83ced0'],
}
w,h=960,540; fps=24; frames=fps*10
x,y=np.meshgrid(np.linspace(-1.6,1.6,w,dtype=np.float32),np.linspace(-1,1,h,dtype=np.float32))
# A fixed fine-grain plate keeps the loop seamless and compression efficient.
rng=np.random.default_rng(8); grain=rng.normal(0,3.8,(h,w,1)).astype(np.float32)
processes={}
for name in palettes:
 processes[name]=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-s',f'{w}x{h}','-pix_fmt','rgb24','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/f'{name}.mp4')],stdin=subprocess.PIPE)
for f in range(frames):
 t=f/frames*np.pi*2
 for seed,(name,colors) in enumerate(palettes.items()):
  phase=t+seed*.71
  angle=seed*.31
  xx=x*np.cos(angle)-y*np.sin(angle)
  yy=x*np.sin(angle)+y*np.cos(angle)
  u=xx+.45*np.sin(1.7*yy+phase)+.26*np.cos(2*xx-phase)+.15*np.sin(4*yy-xx+t)
  v=yy+.38*np.sin(1.2*xx-phase)+.2*np.cos(yy*3+phase)
  wave=np.sin((2.2+seed*.14)*u+1.8*v+.85*np.sin(u*2-v*3+phase))
  ribbon=np.exp(-((wave+.18)/.28)**2)
  halo=np.exp(-((wave-.4)/.65)**2)
  light=np.exp(-((v+.55*np.sin(u+phase))/.2)**2)*.5
  value=np.clip(.045+halo*.16+ribbon*.62+light*.48,0,1)
  p=np.array([[int(c[i:i+2],16) for i in (0,2,4)] for c in colors],dtype=np.float32)
  scaled=value*3; idx=np.minimum(scaled.astype(int),2); mix=(scaled-idx)[...,None]
  rgb=np.clip(p[idx]*(1-mix)+p[idx+1]*mix+grain,0,255).astype('uint8')
  processes[name].stdin.write(rgb.tobytes())
  if f==0: Image.fromarray(rgb).save(OUT/f'{name}.webp',quality=85)
for name,p in processes.items():
 p.stdin.close(); assert p.wait()==0; print(name,round((OUT/f'{name}.mp4').stat().st_size/1024),'KB',flush=True)
