import {CELL} from './physics.js';
export const FIXED_STEP=1/60;
const pose=[
 [0,.93,0],[0,1.38,0],[0,1.77,0],
 [-.22,1.38,0],[-.4,1.14,0],[-.52,.94,0],
 [.22,1.38,0],[.4,1.14,0],[.52,.94,0],
 [-.15,.91,0],[-.15,.51,0],[-.15,.1,.08],
 [.15,.91,0],[.15,.51,0],[.15,.1,.08]
];
export const BONES=[[0,1],[1,2],[1,3],[3,4],[4,5],[1,6],[6,7],[7,8],[0,9],[9,10],[10,11],[0,12],[12,13],[13,14]];
const brace=[[3,6],[0,3],[0,6],[9,12]];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function createRagdoll(x,y,z,yaw=0){
 const nodes=pose.map(([dx,dy,dz],i)=>{
  const p={x:x+dx*Math.cos(yaw)+dz*Math.sin(yaw),y:y+dy,z:z-dx*Math.sin(yaw)+dz*Math.cos(yaw)};
  return {p,previous:{...p},radius:i===2?.19:.075};
 });
 const joints=[...BONES,...brace].map(([a,b])=>({a,b,length:distance(nodes[a].p,nodes[b].p)}));
 return {nodes,joints,active:false,ragdoll:false,quiet:0};
}
export function explodeRagdoll(body,origin,radius,power){
 const center=body.nodes[0].p,dist=distance(center,origin);if(dist>=radius)return false;
 const falloff=1-dist/radius,dx=center.x-origin.x,dz=center.z-origin.z,len=Math.hypot(dx,dz)||1;
 const speed=power*(.35+.65*falloff),ux=dx/len,uz=dz/len;
 body.ragdoll=true;body.active=true;body.quiet=0;
 for(let i=0;i<body.nodes.length;i++){
  const n=body.nodes[i],twist=(n.p.y-center.y)*3;
  n.previous.x=n.p.x-(ux*speed+uz*twist+Math.sin(i*2)*.5)*FIXED_STEP;
  n.previous.y=n.p.y-(4+speed*.5+(i===2?1.5:0))*FIXED_STEP;
  n.previous.z=n.p.z-(uz*speed-ux*twist+Math.cos(i*2)*.5)*FIXED_STEP;
 }
 return true;
}
function collide(node,blocks){
 const p=node.p,old=node.previous,r=node.radius;
 if(p.y<r){const vx=p.x-old.x,vy=p.y-old.y,vz=p.z-old.z;p.y=r;old.x=p.x-vx*.72;old.z=p.z-vz*.72;old.y=r+Math.min(0,vy)*.16;}
 for(const b of blocks){
  if(Math.abs(p.x-b.x*CELL)>=CELL/2+r||Math.abs(p.z-b.z*CELL)>=CELL/2+r||p.y<=b.y*CELL-r||p.y>=(b.y+1)*CELL+r)continue;
  const lo=[b.x*CELL-CELL/2-r,b.y*CELL-r,b.z*CELL-CELL/2-r],hi=[b.x*CELL+CELL/2+r,(b.y+1)*CELL+r,b.z*CELL+CELL/2+r],v=[p.x,p.y,p.z];
  if(v.some((n,i)=>n<=lo[i]||n>=hi[i]))continue;
  let axis=0,target=lo[0],depth=v[0]-lo[0];
  for(let i=0;i<3;i++)for(const edge of [lo[i],hi[i]])if(Math.abs(v[i]-edge)<depth){axis=i;target=edge;depth=Math.abs(v[i]-edge);}
  const k=['x','y','z'][axis],velocity=p[k]-old[k];p[k]=target;old[k]=target+velocity*.12;
 }
}
export function stepRagdoll(body,blocks=[]){
 if(!body.active)return;
 for(const n of body.nodes){
  const {p,previous}=n,vx=(p.x-previous.x)*.995,vy=(p.y-previous.y)*.995,vz=(p.z-previous.z)*.995;
  previous.x=p.x;previous.y=p.y;previous.z=p.z;p.x+=vx;p.y+=vy-18*FIXED_STEP*FIXED_STEP;p.z+=vz;
 }
 for(let pass=0;pass<8;pass++){
  for(const {a,b,length} of body.joints){const p=body.nodes[a].p,q=body.nodes[b].p,dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z,len=Math.hypot(dx,dy,dz)||.0001,c=(len-length)/len*.5;p.x+=dx*c;p.y+=dy*c;p.z+=dz*c;q.x-=dx*c;q.y-=dy*c;q.z-=dz*c;}
  for(const n of body.nodes)collide(n,pass%3===0||pass===7?blocks:[]);
 }
 const motion=Math.max(...body.nodes.map(n=>distance(n.p,n.previous)));
 body.quiet=motion<.007?body.quiet+1:0;if(body.quiet>70)body.active=false;
}
export function jointError(body){return Math.max(...body.joints.map(({a,b,length})=>Math.abs(distance(body.nodes[a].p,body.nodes[b].p)-length)));}
