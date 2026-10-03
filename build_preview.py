"""Bundle recorded results into an offline experiment viewer and video source."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VIDEO = ROOT.parents[1] / 'Videos/tiktok/gradient-vs-evolution/edit'
data = json.dumps(json.loads((ROOT / 'results/results.json').read_text()), separators=(',', ':'))
visual = (ROOT / 'visual.js').read_text()
style = '''
*{box-sizing:border-box}html,body{margin:0;background:#10151b;color:#f4eee4}
body{font-family:'IBM Plex Mono',monospace}
#root{width:100%;height:100%;position:relative;overflow:hidden;background:#10151b}
.content{position:absolute;left:64px;right:144px;top:256px}
#chapter{font-size:25px;color:#b7c7cd;letter-spacing:1px;margin-bottom:18px}
#headline{font:400 66px/1.06 'Archivo Black',sans-serif;letter-spacing:-2px;margin:0;max-width:820px;min-height:144px}
#explain{font-size:27px;line-height:1.35;color:#c0ced3;margin-top:16px;min-height:72px}
#terrain{position:absolute;left:0;top:570px;width:1080px;height:690px}
.legend{position:absolute;top:568px;left:64px;display:flex;gap:32px;font-size:25px;z-index:1}
.gd{color:#f8d45c}.es{color:#f28bc9}.label{font-size:25px;line-height:1.4}
.stats{position:absolute;left:440px;top:1065px;right:148px;z-index:1}
.row{display:flex;align-items:center;gap:24px;margin:0 0 22px}
.value{font-size:67px;line-height:1;font-variant-numeric:tabular-nums;width:180px}
.detail{font-size:23px;line-height:1.5}
.eval{font-size:21px;color:#bac7cc;white-space:nowrap}
#map-label{position:absolute;left:70px;top:1265px;font-size:20px;color:#bdcbd0}
#coverage{position:absolute;left:440px;top:1280px;font-size:21px;white-space:nowrap;color:#c0ced3}
.ending{position:absolute;left:64px;right:155px;top:1340px}
#takeaway{font:400 34px/1.2 'Archivo Black',sans-serif;min-height:82px}
#footnote{font-size:22px;color:#b9c8cf;line-height:1.4}
.bar{position:absolute;left:64px;right:155px;top:1518px;height:3px;background:#39424a}
#progress{width:100%;height:100%;background:#f4eee4;transform-origin:left}
'''
body = '''
<div id="root" data-composition-id="wifi-race" data-start="0" data-width="1080" data-height="1920" data-duration="41">
<div class="content"><div id="chapter"></div><h1 id="headline"></h1><div id="explain"></div></div>
<canvas id="terrain" width="1080" height="780" aria-label="Router-position loss surface and floor plan"></canvas>
<div class="legend"><span class="gd">● Gradient descent</span><span class="es">● Evolution</span></div>
<div class="stats">
<div class="row gd"><div id="gd-score" class="value"></div><div class="detail">service score<div id="gd-count" class="eval"></div></div></div>
<div class="row es"><div id="es-score" class="value"></div><div class="detail">service score<div id="es-count" class="eval"></div></div></div>
</div><div id="map-label"></div><div id="coverage"></div>
<div class="ending"><div id="takeaway"></div><div id="footnote"></div></div>
<div class="bar"><div id="progress"></div></div></div>
'''
head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Wi-Fi router optimization race</title>'
shared = f'<script>window.WIFI_DATA={data};</script><script>{visual}</script>'
video = head + '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>' + f'<style>{style}</style></head><body>{body}{shared}'
video += '''<script>
const clock={t:0};const tl=gsap.timeline({paused:true});
tl.to(clock,{t:41,duration:41,ease:'none',onUpdate:()=>window.drawWifi(clock.t)},0);
window.__timelines['wifi-race']=tl;
</script></body></html>'''
if VIDEO.exists():
    (VIDEO / 'index.html').write_text(video)
demo = head + f'<style>{style}#root{{width:1080px;height:1920px;transform:scale(.4);transform-origin:top left}}#viewer{{width:432px;height:768px;margin:auto}}nav{{position:fixed;bottom:0;left:0;right:0;background:#202b34;padding:12px;display:flex;justify-content:center;gap:14px}}input{{width:260px}}button{{padding:8px}}</style></head><body><div id="viewer">{body}</div>{shared}'
demo += '''<nav><button id="play">Play / pause</button><input id="scrub" aria-label="Timeline" type="range" min="0" max="41" step=".01" value="0"><output id="time">0.0 s</output></nav><script>
let playing=false,time=0,last=null;const scrub=document.getElementById('scrub');
document.getElementById('play').onclick=()=>{playing=!playing;last=null;};
scrub.oninput=()=>{time=Number(scrub.value);window.drawWifi(time);};
function tick(now){if(playing&&last!==null){time=(time+(now-last)/1000)%41;window.drawWifi(time);scrub.value=time;document.getElementById('time').textContent=time.toFixed(1)+' s';}last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
</script></body></html>'''
(ROOT / 'demo.html').write_text(demo)
print('Bundled demo.html and video index.html from recorded experiment results.')
