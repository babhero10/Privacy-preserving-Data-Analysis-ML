"use strict";
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0;while(!u)u=r();const v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
const C={ink:'#12161C',ink2:'#4A5360',grid:'#E6E9EE',accent:'#3443E8',good:'#0E8F6E',bad:'#D93A3A',warn:'#B45309',dim:'#9AA3B2'};
const FONT='12px "IBM Plex Sans",system-ui,sans-serif';

function erfc(x){const z=Math.abs(x),t=1/(1+.5*z);const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));return x>=0?r:2-r}
/* ---------- canvas plotting ---------- */
function cv(c){const dpr=window.devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight||w*.5;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}
  const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);return[x,w,h]}
function axes(x,w,h,o){
  const L=46,R=12,T=10,B=36;o.L=L;o.R=R;o.T=T;o.B=B;
  const f=o.log?Math.log10:(v=>v);
  o.X=v=>L+(v-o.x0)/(o.x1-o.x0)*(w-L-R);
  o.Y=v=>h-B-(f(Math.max(v,o.log?o.y0:-1e9))-f(o.y0))/(f(o.y1)-f(o.y0))*(h-T-B);
  x.font=FONT;x.fillStyle=C.ink2;x.strokeStyle=C.grid;x.lineWidth=1;x.textAlign='right';x.textBaseline='middle';
  for(const t of o.yt){const y=o.Y(t);x.beginPath();x.moveTo(L,y);x.lineTo(w-R,y);x.stroke();x.fillText(o.yfmt?o.yfmt(t):t,L-6,y)}
  x.textAlign='center';x.textBaseline='top';
  for(const t of o.xt){const px=o.X(t);x.beginPath();x.moveTo(px,T);x.lineTo(px,h-B);x.stroke();x.fillText(o.xfmt?o.xfmt(t):t,px,h-B+6)}
  x.strokeStyle=C.ink;x.beginPath();x.moveTo(L,T);x.lineTo(L,h-B);x.lineTo(w-R,h-B);x.stroke();
  x.fillStyle=C.ink2;if(o.xlab)x.fillText(o.xlab,(L+w-R)/2,h-16)}
function line(x,o,pts,color,dash,wd){x.save();x.strokeStyle=color;x.lineWidth=wd||2.5;x.setLineDash(dash||[]);x.lineJoin='round';x.beginPath();
  pts.forEach((p,i)=>{const px=o.X(p[0]),py=o.Y(p[1]);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.restore()}

function card(k,v,s,c){return`<div class="stat"><div class="k">${k}</div><div class="v" style="color:${c||'var(--ink)'}">${v}</div><div class="s">${s||''}</div></div>`}
function solveLS(A,a,m,n){
  const M=[];for(let i=0;i<n;i++)M.push(new Float64Array(n+1));
  for(let r=0;r<m;r++){const row=A[r],y=a[r],idx=[];for(let i=0;i<n;i++)if(row[i])idx.push(i);
    for(const i of idx){const Mi=M[i];for(const j of idx)Mi[j]++;Mi[n]+=y}}
  for(let i=0;i<n;i++)M[i][i]+=1e-6;
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];
    for(let r=c+1;r<n;r++){const f=M[r][c]/M[c][c];if(f)for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j]}}
  const x=new Float64Array(n);for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s-=M[i][j]*x[j];x[i]=s/M[i][i]}return x}

/* ---- print mode: ?print builds a static document from every chapter (used to make the PDF notes) ---- */
async function buildPrintDoc(title){
  const doc=document.createElement('div');doc.id='printDoc';
  doc.innerHTML='<div class="ptitle"><div class="eyebrow">Privacy-preserving data analysis</div><h1>'+title+'</h1><p>Static study notes. The interactive version, with live demos and settings, is on the website.</p></div>';
  for(let i=0;i<CH.length;i++){
    const run=enter(i);fast=true;await run;await new Promise(r=>setTimeout(r,80));
    const sec=document.createElement('section');sec.className='pchap';
    sec.innerHTML='<div class="eyebrow">Chapter '+(i+1)+' of '+CH.length+'</div><h2>'+CH[i].title+'</h2><div class="pbody">'+CH[i].body+'</div>';
    const view=document.querySelector('.view.on'),clone=view.cloneNode(true),src=view.querySelectorAll('canvas'),dst=clone.querySelectorAll('canvas');
    src.forEach((c,k)=>{if(!c.clientWidth){dst[k].remove();return}const img=new Image();img.src=c.toDataURL();img.className='pimg';img.style.width=c.clientWidth+'px';img.style.height=c.clientHeight+'px';dst[k].replaceWith(img)});
    clone.querySelectorAll('details.exp,.btnrow,button,.prog,.controls,#proofNext,#proofWorst').forEach(e=>e.remove());
    clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));clone.removeAttribute('id');
    sec.appendChild(clone);doc.appendChild(sec)}
  document.body.appendChild(doc);document.body.classList.add('printing');document.title=title;document.documentElement.dataset.ready='1'}
