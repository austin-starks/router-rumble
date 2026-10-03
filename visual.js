/* Recorded data only: draw(t) is a pure function of simulation time. */
const canvas = document.getElementById('terrain');
const ctx = canvas.getContext('2d');
const data = window.WIFI_DATA;
const yellow = '#f8d45c', purple = '#f28bc9';
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;
const byId = id => document.getElementById(id);
function atBudget(history, budget) {
  let s = history[0];
  for (const next of history) { if(next.evaluations > budget) break; s=next; }
  return s;
}
function surfaceScore(room,x,y) {
  const gx=clamp((x-.3)/13.4*56,0,56), gy=clamp((y-.3)/9.4*40,0,40);
  const ix=Math.min(55,Math.floor(gx)), iy=Math.min(39,Math.floor(gy));
  const a=room.surface.scores, f=gx-ix,g=gy-iy;
  return lerp(lerp(a[iy*57+ix],a[iy*57+ix+1],f),lerp(a[(iy+1)*57+ix],a[(iy+1)*57+ix+1],f),g);
}
function project(x,y,score,angle) {
  const px=(x-7)*48, py=(y-5)*48;
  const u=px*Math.cos(angle)-py*Math.sin(angle);
  const v=px*Math.sin(angle)+py*Math.cos(angle);
  return [520+u, 390+v*.48-(100-score)*2.75];
}
function dot(p,r,color) {
  ctx.beginPath(); ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
function draw(time) {
  const intro=time<3, end=time>=35;
  const index=intro ? 1 : time<13 ? 0 : time<24 ? 1 : 2;
  const start=[3,13,24][index], finish=[13,24,35][index];
  const fraction=intro?0:end?1:clamp((time-start-.45)/(finish-start-2),0,1);
  const budget=fraction>=1?1200:Math.max(1,Math.floor(1200*fraction));
  const room=data.rounds[index], gd=atBudget(room.gd,budget), es=atBudget(room.evolution,budget);
  const angle=-.62+clamp(time/35,0,1)*.12;
  ctx.clearRect(0,0,1080,780);
  // A fixed loss scale across rounds: high service score = lower loss.
  const quads=[];
  for(let y=0;y<40;y++)for(let x=0;x<56;x++){
    const coords=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
    const scores=coords.map(([ix,iy])=>room.surface.scores[iy*57+ix]);
    const pts=coords.map(([ix,iy],i)=>project(.3+ix/56*13.4,.3+iy/40*9.4,scores[i],angle));
    const average=scores.reduce((a,b)=>a+b,0)/4;
    quads.push({pts,average,depth:(y-20)*Math.cos(angle)+(x-28)*Math.sin(angle)});
  }
  quads.sort((a,b)=>a.depth-b.depth);
  for(const q of quads){
    ctx.beginPath();q.pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
    // Low score rust peaks, high score teal valleys.
    const f=q.average/100;
    ctx.fillStyle=`rgb(${Math.round(lerp(174,37,f))},${Math.round(lerp(68,135,f))},${Math.round(lerp(53,150,f))})`;
    ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.8;ctx.stroke();
  }
  // Mesh lines make the actual height variation readable at phone size.
  ctx.strokeStyle='rgba(16,21,27,.27)';ctx.lineWidth=1.2;
  for(let y=0;y<=40;y+=4){ctx.beginPath();for(let x=0;x<=56;x++){
    const p=project(.3+x/56*13.4,.3+y/40*9.4,room.surface.scores[y*57+x],angle);
    x?ctx.lineTo(...p):ctx.moveTo(...p);
  }ctx.stroke();}
  for(let x=0;x<=56;x+=4){ctx.beginPath();for(let y=0;y<=40;y++){
    const p=project(.3+x/56*13.4,.3+y/40*9.4,room.surface.scores[y*57+x],angle);
    y?ctx.lineTo(...p):ctx.moveTo(...p);
  }ctx.stroke();}
  // Accumulating incumbent path from actual evaluated states.
  ctx.beginPath();
  room.gd.filter(s=>s.evaluations<=budget).forEach((s,i)=>{
    const p=project(...s.position,surfaceScore(room,...s.position),angle);
    if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);
  });ctx.strokeStyle=yellow;ctx.lineWidth=4;ctx.stroke();
  for(const p of es.population||[])dot(project(...p,surfaceScore(room,...p),angle),3.6,purple);
  const gp=project(...gd.position,surfaceScore(room,...gd.position),angle);
  const ep=project(...es.position,surfaceScore(room,...es.position),angle);
  dot(gp,13,'#10151b');dot(gp,9,yellow);dot(ep,10,'#10151b');dot(ep,6,purple);
  // Floor plan inset: same coordinates, independent of the loss height.
  const map={x:70,y:515,w:320,h:229};
  const mp=p=>[map.x+p[0]/14*map.w,map.y+map.h-p[1]/10*map.h];
  ctx.fillStyle='#202b34';ctx.fillRect(map.x,map.y,map.w,map.h);
  ctx.strokeStyle='#a2b1ba';ctx.lineWidth=3;ctx.strokeRect(map.x,map.y,map.w,map.h);
  for(const [x1,y1,x2,y2] of room.walls){ctx.beginPath();ctx.moveTo(...mp([x1,y1]));ctx.lineTo(...mp([x2,y2]));ctx.lineWidth=7;ctx.strokeStyle='#c8d0ce';ctx.stroke();}
  ctx.beginPath();room.gd.filter(s=>s.evaluations<=budget).forEach((s,i)=>i?ctx.lineTo(...mp(s.position)):ctx.moveTo(...mp(s.position)));ctx.strokeStyle=yellow;ctx.lineWidth=3;ctx.stroke();
  for(const p of es.population||[])dot(mp(p),2.6,purple);
  dot(mp(gd.position),7,yellow);dot(mp(es.position),4.5,purple);
  byId('chapter').textContent=intro?'A REAL PROBLEM · PYTHON SIMULATION':end?'SAME BUDGET. DIFFERENT SEARCH.':`ROUND ${index+1} / 3 · ${room.name.toUpperCase()}`;
  byId('headline').textContent=intro?'Where should your Wi-Fi router go?':end?'The walls change the race.':index===0?'First: no walls.':index===1?'Now add office walls.':'Demand a stronger signal.';
  byId('explain').textContent=intro?'One router. Two search methods.':end?'Evolution explores. Gradients follow local slopes.':index===0?'A smooth problem gives both methods a route.':index===1?'Walls create competing good spots.':'Same walls. Target: −57 dBm instead of −67.';
  byId('gd-score').textContent=gd.score.toFixed(1);
  byId('es-score').textContent=es.score.toFixed(1);
  byId('gd-count').textContent=`${gd.evaluations.toLocaleString()} evaluations`;
  byId('es-count').textContent=`${es.evaluations.toLocaleString()} evaluations`;
  byId('map-label').textContent='FLOOR PLAN · 14 × 10 m';
  byId('coverage').textContent=`Coverage: GD ${gd.coverage.toFixed(0)}% · ES ${es.coverage.toFixed(0)}%`;
  const done=fraction===1;
  byId('takeaway').textContent=end?'github.com/austin-starks/wifi-optimizer':intro?'Watch the dots search for the best spot.':done?index===0?'Both reach 96.5.':index===1?'Evolution: 67.1. Gradient descent: 63.6.':'Evolution: 35.9. Gradient descent: 28.0.':'Lower on the surface = better service score.';
  byId('footnote').textContent=end?'Python · educational model · setup matters':done&&index>0?'Evolution finished ahead in 20 / 20 seeds.':'Equal search budget: 1,200 evaluations each.';
  byId('progress').style.transform=`scaleX(${clamp(time/41,0,1)})`;
}
window.drawWifi = draw;
draw(0);
