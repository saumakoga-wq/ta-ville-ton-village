import React,{useEffect,useMemo,useRef,useState}from'react';
import{CATALOG}from'./data/buildings.js';
const N=24,TW=38,TH=20,INITIAL=100000,fmt=n=>new Intl.NumberFormat('fr-FR').format(n)+' €';
const iso=(x,y)=>({x:(x-y)*TW/2,y:(x+y)*TH/2});
const BUILD_TIMES={banc:30_000,arbre:30_000,parking:2*60_000,boulangerie:2*60_000,coiffeur:2*60_000,pharmacie:2*60_000,restaurant:5*60_000,supermarche:5*60_000,bibliotheque:5*60_000,parc:5*60_000,ecole:10*60_000,college:10*60_000,lycee:10*60_000,mairie:10*60_000,police:8*60_000,pompiers:8*60_000,hopital:15*60_000,gare:15*60_000,stade:15*60_000,piscine:15*60_000,patinoire:15*60_000};
const formatTime=ms=>{const s=Math.max(0,Math.ceil(ms/1000));if(s<60)return `${s} s`;const m=Math.floor(s/60),r=s%60;return r?`${m} min ${String(r).padStart(2,'0')} s`:`${m} min`;};
const formatRemaining=ms=>{const s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60),r=s%60;return m?`${m} min ${String(r).padStart(2,'0')} s`:`${r} s`;};
const CATS=['Services','Éducation','Commerces','Loisirs','Nature','Transports','Mobilier'];
const SCORE_RULES=[
 {id:'edu',name:'Éducation',points:15,ids:['ecole','college','lycee'],hint:'Prévoir une école, un collège ou un lycée.'},
 {id:'health',name:'Santé et sécurité',points:15,ids:['hopital','pharmacie','pompiers','police'],hint:'Ajouter un service de santé ou de sécurité.'},
 {id:'leisure',name:'Sports et loisirs',points:15,ids:['patinoire','stade','piscine'],hint:'Créer un lieu de sport ou de loisirs.'},
 {id:'shops',name:'Commerces',points:10,ids:['boulangerie','coiffeur','supermarche','restaurant'],hint:'Faire vivre les commerces de proximité.'},
 {id:'nature',name:'Environnement',points:15,ids:['parc','arbre'],hint:'Ajouter des espaces verts.'},
 {id:'transport',name:'Transports',points:15,ids:['gare','parking'],hint:'Prévoir une solution de transport.'},
 {id:'budget',name:'Budget maîtrisé',points:10,ids:[],hint:'Garder un budget positif.'},
 {id:'order',name:'Organisation',points:5,ids:[],hint:'Construire au moins 5 éléments.'}
];
function cellKey(x,y){return `${x},${y}`}
export default function App(){
 const canvas=useRef(null),wrap=useRef(null),fileRef=useRef(null),sprites=useRef({});
 const[items,setItems]=useState(()=>{try{return JSON.parse(localStorage.getItem('tvv-v2-items')||'[]').map(i=>({...i,constructionDurationMs:BUILD_TIMES[i.type]??i.constructionDurationMs??30000}))}catch{return[]}});
 const[now,setNow]=useState(Date.now());

 const isComplete=i=>!i.constructionStartedAt || now >= i.constructionStartedAt + (i.constructionDurationMs||0);
 const remainingMs=i=>Math.max(0,(i.constructionStartedAt||0)+(i.constructionDurationMs||0)-now);
 const inProgress=items.filter(i=>!isComplete(i));
 const completedCount=items.length-inProgress.length;
 const[tiles,setTiles]=useState(()=>{try{return JSON.parse(localStorage.getItem('tvv-v2-tiles')||'{}')}catch{return{}}});
 const[selected,setSelected]=useState('boulangerie'),[category,setCategory]=useState('Tous'),[tool,setTool]=useState('build'),[rot,setRot]=useState(0),[zoom,setZoom]=useState(1),[hover,setHover]=useState(null),[message,setMessage]=useState('Choisis une construction puis clique sur une case libre.'),[tab,setTab]=useState('catalogue'),[showScore,setShowScore]=useState(false),[cityName,setCityName]=useState('Ma ville'),[started,setStarted]=useState(false);
 const spent=items.reduce((s,i)=>s+i.price,0),left=INITIAL-spent;
 const catalog=useMemo(()=>category==='Tous'?CATALOG:CATALOG.filter(b=>b.category===category),[category]);
 const score=useMemo(()=>{
  let total=0;const detail=SCORE_RULES.map(r=>{let p=0;if(r.id==='budget')p=left>=0?10:0;else if(r.id==='order')p=completedCount>=5?5:Math.round(completedCount/5*5);else p=items.some(i=>isComplete(i)&&r.ids.includes(i.type))?r.points:0;total+=p;return{...r,earned:p}});return{total,detail};
 },[items,left,now]);
 useEffect(()=>localStorage.setItem('tvv-v2-items',JSON.stringify(items)),[items]);
 useEffect(()=>localStorage.setItem('tvv-v2-tiles',JSON.stringify(tiles)),[tiles]);
 useEffect(()=>{if(inProgress.length===0)return;const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[inProgress.length]);
 const draw=()=>{
  const c=canvas.current;if(!c)return;
  const ctx=c.getContext('2d'),d=window.devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;
  c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);

  // Décor panoramique façon jeu vidéo de gestion.
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#8bcbea');sky.addColorStop(.58,'#d5edf0');sky.addColorStop(1,'#b9dcae');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#fff0a8';ctx.beginPath();ctx.arc(w-86,78,31,0,Math.PI*2);ctx.fill();
  const cloud=(x,y,k)=>{ctx.fillStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.arc(x,y,17*k,0,Math.PI*2);ctx.arc(x+20*k,y-7*k,22*k,0,Math.PI*2);ctx.arc(x+44*k,y,17*k,0,Math.PI*2);ctx.fill()};
  cloud(w*.15,78,.8);cloud(w*.62,118,.65);cloud(w*.84,200,.72);
  ctx.fillStyle='#a4cf98';ctx.beginPath();ctx.moveTo(0,h*.43);ctx.quadraticCurveTo(w*.2,h*.25,w*.42,h*.43);ctx.quadraticCurveTo(w*.7,h*.23,w,h*.41);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8fc58c';ctx.beginPath();ctx.moveTo(0,h*.57);ctx.quadraticCurveTo(w*.24,h*.38,w*.5,h*.56);ctx.quadraticCurveTo(w*.78,h*.38,w,h*.55);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();

  ctx.save();ctx.translate(w/2,h/2-12);ctx.scale(zoom,zoom);
  // Terrain continu : les lignes des cases ne s’affichent qu’en mode construction.
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const p=iso(x,y),px=p.x,py=p.y-N*TH/2;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+TW/2,py+TH/2);ctx.lineTo(px,py+TH);ctx.lineTo(px-TW/2,py+TH/2);ctx.closePath();
    const type=tiles[cellKey(x,y)];
    ctx.fillStyle=type==='road'?'#a9b3b3':type==='green'?'#8fca8b':'#b7d7ad';
    ctx.fill();
    // Le quadrillage global reste masqué : seules les cases de l’aperçu de placement sont dessinées.
    if(type==='road'){ctx.strokeStyle='#eee6cb';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px-TW*.25,py+TH*.5);ctx.lineTo(px+TW*.25,py+TH*.5);ctx.stroke()}
  }

  // Aperçu de l’emprise exacte du bâtiment avant de lancer le chantier.
  if(tool==='build'&&hover&&hover.x>=0&&hover.y>=0&&hover.x<N&&hover.y<N){
    const b=CATALOG.find(v=>v.id===selected);
    if(b){
      const bw=rot%2?b.h:b.w,bh=rot%2?b.w:b.h;
      const blocked=hover.x+bw>N||hover.y+bh>N||items.some(i=>hover.x<i.x+i.w&&hover.x+bw>i.x&&hover.y<i.y+i.h&&hover.y+bh>i.y)||Array.from({length:bh},(_,dy)=>Array.from({length:bw},(_,dx)=>tiles[cellKey(hover.x+dx,hover.y+dy)]).some(Boolean)).some(Boolean);
      const affordable=left>=b.price;
      for(let yy=0;yy<bh;yy++)for(let xx=0;xx<bw;xx++){
        const p=iso(hover.x+xx,hover.y+yy),px=p.x,py=p.y-N*TH/2;
        ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+TW/2,py+TH/2);ctx.lineTo(px,py+TH);ctx.lineTo(px-TW/2,py+TH/2);ctx.closePath();
        ctx.fillStyle=blocked||!affordable?'rgba(220,75,65,.42)':'rgba(255,205,65,.48)';
        ctx.fill();ctx.strokeStyle=blocked||!affordable?'#c94b42':'#e29a22';ctx.lineWidth=2;ctx.stroke();
      }
    }
  }
  items.slice().sort((a,b)=>a.x+a.y-b.x-b.y).forEach(i=>{
    const b=CATALOG.find(v=>v.id===i.type);if(!b)return;
    const p=iso(i.x+(i.w-1)/2,i.y+(i.h-1)/2),cx=p.x,cy=p.y-N*TH/2,ww=(i.w+i.h)*TW/2,hh=(i.w+i.h)*TH/2;
    const buildingDone=isComplete(i);
    ctx.fillStyle='rgba(40,60,45,.2)';ctx.beginPath();ctx.ellipse(cx,cy+hh*.4,ww*.44,hh*.3,0,0,Math.PI*2);ctx.fill();
    const sprite=sprites.current[b.id];
    if(buildingDone&&sprite?.complete&&sprite.naturalWidth){
      const iw=Math.max(ww*1.55,78),ih=iw*(sprite.height/sprite.width);
      ctx.save();ctx.shadowColor='rgba(27,55,42,.28)';ctx.shadowBlur=8;ctx.shadowOffsetY=5;ctx.drawImage(sprite,cx-iw/2,cy-ih*.78,iw,ih);ctx.restore();
    }else if(!buildingDone){
      // Chantier compact, sans image fantôme géante.
      const pct=1-remainingMs(i)/(i.constructionDurationMs||1);
      ctx.fillStyle='#c5a16d';ctx.strokeStyle='#805d39';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(cx,cy-hh*.12);ctx.lineTo(cx+ww*.43,cy+hh*.15);ctx.lineTo(cx,cy+hh*.42);ctx.lineTo(cx-ww*.43,cy+hh*.15);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='#f2c24f';ctx.lineWidth=3;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
      // Petite grue.
      ctx.strokeStyle='#e3a52f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+ww*.12,cy+hh*.06);ctx.lineTo(cx+ww*.12,cy-hh*.72);ctx.lineTo(cx-ww*.28,cy-hh*.72);ctx.moveTo(cx+ww*.12,cy-hh*.72);ctx.lineTo(cx+ww*.34,cy-hh*.58);ctx.stroke();
      ctx.strokeStyle='#9b6a34';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+ww*.29,cy-hh*.6);ctx.lineTo(cx+ww*.29,cy-hh*.27);ctx.stroke();
      // Matériaux.
      ctx.fillStyle='#d58b42';ctx.fillRect(cx-ww*.2,cy+hh*.08,ww*.16,hh*.09);
      ctx.fillStyle='#7f9eaa';ctx.fillRect(cx-ww*.02,cy+hh*.13,ww*.13,hh*.07);
      const barW=Math.max(46,ww*.72),barY=cy-hh*.5;
      ctx.fillStyle='rgba(26,53,44,.88)';ctx.fillRect(cx-barW/2,barY,barW,7);
      ctx.fillStyle='#f7c64d';ctx.fillRect(cx-barW/2,barY,barW*Math.max(0,Math.min(1,pct)),7);
      ctx.textAlign='center';ctx.font='bold 10px system-ui';ctx.fillStyle='#244235';
      ctx.fillText(`Chantier · ${formatRemaining(remainingMs(i))}`,cx,cy+hh*.58+12);
    }else{
      ctx.fillStyle=b.color;ctx.strokeStyle='#526d58';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy-hh*.2);ctx.lineTo(cx+ww*.43,cy+hh*.15);ctx.lineTo(cx,cy+hh*.5);ctx.lineTo(cx-ww*.43,cy+hh*.15);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.textAlign='center';ctx.font='22px sans-serif';ctx.fillText(b.emoji,cx,cy+5);
    }
    if(buildingDone){ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.fillStyle='#244235';ctx.fillText(b.name,cx,cy+hh*.55+12)}
  });
  ctx.restore();
 };
 useEffect(()=>{CATALOG.forEach(b=>{if(b.image&&!sprites.current[b.id]){const im=new Image();im.onload=draw;im.src=b.image;sprites.current[b.id]=im}});},[]);
 useEffect(()=>{draw();const ro=new ResizeObserver(draw);if(wrap.current)ro.observe(wrap.current);return()=>ro.disconnect()},[items,tiles,zoom,hover,now,tool,selected,rot,left]);
 function coords(e){const r=canvas.current.getBoundingClientRect(),w=r.width,h=r.height,sx=(e.clientX-r.left-w/2)/zoom,sy=(e.clientY-r.top-h/2+12)/zoom+N*TH/2;return{x:Math.floor(sx/TW+sy/TH),y:Math.floor(sy/TH-sx/TW)}}
 function onMove(e){const p=coords(e);setHover(p)}
 function onLeave(){setHover(null)}
 function onClick(e){
  const{x,y}=coords(e);if(x<0||y<0||x>=N||y>=N){setMessage('Clique à l’intérieur du terrain.');return}
  if(tool==='erase'){const hit=items.find(i=>x>=i.x&&x<i.x+i.w&&y>=i.y&&y<i.y+i.h);if(hit){setItems(a=>a.filter(v=>v.uid!==hit.uid));setMessage(`${hit.name} supprimé · ${fmt(hit.price)} remboursés.`)}else if(tiles[cellKey(x,y)]){setTiles(t=>{const n={...t};delete n[cellKey(x,y)];return n});setMessage('Aménagement retiré.')}else setMessage('Rien à supprimer sur cette case.');return}
  if(tool==='road'||tool==='green'){if(items.some(i=>x>=i.x&&x<i.x+i.w&&y>=i.y&&y<i.y+i.h)){setMessage('Cette case est occupée par un bâtiment.');return}setTiles(t=>({...t,[cellKey(x,y)]:tool}));setMessage(tool==='road'?'Route ajoutée.':'Espace vert ajouté.');return}
  const b=CATALOG.find(v=>v.id===selected);if(!b)return;const bw=rot%2?b.h:b.w,bh=rot%2?b.w:b.h;
  const over=items.some(i=>x<i.x+i.w&&x+bw>i.x&&y<i.y+i.h&&y+bh>i.y);
  const overTiles=Array.from({length:bh},(_,dy)=>Array.from({length:bw},(_,dx)=>tiles[cellKey(x+dx,y+dy)]).some(Boolean)).some(Boolean);
  if(x+bw>N||y+bh>N||over||overTiles){setMessage('Emplacement impossible : cases occupées, aménagées ou hors terrain.');return}
  if(left<b.price){setMessage('Budget insuffisant pour cette construction.');return}
  const duration=BUILD_TIMES[b.id]??30000;setItems(a=>[...a,{uid:crypto.randomUUID(),type:b.id,name:b.name,price:b.price,x,y,w:bw,h:bh,rotation:rot%2?90:0,constructionStartedAt:Date.now(),constructionDurationMs:duration}]);setNow(Date.now());setMessage(`Chantier lancé : ${b.name} · durée ${formatTime(duration)}.`)
 }
 function exportCity(){const data={version:3,name:cityName,items,tiles};const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=u;a.download='ta-ville-ton-village.json';a.click();URL.revokeObjectURL(u)}
 function importCity(e){const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!Array.isArray(d.items))throw Error();const valid=d.items.filter(i=>CATALOG.some(b=>b.id===i.type)&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.x>=0&&i.y>=0&&i.x+i.w<=N&&i.y+i.h<=N);setItems(valid.map(i=>({...i,constructionDurationMs:BUILD_TIMES[i.type]??i.constructionDurationMs??30000})));setTiles(d.tiles&&typeof d.tiles==='object'?d.tiles:{});setCityName(d.name||'Ma ville');setMessage('Ville importée avec succès.')}catch{setMessage('Fichier invalide ou incompatible.')} };rd.readAsText(f);e.target.value=''}
 function newCity(){if(confirm('Créer une nouvelle ville ? La ville actuelle sera effacée de cet appareil. Pense à l’exporter avant.')){setItems([]);setTiles({});setCityName('Ma ville');setStarted(false);setMessage('Nouvelle ville créée. À toi de jouer !')}}
 function resetSave(){if(confirm('Effacer la sauvegarde locale de cette ville ?')){localStorage.removeItem('tvv-v2-items');localStorage.removeItem('tvv-v2-tiles');setItems([]);setTiles({});setMessage('Sauvegarde réinitialisée.')}}
 const selectedBuilding=CATALOG.find(b=>b.id===selected);
 return <main className="app">
  <header><div><small>JEU DE CONSTRUCTION · 11–17 ANS</small><h1>🏘️ Ta Ville, Ton Village</h1><p>Imagine, aménage et fais grandir ta commune.</p></div><div className="actions"><button onClick={exportCity}>⇩ Exporter</button><label className="btn">⇧ Importer<input ref={fileRef} type="file" accept="application/json" onChange={importCity}/></label><button onClick={newCity}>＋ Nouvelle ville</button></div></header>
  <section className="stats"><div><small>BUDGET DE DÉPART</small><strong>{fmt(INITIAL)}</strong></div><div><small>DÉPENSÉ</small><strong>{fmt(spent)}</strong></div><div><small>BUDGET RESTANT</small><strong className={left<0?'danger':''}>{fmt(left)}</strong></div><div><small>CONSTRUCTIONS</small><strong>{completedCount}/{items.length}</strong><small>{inProgress.length} chantier(s) en cours</small></div><div><small>SCORE ACTUEL</small><strong>{score.total}/100</strong></div></section>
  <div className="layout"><aside><div className="side-tabs"><button className={tab==='catalogue'?'active':''} onClick={()=>setTab('catalogue')}>🏗️ Catalogue</button><button className={tab==='score'?'active':''} onClick={()=>setTab('score')}>⭐ Objectifs</button><button className={tab==='help'?'active':''} onClick={()=>setTab('help')}>❔ Aide</button></div>
   {tab==='catalogue'&&<><nav>{['Tous',...CATS].map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</nav><div className="cards">{catalog.map(b=><button key={b.id} className={'card '+(selected===b.id&&tool==='build'?'chosen':'')} onClick={()=>{setSelected(b.id);setTool('build')}}>{b.image?<img className="building-thumb" src={b.image} alt={b.name}/>:<span className="fallback">{b.emoji}</span>}<b>{b.name}</b><strong>{fmt(b.price)}</strong><small>{b.w} × {b.h} cases</small><small>⏱ {formatTime(BUILD_TIMES[b.id]??30000)}</small></button>)}</div></>}
   {tab==='score'&&<div className="score-panel"><div className="score-total"><b>{score.total}/100</b><span>Score de ta commune</span></div>{score.detail.map(r=><div className="score-row" key={r.id}><div><b>{r.name}</b><small>{r.hint}</small></div><strong>{r.earned}/{r.points}</strong></div>)}</div>}
   {tab==='help'&&<div className="help"><h3>Comment jouer ?</h3><ol><li>Choisis un bâtiment dans le catalogue.</li><li>Clique sur une case du terrain pour lancer le chantier. Le bâtiment reste en chantier pendant sa durée réelle, puis devient terminé automatiquement. Le temps continue même si tu fermes le jeu.</li><li>Les bâtiments occupent plusieurs cases : ils ne peuvent pas se chevaucher.</li><li>Utilise les routes et les espaces verts pour aménager ta commune.</li><li>Surveille ton budget et complète les objectifs pour gagner des points. Seuls les bâtiments terminés comptent dans le score.</li></ol><p><b>Astuce :</b> utilise ↻ Pivoter pour tourner un bâtiment avant de le poser.</p><p>La partie est libre : tu peux construire à ton rythme et revenir plus tard.</p></div>}
  </aside>
  <section className="city"><div className="tools"><button className={tool==='build'?'active':''} onClick={()=>setTool('build')}>＋ Construire</button><button className={tool==='road'?'active':''} onClick={()=>setTool('road')}>▰ Route</button><button className={tool==='green'?'active':''} onClick={()=>setTool('green')}>♣ Espace vert</button><button className={tool==='erase'?'active':''} onClick={()=>setTool('erase')}>⌫ Gomme</button><button onClick={()=>{setRot(v=>v+1);setMessage('Rotation : '+((rot+1)%2?'90°':'0°'))}}>↻ Pivoter</button><span className="message">{tool==='build'&&selectedBuilding?`Sélection : ${selectedBuilding.name} · ${selectedBuilding.w}×${selectedBuilding.h} cases${rot%2?' · tourné':''} — ${message}`:message}</span><button onClick={()=>setZoom(z=>Math.max(.55,z-.1))} aria-label="Dézoomer">−</button><button onClick={()=>setZoom(z=>Math.min(1.55,z+.1))} aria-label="Zoomer">＋</button></div>
   <div className="map" ref={wrap}><canvas ref={canvas} onClick={onClick} onMouseMove={onMove} onMouseLeave={onLeave}/><label>TERRAIN 24 × 24 CASES</label><div className="map-legend"><span>🟩 Terrain</span><span>⬜ Route</span><span>🌳 Espace vert</span></div></div><footer><span>{inProgress.length?`${inProgress.length} chantier(s) en cours · `:''}{message}</span><span>✓ Sauvegarde automatique activée sur cet appareil</span></footer></section></div>
  <section className="bottom"><div><h2>Ta commune en chiffres</h2><p>{completedCount} construction(s) terminée(s) · {inProgress.length} chantier(s) en cours · {Object.values(tiles).filter(t=>t==='road').length} case(s) de route · {Object.values(tiles).filter(t=>t==='green').length} espace(s) vert(s)</p></div><div className="bottom-actions"><button onClick={()=>setShowScore(v=>!v)}>{showScore?'Masquer':'Voir'} le bilan</button><button onClick={resetSave}>Effacer la sauvegarde</button></div>{showScore&&<div className="score-summary"><b>Score : {score.total}/100</b><p>{score.total>=80?'Une commune très complète !':score.total>=50?'Bon début : continue à équilibrer ta ville.':'Il reste des objectifs à remplir pour développer ta commune.'}</p></div>}</section>
 </main>
}
