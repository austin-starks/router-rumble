/* Router Rumble: optimizer states and signal grids are recorded in Python. */
const data=window.WIFI_DATA,canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
const C={ink:'#f4ecd9',ground:'#111a22',yellow:'#ffd35a',pink:'#ff80ba',red:'#f15f54',green:'#6bdeb0'};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),lerp=(a,b,p)=>a+(b-a)*p;
const smooth=p=>{p=clamp(p,0,1);return p*p*(3-2*p);};
const el=id=>document.getElementById(id);
function stateAt(history,budget){let s=history[0];for(const v of history){if(v.evaluations>budget)break;s=v;}return s;}
function line(a,b,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
function circle(p,r,color){ctx.beginPath();ctx.arc(...p,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function text(value,x,y,size=26,color=C.ink,weight=400){ctx.font=`${weight} ${size}px "IBM Plex Mono",monospace`;ctx.fillStyle=color;ctx.fillText(value,x,y);}
function box(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function router(p,color){ctx.save();ctx.translate(...p);ctx.fillStyle=C.ground;ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(-22,-14,44,29,6);ctx.fill();ctx.stroke();line([-15,-14],[-20,-34],color,4);line([15,-14],[20,-34],color,4);for(let i=0;i<3;i++)circle([-9+i*9,2],2.2,color);ctx.restore();}
function furniture(mp){ctx.save();ctx.strokeStyle='rgba(244,236,217,.35)';ctx.lineWidth=2;for(const [a,b] of [[[1,9.45],[3.2,8.05]],[[1.1,9.2],[1.9,8.9]],[[2.2,9.2],[3,8.9]],[[5.5,8.7],[7.9,8]],[[5.5,9],[7.9,8.7]],[[11,8.8],[13.2,7.8]]]){const p=mp(a),q=mp(b);ctx.strokeRect(p[0],p[1],q[0]-p[0],q[1]-p[1]);}ctx.restore();}
function heatColor(rssi,target){const good=rssi>=target,p=clamp(Math.abs(rssi-target)/15,0,1),a=good?[35,113,84]:[114,42,48],b=good?[65,175,124]:[190,64,65];return `rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],p))).join(',')})`;}
function floor(room,s,map,options={}){
 const mp=p=>[map.x+p[0]/14*map.w,map.y+(10-p[1])/10*map.h];
 ctx.save();ctx.beginPath();ctx.rect(map.x,map.y,map.w,map.h);ctx.clip();ctx.fillStyle='#25353f';ctx.fillRect(map.x,map.y,map.w,map.h);
 for(let y=0;y<20;y++)for(let x=0;x<28;x++){ctx.fillStyle=heatColor(s.signal[y*28+x],room.target_dbm);ctx.fillRect(map.x+x/28*map.w,map.y+(19-y)/20*map.h,map.w/28+.5,map.h/20+.5);}
 for(let x=0;x<=28;x+=2)line([map.x+x/28*map.w,map.y],[map.x+x/28*map.w,map.y+map.h],'rgba(244,236,217,.06)',1);
 for(let y=0;y<=20;y+=2)line([map.x,map.y+y/20*map.h],[map.x+map.w,map.y+y/20*map.h],'rgba(244,236,217,.06)',1);
 furniture(mp);for(const [x1,y1,x2,y2] of room.walls)line(mp([x1,y1]),mp([x2,y2]),C.ink,map.w/100);
 if(options.history){ctx.beginPath();options.history.filter(v=>v.evaluations<=options.budget).forEach((v,i)=>i?ctx.lineTo(...mp(v.position)):ctx.moveTo(...mp(v.position)));ctx.strokeStyle=C.yellow;ctx.lineWidth=4;ctx.stroke();}
 if(options.population)for(const p of options.population)circle(mp(p),map.w/140,C.pink);
 if(options.other)router(mp(options.other.position),C.yellow);router(mp(s.position),options.color||C.pink);ctx.restore();ctx.strokeStyle=C.ink;ctx.lineWidth=4;ctx.strokeRect(map.x,map.y,map.w,map.h);return mp;
}
function terrain(room,x,y,w,h,budget){
 const a=room.surface.scores,project=(ix,iy,score)=>[x+w*.5+(ix/56-.5)*w*.76+(iy/40-.5)*w*.25,y+h*.63+(iy/40-.5)*h*.42-(100-score)*h*.005];
 for(let iy=0;iy<40;iy++)for(let ix=0;ix<56;ix++){const pts=[[ix,iy],[ix+1,iy],[ix+1,iy+1],[ix,iy+1]].map(([i,j])=>project(i,j,a[j*57+i]));ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=heatColor(-90+a[iy*57+ix]*.5,-65);ctx.fill();ctx.strokeStyle='rgba(244,236,217,.12)';ctx.lineWidth=.7;ctx.stroke();}
 const point=p=>{const ix=clamp(Math.round((p[0]-.3)/13.4*56),0,56),iy=clamp(Math.round((p[1]-.3)/9.4*40),0,40);return project(ix,iy,a[iy*57+ix]);};
 ctx.beginPath();room.gd.filter(v=>v.evaluations<=budget).forEach((v,i)=>i?ctx.lineTo(...point(v.position)):ctx.moveTo(...point(v.position)));ctx.strokeStyle=C.yellow;ctx.lineWidth=4;ctx.stroke();const es=stateAt(room.evolution,budget),gd=stateAt(room.gd,budget);for(const p of es.population||[])circle(point(p),4,C.pink);circle(point(gd.position),11,C.yellow);circle(point(es.position),8,C.pink);
}
const featured=data.rounds[2],start=featured.gd[0],finish=featured.evolution.at(-1),gdFinish=featured.gd.at(-1),control=data.rounds[0];
const pct=n=>Math.round(n)+'%';
const beats=[
 {at:0,kicker:'ROUTER RUMBLE',title:['YOUR WI-FI','DIES HERE.'],sub:`${Math.round(100-start.coverage)}% of this simulated home misses the target.`,bottom:'Can evolution find a better spot?'},
 {at:3,kicker:'ONE ROUTER · TWO SEARCH METHODS',title:['LOCAL SEARCH','VS. EVOLUTION'],sub:'Yellow follows the slope. Pink tries a population.',bottom:`Same start. Same ${data.budget.toLocaleString()}-evaluation budget.`},
 {at:6,kicker:'THE RACE IS ON',title:['MOVE THE ROUTER.','WATCH THE SIGNAL.'],sub:'Every dot and signal cell comes from Python.',bottom:'Green meets the signal target. Red falls short.'},
 {at:10,kicker:'YELLOW FINDS A LOCAL SOLUTION',title:['IT GETS BETTER.','THEN IT STOPS.'],sub:'Gradient descent settles on this side of the wall.',bottom:'The pink population keeps exploring.'},
 {at:14,kicker:'KEEP THE BEST · MUTATE · REPEAT',title:['PINK FINDS','ANOTHER ROUTE.'],sub:'It samples positions across the walls.',bottom:'The walls are signal penalties, not movement barriers.'},
 {at:18,kicker:'WHY THE METHODS DIVERGE',title:['LOCAL SLOPE.','GLOBAL SEARCH.'],sub:'The loss surface has competing good positions.',bottom:'This is plain finite-difference gradient descent.'},
 {at:22,kicker:'SAME HOUSE · SAME SIGNAL TARGET',title:[`${pct(start.coverage)} → ${pct(finish.coverage)}`,'COVERAGE'],sub:'Move the router. More sampled locations meet the target.',bottom:`Evolution: ${pct(finish.coverage)} · gradient descent: ${pct(gdFinish.coverage)}.`},
 {at:26,kicker:'THE CONTROL MATTERS',title:['NO WALLS?','BOTH GET THERE.'],sub:`Open room: GD ${control.gd.at(-1).score.toFixed(1)}, evolution ${control.evolution.at(-1).score.toFixed(1)}.`,bottom:'This setup has a winner. There is no universal winner.'},
 {at:29,kicker:'BUILD IT. BREAK IT. RERUN IT.',title:['ROUTER','RUMBLE'],sub:'A small Python repo. A real optimization problem.',bottom:'github.com/austin-starks/router-rumble'}
];
function draw(t){
 const room=data.rounds[2],phase=[...beats].reverse().find(b=>t>=b.at)||beats[0];
 let budget=t<6?1:t<10?1+(t-6)/4*146:t<14?147+(t-10)/4*14:t<18?161+(t-14)/4*353:t<22?514+(t-18)/4*686:1200;budget=Math.min(data.budget,Math.round(budget*data.budget/1200));
 const gd=stateAt(room.gd,budget),es=stateAt(room.evolution,budget);
 el('kicker').textContent=phase.kicker;el('title-a').textContent=phase.title[0];el('title-b').textContent=phase.title[1];el('subtitle').textContent=phase.sub;el('punchline').textContent=phase.bottom;el('note').textContent='SIMULATED SIGNAL · NOT A MEASURED WI-FI TEST';
 el('gd-number').textContent=Math.round(gd.coverage)+'%';el('es-number').textContent=Math.round(es.coverage)+'%';el('budget').textContent=`${budget.toLocaleString()} / ${data.budget.toLocaleString()} evaluations`;el('gd-label').textContent='GRADIENT DESCENT';el('es-label').textContent='EVOLUTION';el('scores').style.opacity=t>=3&&t<22?'1':'0';el('budget').style.opacity=t>=3&&t<22?'1':'0';ctx.clearRect(0,0,1080,1920);
 if(t<18){
  const settle=smooth(t/2.4),map={x:64,y:640,w:852,h:608.6};ctx.save();ctx.translate(490,940);ctx.scale(lerp(1.12,1,settle),lerp(1.12,1,settle));ctx.translate(-490,-940);
  const chosen=t<6?room.gd[0]:es,mp=floor(room,chosen,map,{color:t<6?C.yellow:C.pink,history:room.gd,budget,other:t>=6?gd:null,population:t>=3?es.population:null});
  if(t<3){const p=mp([2.1,8.6]);line([p[0]+40,p[1]+30],[p[0]+160,p[1]+105],C.red,4);box(p[0]+130,p[1]+80,230,66,12,C.red);text('DEAD ZONE',p[0]+147,p[1]+124,30,C.ground,700);text('ROUTER START',map.x+80,map.y+map.h-26,24,C.yellow,700);}
  if(t>=10&&t<14){const p=mp(gd.position);box(p[0]-83,p[1]+45,166,54,10,C.yellow);text('STUCK',p[0]-53,p[1]+82,29,C.ground,700);}
  ctx.restore();text(t<6?'SIGNAL MAP · ONE POSSIBLE FLOOR PLAN':'SIGNAL MAP FOR PINK’S BEST POSITION',66,1295,24,'#aebdc5');
 }else if(t<22){terrain(room,64,660,852,530,budget);text('LOWER LOSS = BETTER SERVICE SCORE',64,1200,27,C.ink);text(`Yellow ${gd.score.toFixed(1)}  /  pink ${es.score.toFixed(1)}`,64,1250,29,C.pink);
 }else if(t<26){const before=room.gd[0],after=room.evolution.at(-1),mapA={x:64,y:720,w:390,h:278.6},mapB={x:526,y:720,w:390,h:278.6};floor(room,before,mapA,{color:C.yellow});floor(room,after,mapB,{color:C.pink});text('BEFORE',64,680,32,C.red,700);text('AFTER EVOLUTION',526,680,28,C.green,700);text(pct(before.coverage),64,1110,104,C.red,700);text(pct(after.coverage),526,1110,104,C.green,700);text(`${Math.round(before.coverage*5.6)} / 560 samples`,64,1162,24,C.ink);text(`${Math.round(after.coverage*5.6)} / 560 samples`,526,1162,24,C.ink);line([465,860],[507,860],C.ink,6);line([492,846],[507,860],C.ink,6);line([492,874],[507,860],C.ink,6);text(`${room.audit.evolution_wins} / ${room.audit.seeds} seeds beat GD on service score.`,64,1250,28,C.ink);
 }else if(t<29){const control=data.rounds[0],g=control.gd.at(-1),e=control.evolution.at(-1);floor(control,e,{x:64,y:660,w:852,h:608.6},{color:C.pink,other:g});box(210,840,540,216,20,'#111a22e8',C.green);text(`${g.score.toFixed(1)}  /  ${e.score.toFixed(1)}`,242,939,64,C.ink,700);text('GD / EVOLUTION · SCORE',242,1008,28,C.green);
 }else{box(64,660,852,430,24,'#1d2b35','#54717e');text('> uv run run_demo.py',104,747,38,C.green);text('✓ run both optimizers',104,827,31,C.ink);text('✓ see actual signal maps',104,889,31,C.ink);text('✓ change the seed + budget',104,951,31,C.ink);text('✓ replay your own results',104,1013,31,C.ink);text('PYTHON + NUMPY. NO AI API.',64,1195,35,C.ink,700);text('Change the layout. Challenge the result.',64,1250,28,C.pink);}
 const entry=smooth((t-phase.at)/.28);el('header').style.transform=`translateX(${(1-entry)*34}px)`;el('header').style.opacity=String(lerp(.72,1,entry));
}
window.drawWifi=draw;draw(0);
