"""Bundle Python's recorded states and signal samples into a portable replay."""
import json
from pathlib import Path

import numpy as np

from experiment import ROOMS

ROOT=Path(__file__).resolve().parent
VIDEO=ROOT.parents[1]/'Videos/tiktok/gradient-vs-evolution/edit'
recorded=json.loads((ROOT/'results/results.json').read_text())
for room,result in zip(ROOMS,recorded['rounds']):
    for method in ('gd','evolution'):
        for state in result[method]:
            state['signal']=np.round(room.signal(np.array(state['position']))[0],2).tolist()
data=json.dumps(recorded,separators=(',',':'))
visual=(ROOT/'visual.js').read_text()
style='''
*{box-sizing:border-box}html,body{margin:0;background:#111a22;color:#f4ecd9}
body{font-family:'IBM Plex Mono',monospace}
#root{width:100%;height:100%;position:relative;overflow:hidden;background:#111a22}
#world{position:absolute;inset:0;width:1080px;height:1920px}
#header{position:absolute;left:64px;right:150px;top:254px}
#kicker{font-size:25px;font-weight:700;letter-spacing:1.5px;color:#87a8b8;margin-bottom:20px}
h1{font:900 72px/1.05 'Montserrat',sans-serif;letter-spacing:-3px;margin:0}
#title-a,#title-b{display:block;white-space:nowrap}#title-b{color:#ffd35a}
#subtitle{font-size:28px;line-height:1.35;margin-top:24px;min-height:80px;color:#d4e0e3}
#scores{position:absolute;top:548px;left:64px;right:164px;display:flex;justify-content:space-between;gap:30px}
.score{display:flex;gap:20px;align-items:center}.num{font:700 51px 'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums}
.score-label{font-size:20px;width:195px;line-height:1.3}.yellow{color:#ffd35a}.pink{color:#ff80ba}
#budget{position:absolute;left:64px;top:1320px;font-size:25px;color:#9eb8c5}
#punchline{position:absolute;left:64px;right:165px;top:1390px;font:700 31px/1.22 'Montserrat',sans-serif}
#note{position:absolute;left:64px;top:1480px;font-size:19px;letter-spacing:1px;color:#90a8b5}
'''
body='''<div id="root" data-composition-id="wifi-race" data-start="0" data-width="1080" data-height="1920" data-duration="33">
<canvas id="world" width="1080" height="1920" aria-label="Router placement race and simulated signal coverage"></canvas>
<header id="header"><div id="kicker"></div><h1><span id="title-a"></span><span id="title-b"></span></h1><div id="subtitle"></div></header>
<div id="scores"><div class="score yellow"><div id="gd-number" class="num"></div><div id="gd-label" class="score-label"></div></div><div class="score pink"><div id="es-number" class="num"></div><div id="es-label" class="score-label"></div></div></div>
<div id="budget"></div><div id="punchline"></div><div id="note"></div></div>'''
head='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Router Rumble — local search vs evolution</title>'
shared=f'<script>window.WIFI_DATA={data};</script><script>{visual}</script>'
video=head+'<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>'+f'<style>{style}</style></head><body>{body}{shared}'
video+='''<audio id="soundtrack" class="clip" src="assets/router-rumble.wav" data-start="0" data-duration="33" data-volume="1" data-track-index="5"></audio><script>
const clock={t:0};const tl=gsap.timeline({paused:true});
tl.to(clock,{t:33,duration:33,ease:'none',onUpdate:()=>window.drawWifi(clock.t)},0);
window.__timelines['wifi-race']=tl;
</script></body></html>'''
if VIDEO.exists():
    (VIDEO/'index.html').write_text(video)
demo=head+f'''<style>{style}
body{{background:#0a1118}}#viewer{{width:432px;height:768px;margin:auto}}#root{{width:1080px;height:1920px;transform:scale(.4);transform-origin:top left}}
nav{{position:fixed;bottom:0;left:0;right:0;background:#203340;padding:14px;display:flex;justify-content:center;align-items:center;gap:14px}}button{{background:#ffd35a;color:#111a22;border:0;border-radius:7px;padding:10px 18px;font-weight:bold}}input{{width:230px;accent-color:#ff80ba}}output{{min-width:70px}}a{{color:#6bdeb0}}
</style></head><body><div id="viewer">{body}</div>{shared}'''
demo+='''<nav><button id="play">Play</button><input id="scrub" aria-label="Replay timeline" type="range" min="0" max="33" step=".01" value="0"><output id="time">0.0 s</output></nav><script>
let playing=false,time=0,last=null;const scrub=document.getElementById('scrub'),play=document.getElementById('play');
function fit(){const scale=Math.min(innerWidth/1080,(innerHeight-72)/1920,.55);document.getElementById('root').style.transform=`scale(${scale})`;document.getElementById('viewer').style.width=1080*scale+'px';document.getElementById('viewer').style.height=1920*scale+'px';}fit();addEventListener('resize',fit);
play.onclick=()=>{playing=!playing;last=null;play.textContent=playing?'Pause':'Play';};
scrub.oninput=()=>{time=Number(scrub.value);window.drawWifi(time);document.getElementById('time').textContent=time.toFixed(1)+' s';};
function tick(now){if(playing&&last!==null){time=(time+(now-last)/1000)%33;window.drawWifi(time);scrub.value=time;document.getElementById('time').textContent=time.toFixed(1)+' s';}last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
</script></body></html>'''
(ROOT/'demo.html').write_text(demo)
print('Bundled Router Rumble: replay + video from actual states and 560 signal samples.')
