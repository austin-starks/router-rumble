(()=>{
/* Router Rumble. Every landscape, search state and signal cell comes from Python. */
const data=window.WIFI_DATA,canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
const C={bg:'#05090e',ink:'#f4f6f8',muted:'#8798ad',yellow:'#ffe353',pink:'#fb53c7',blue:'#358cf2',green:'#73e9bd'};
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const mix=(a,b,p)=>a+(b-a)*p;
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const FONT='Arial, sans-serif';
function text(value,x,y,size=28,color=C.ink,align='left',weight=400){ctx.font=`${weight} ${size}px ${FONT}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y);}
function line(points,color,width=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function dot(p,r,color,glow=false){ctx.save();if(glow){ctx.shadowBlur=22;ctx.shadowColor=color;}ctx.fillStyle=color;ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fill();ctx.restore();}
function tile(x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);}}
function router(p,color){ctx.save();ctx.translate(...p);ctx.fillStyle='#05090e';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-16,-10,32,20,4);ctx.fill();ctx.stroke();line([[-11,-10],[-14,-23]],color,3);line([[11,-10],[14,-23]],color,3);dot([-6,2],1.8,color);dot([2,2],1.8,color);ctx.restore();}
function bracket(history,budget){let index=0;while(index+1<history.length&&history[index+1].evaluations<=budget)index++;const a=history[index],b=history[Math.min(index+1,history.length-1)],span=b.evaluations-a.evaluations;return {a,b,index,p:span?smooth((budget-a.evaluations)/span):0};}
function tweenPosition(sample){return sample.a.position.map((v,i)=>mix(v,sample.b.position[i],sample.p));}
function interpolatePopulation(sample){const a=sample.a.population||[],b=sample.b.population||a;return b.map((p,i)=>p.map((v,j)=>mix((a[i]||p)[j],v,sample.p)));}
function scoreAt(room,p){const gx=clamp((p[0]-.3)/13.4)*56,gy=clamp((p[1]-.3)/9.4)*40,x=Math.min(55,Math.floor(gx)),y=Math.min(39,Math.floor(gy)),a=room.surface.scores;return mix(mix(a[y*57+x],a[y*57+x+1],gx-x),mix(a[(y+1)*57+x],a[(y+1)*57+x+1],gx-x),gy-y);}
function ramp(p){const stops=[[0,[209,67,52]],[.38,[217,149,103]],[.62,[219,224,221]],[.82,[65,143,215]],[1,[13,55,131]]];let i=0;while(i<stops.length-2&&p>stops[i+1][0])i++;const [a,A]=stops[i],[b,B]=stops[i+1],t=clamp((p-a)/(b-a));return A.map((v,j)=>mix(v,B[j],t));}
const geometries=new Map();
function geometry(room){if(geometries.has(room))return geometries.get(room);const scores=room.surface.scores,min=Math.min(...scores),max=Math.max(...scores),range=max-min;
 const raw=(x,y,score)=>{const u=(x-7)/7,v=(y-5)/5;return [u*365+v*115,v*180-u*43-(1-(score-min)/range)*305];};
 const vertices=[];for(let y=0;y<41;y++)for(let x=0;x<57;x++)vertices.push(raw(.3+x/56*13.4,.3+y/40*9.4,scores[y*57+x]));
 const xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),scale=Math.min(866/(hiX-loX),535/(hiY-loY));
 const transform=p=>[490+(p[0]-(loX+hiX)/2)*scale,800+(p[1]-(loY+hiY)/2)*scale];
 const project=p=>transform(raw(p[0],p[1],scoreAt(room,p)));
 const cells=[];for(let y=0;y<40;y++)for(let x=0;x<56;x++){const ids=[y*57+x,y*57+x+1,(y+1)*57+x+1,(y+1)*57+x],score=ids.reduce((n,i)=>n+scores[i],0)/4,base=ramp((score-min)/range),slope=(scores[y*57+x+1]-scores[y*57+x])-(scores[(y+1)*57+x]-scores[y*57+x]),shade=clamp(.94+slope*.045,.62,1.16);cells.push({points:ids.map(i=>transform(vertices[i])),fill:`rgb(${base.map(v=>Math.round(clamp(v*shade,0,255))).join(',')})`});}
 const result={cells,project,min,max};geometries.set(room,result);return result;
}
function arena(room,gd,es,budget){const g=geometry(room);for(const cell of g.cells){ctx.beginPath();cell.points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=cell.fill;ctx.fill();ctx.strokeStyle='rgba(5,9,14,.18)';ctx.lineWidth=.5;ctx.stroke();}
 // The tail records evaluated GD states; the short interpolated lead is presentation only.
 const path=room.gd.filter(s=>s.evaluations<=budget).map(s=>s.position);path.push(tweenPosition(gd));const trail=[];for(let j=1;j<path.length;j++){const a=path[j-1],b=path[j],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*20));for(let k=0;k<=n;k++)trail.push(g.project(a.map((v,i)=>mix(v,b[i],k/n))));}line(trail,'#090d13',12);line(trail,C.yellow,6);
 for(const p of interpolatePopulation(es)){const q=g.project(p);dot([q[0],q[1]+5],4,'#060810');dot(q,4.3,C.pink,true);}
 const ep=g.project(tweenPosition(es)),gp=g.project(tweenPosition(gd));dot([ep[0],ep[1]+7],9,'#040609');dot(ep,8,C.pink,true);dot([gp[0],gp[1]+7],12,'#040609');dot(gp,10,C.yellow,true);ctx.strokeStyle='#171411';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...gp,10,0,Math.PI*2);ctx.stroke();
}
function signalMap(room,state,x,y,w,color){const h=w*10/14,mp=p=>[x+p[0]/14*w,y+(10-p[1])/10*h];tile(x,y,w,h,'#152030');for(let iy=0;iy<20;iy++)for(let ix=0;ix<28;ix++){const s=state.signal[iy*28+ix],good=s>=room.target_dbm,p=clamp(Math.abs(s-room.target_dbm)/18);ctx.fillStyle=good?`rgb(${mix(51,95,p)},${mix(185,230,p)},${mix(133,176,p)})`:`rgb(${mix(78,118,p)},${mix(40,50,p)},${mix(61,74,p)})`;ctx.fillRect(x+ix/28*w,y+(19-iy)/20*h,w/28+.4,h/20+.4);}
 for(const [x1,y1,x2,y2] of room.walls)line([mp([x1,y1]),mp([x2,y2])],'#c6d1df',3);ctx.strokeStyle='#526174';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);router(mp(state.position),color);return h;
}
const rounds=[{index:1,start:0,length:9.5,title:'Round 1: A home with walls',result:'EVOLUTION FINDS LOWER LOSS'},{index:0,start:9.5,length:5,title:'Round 2: An open room',result:'BOTH FIND THE SAME SOLUTION'},{index:3,start:14.5,length:10.5,title:'Round 3: Count covered locations',result:'EVOLUTION FINDS LOWER LOSS'}];
function budgetAt(progress){const knots=[[0,1],[.26,129],[.49,161],[.74,514],[1,1200]];let i=0;while(i<knots.length-2&&progress>knots[i+1][0])i++;const [t0,a]=knots[i],[t1,b]=knots[i+1];return Math.min(data.budget,mix(a,b,clamp((progress-t0)/(t1-t0)))*data.budget/1200);}
function draw(time){const round=[...rounds].reverse().find(r=>time>=r.start)||rounds[0],room=data.rounds[round.index],progress=clamp((time-round.start)/(round.length-3)),budget=budgetAt(progress),gd=bracket(room.gd,budget),es=bracket(room.evolution,budget),done=progress>=1;ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,1920);
 text('Gradient descent vs evolution',64,298,45,C.ink,'left',700);text('Where should the Wi-Fi router go?',64,350,35,C.muted);text(round.title,64,406,27,C.ink);
 text('GRADIENT DESCENT',64,460,31,C.yellow,'left',700);text('EVOLUTION',532,460,31,C.pink,'left',700);text((1-gd.a.score/100).toFixed(3),64,525,70,C.yellow,'left',700);text((1-es.a.score/100).toFixed(3),532,525,70,C.pink,'left',700);text('loss',282,520,28,C.muted);text('loss',750,520,28,C.muted);text('32 candidates',742,459,24,C.pink);
 arena(room,gd,es,budget);
 text(`${Math.floor(budget).toLocaleString()} / ${data.budget.toLocaleString()} evaluations`,1026,406,25,C.muted,'right');
 text(done?(round.index===0?'BOTH CONVERGE':'EVOLUTION WINS'):round.index===3?'Yellow sees no local slope. Pink explores.':'Yellow follows the slope. Pink explores.',490,1110,done?54:32,done?C.green:C.ink,'center',done?700:400);
 const mw=400,my=1170;signalMap(room,gd.a,64,my,mw,C.yellow);signalMap(room,es.a,532,my,mw,C.pink);
 text(`Coverage ${Math.round(gd.a.coverage)}%`,64,1147,31,C.yellow,'left',700);text(`Coverage ${Math.round(es.a.coverage)}%`,532,1147,31,C.pink,'left',700);

 // Move the footer up so essential text clears TikTok's bottom chrome.
 text('SIMULATION · LOWER LOSS WINS · GREEN = COVERED',64,1490,28,C.muted);
 if(time>=25){ctx.fillStyle=C.bg;ctx.fillRect(54,253,975,164);text(`Evolution: ${Math.round(room.gd[0].coverage)}% → ${Math.round(room.evolution.at(-1).coverage)}% coverage`,64,304,45,C.green,'left',700);text('Reproduce the race in Python.',64,357,33,C.ink);text('github.com/austin-starks/router-rumble',64,402,28,C.muted);}

}
window.drawWifi=draw;draw(0);

})();
