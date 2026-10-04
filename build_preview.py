"""Bundle recorded Python search states into the browser replay and video."""
import json
from pathlib import Path

import numpy as np

from experiment import ROOMS

ROOT = Path(__file__).resolve().parent
VIDEO = ROOT.parents[1] / 'Videos/tiktok/gradient-vs-evolution/edit'
DURATION = 12
recorded = json.loads((ROOT / 'results/results.json').read_text())
for room, result in zip(ROOMS, recorded['rounds']):
    for method in ('gd', 'evolution'):
        for state in result[method]:
            signal = room.signal(np.array(state['position']))[0]
            state['signal'] = np.round(signal, 2).tolist()
            state['covered'] = (signal >= room.target).tolist()
            assert sum(state['covered']) == round(state['coverage'] / 100 * 560)
data = json.dumps(recorded, separators=(',', ':'))
visual = (ROOT / 'visual.js').read_text()
head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Router Rumble</title>'
style = 'html,body{margin:0;background:#05090e;color:#f4f6f8;font-family:Arial,sans-serif}#root{position:relative;width:1080px;height:1920px;overflow:hidden}canvas{display:block;width:1080px;height:1920px}'
body = f'<div id="root" data-composition-id="wifi-race" data-start="0" data-width="1080" data-height="1920" data-duration="{DURATION}"><canvas id="world" width="1080" height="1920" aria-label="A router-placement race on its actual coverage-count loss surface; yellow gradient descent and pink evolutionary population with linked signal maps"></canvas></div>'
shared = f'<script>window.WIFI_DATA={data};</script><script>{visual}</script>'
video = head + '<script src="assets/gsap.min.js"></script>' + f'<style>{style}</style></head><body>{body}{shared}'
video += f'''<audio id="soundtrack" class="clip" src="assets/router-rumble.wav" data-start="0" data-duration="{DURATION}" data-volume="1" data-track-index="5"></audio><script>
const clock={{t:0}},tl=gsap.timeline({{paused:true}});
tl.to(clock,{{t:{DURATION},duration:{DURATION},ease:'none',onUpdate:()=>window.drawWifi(clock.t)}},0);
window.__timelines['wifi-race']=tl;
</script></body></html>'''
if VIDEO.exists():
    (VIDEO / 'index.html').write_text(video)
demo = head + f'''<style>{style}
#viewer{{margin:auto}}#root{{transform-origin:top left}}nav{{position:fixed;bottom:0;left:0;right:0;background:#182333;padding:14px;display:flex;justify-content:center;align-items:center;gap:14px}}button{{background:#ffe353;border:0;border-radius:7px;padding:10px 18px;font-weight:bold}}input{{width:230px;accent-color:#fb53c7}}output{{min-width:70px}}
</style></head><body><div id="viewer">{body}</div>{shared}'''
demo += f'''<nav><button id="play">Play</button><input id="scrub" aria-label="Replay timeline" type="range" min="0" max="{DURATION}" step=".01" value="0"><output id="time">0.0 s</output></nav><script>
let playing=false,time=0,last=null;const scrub=document.getElementById('scrub'),play=document.getElementById('play');
function fit(){{const scale=Math.min(innerWidth/1080,(innerHeight-72)/1920,.55);document.getElementById('root').style.transform=`scale(${{scale}})`;document.getElementById('viewer').style.width=1080*scale+'px';document.getElementById('viewer').style.height=1920*scale+'px';}}fit();addEventListener('resize',fit);
play.onclick=()=>{{playing=!playing;last=null;play.textContent=playing?'Pause':'Play';}};
scrub.oninput=()=>{{time=Number(scrub.value);window.drawWifi(time);document.getElementById('time').textContent=time.toFixed(1)+' s';}};
function tick(now){{if(playing&&last!==null){{time=(time+(now-last)/1000)%{DURATION};window.drawWifi(time);scrub.value=time;document.getElementById('time').textContent=time.toFixed(1)+' s';}}last=now;requestAnimationFrame(tick);}}requestAnimationFrame(tick);
</script></body></html>'''
(ROOT / 'demo.html').write_text(demo)
print('Bundled the coverage-count race with linked signal maps.')
