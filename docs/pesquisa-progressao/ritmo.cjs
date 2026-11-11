// Modelo de ritmo da economia de cartas (docs/pesquisa-progressao/relatorio.md). Rode: node docs/pesquisa-progressao/ritmo.cjs
const ROLES=['Top','Jungle','Mid','Adc','Support'];
const real={L:[['Mid',89],['Support',88],['Support',88],['Top',87],['Mid',87],['Jungle',86],['Mid',85],['Jungle',85]],
E:[['Adc',84],['Support',84],['Adc',84],['Top',83],['Jungle',83],['Adc',83],['Jungle',83],['Adc',82],['Jungle',82],['Top',81],['Adc',80]],
R:[['Jungle',79],['Top',78],['Jungle',78],['Support',78],['Mid',78],['Support',78],['Support',78],['Adc',77],['Mid',77],['Mid',76],['Mid',75],['Top',75],['Top',75],['Adc',75],['Support',75],['Jungle',74],['Mid',74],['Support',74],['Top',73],['Adc',72]],
C:[['Top',68]]};
ROLES.forEach(r=>{for(let i=0;i<6;i++)real.C.push([r,60+Math.floor(Math.random()*9)])});
const cards=[];for(const k in real)real[k].forEach(([role,ovr],i)=>cards.push({id:k+i+role,rar:k,role,ovr}));
const by=k=>cards.filter(c=>c.rar===k);
const COST=[0,1,2,3,4]; // cópias extras para ★2..★5
const PACK={basico:{price:500,n:3,odds:{C:.60,R:.30,E:.085,L:.015}},premium:{price:1500,n:3,odds:{C:0,R:.55,E:.35,L:.10}}};
const PITY=20, UPG_PTS={C:50,R:100,E:200,L:400};
const rewardPerGame=()=>{const w=Math.random()<.5;return (w?120:50)+(Math.random()<.2?25:0)+(w&&Math.random()<.4?150:0)};
const MIN_PER_GAME=6;
function run(strategy,hours){
  const own={};let pts=1000,noL=0,games=0;
  const add=c=>{const o=own[c.id]||(own[c.id]={c,star:1,copies:0});if(own[c.id]&&o!==undefined&&o.got)o.copies++;o.got=true;};
  ROLES.forEach(r=>{const p=by('C').filter(c=>c.role===r);add(p[Math.floor(Math.random()*p.length)])});
  const r3=[...by('R')].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>b.ovr-a.ovr);add(r3[0]);
  const draw=t=>{const P=PACK[t];pts-=P.price;let gotL=false;const out=[];for(let i=0;i<P.n;i++){let x=Math.random(),k='C';
      let acc=0;for(const kk of ['C','R','E','L']){acc+=P.odds[kk];if(x<acc){k=kk;break}}
      if(i===P.n-1&&noL>=PITY-1&&!gotL)k='L';if(k==='L')gotL=true;const pool=by(k);const c=pool[Math.floor(Math.random()*pool.length)];add(c);out.push(c)}
    noL=gotL?0:noL+1};
  const upgrade=()=>{for(const id in own){const o=own[id];while(o.star<5&&o.copies>=COST[o.star]&&pts>=UPG_PTS[o.c.rar]*o.star){o.copies-=COST[o.star];pts-=UPG_PTS[o.c.rar]*o.star;o.star++}}};
  const team=()=>ROLES.map(r=>Math.max(...Object.values(own).filter(o=>o.c.role===r).map(o=>o.c.ovr+o.star-1)));
  const marks={};const mark=(k,v)=>{if(marks[k]===undefined&&v)marks[k]=+(games*MIN_PER_GAME/60).toFixed(1)};
  const snap={};
  while(games*MIN_PER_GAME<hours*60){
    const t=strategy==='premium'?'premium':'basico';
    while(pts>=PACK[t].price)draw(t); upgrade();
    const tm=team(),avg=tm.reduce((a,b)=>a+b,0)/5;
    mark('1ª Épica',Object.values(own).some(o=>o.c.rar==='E'));mark('1ª Lendária',Object.values(own).some(o=>o.c.rar==='L'));
    mark('1ª carta ★3',Object.values(own).some(o=>o.star>=3));mark('time OVR 75',avg>=75);mark('time OVR 80',avg>=80);mark('time OVR 85',avg>=85);
    mark('Lendária ★5',Object.values(own).some(o=>o.c.rar==='L'&&o.star===5));
    [1,5,10,20,40].forEach(h=>{if(snap[h]===undefined&&games*MIN_PER_GAME>=h*60)snap[h]={ovr:+avg.toFixed(1),distintas:Object.keys(own).length}});
    pts+=rewardPerGame();games++;
  }
  return {marks,snap};
}
for(const st of ['basico','premium']){const N=400,agg={},snaps={};
  for(let i=0;i<N;i++){const {marks,snap}=run(st,60);for(const k in marks)(agg[k]=agg[k]||[]).push(marks[k]);for(const h in snap)(snaps[h]=snaps[h]||[]).push(snap[h])}
  const med=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
  console.log('\n== estratégia',st);for(const k in agg)console.log(k.padEnd(14),'mediana',med(agg[k]),'h  (alcançado em',Math.round(100*agg[k].length/N)+'%)');
  for(const h in snaps)console.log('após',h,'h: OVR mediano',med(snaps[h].map(s=>s.ovr)),'· cartas distintas',med(snaps[h].map(s=>s.distintas)),'/',cards.length);
}
