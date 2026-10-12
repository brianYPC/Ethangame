import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './style.css';
import {CELL,key,strength,supportedKeys,blastDamage} from './physics.js';
const $=id=>document.getElementById(id),canvas=$('world');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});}catch{$('message').textContent='A WebGL-capable browser is required. Enable hardware acceleration.';throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9eafbc);scene.fog=new THREE.Fog(0x9eafbc,90,200);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,300);camera.position.set(30,24,35);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,7,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.04;controls.minDistance=8;controls.maxDistance=110;
scene.add(new THREE.HemisphereLight(0xddeaff,0x586052,2));
const sun=new THREE.DirectionalLight(0xffe5bf,3.5);sun.position.set(-25,50,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:120});sun.shadow.bias=-.0005;scene.add(sun);
function texture(type){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 const base={concrete:[152,151,143],brick:[147,75,51],steel:[88,105,116],glass:[73,119,144]}[type];
 let seed=17;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const data=ctx.createImageData(128,128);for(let i=0;i<data.data.length;i+=4){const noise=(rand()-.5)*(type==='concrete'?32:18);for(let j=0;j<3;j++)data.data[i+j]=base[j]+noise;data.data[i+3]=255;}ctx.putImageData(data,0,0);
 if(type==='brick'){ctx.strokeStyle='#b7a895';ctx.lineWidth=3;for(let y=0;y<=128;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();for(let x=(y/32%2)*32;x<128;x+=64){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+32);ctx.stroke();}}}
 if(type==='steel'){ctx.fillStyle='#b2bac0';for(const x of [9,119])for(const y of [9,119]){ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}}
 if(type==='glass'){ctx.strokeStyle='#304653';ctx.lineWidth=6;ctx.strokeRect(0,0,128,128);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,64);ctx.lineTo(128,64);ctx.stroke();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const materials=Object.fromEntries(Object.keys(strength).map(type=>[type,new THREE.MeshStandardMaterial({map:texture(type),roughness:type==='glass'?.16:type==='steel'?.38:.93,metalness:type==='steel'?.8:type==='glass'?.35:0,color:0xffffff})]));
const ground=new THREE.Mesh(new THREE.PlaneGeometry(220,220),new THREE.MeshStandardMaterial({color:0x777e7c,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(64,32,0xabb1aa,0x8d9691);grid.position.set(1,.015,1);grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
// Distant industrial scenery gives the construction yard scale.
const sceneryMat=new THREE.MeshStandardMaterial({color:0x66727a,roughness:.9});
for(let i=0;i<16;i++){const h=4+(i*7%13),m=new THREE.Mesh(new THREE.BoxGeometry(8,h,10),sceneryMat);m.position.set((i-8)*13,h/2,-65-(i%3)*8);m.receiveShadow=true;scene.add(m);}
const blockGeo=new THREE.BoxGeometry(1.96,1.96,1.96),rubbleGeo=new THREE.BoxGeometry(1,1,1);
const blocks=new Map(),debris=[],effects=[];
let tool='build',floor=0,broken=0,nukeCooldown=0,shake=0,hover=null;
const ghost=new THREE.Mesh(blockGeo,new THREE.MeshBasicMaterial({color:0x9bdda8,transparent:true,opacity:.32,depthWrite:false}));const edges=new THREE.LineSegments(new THREE.EdgesGeometry(blockGeo),new THREE.LineBasicMaterial({color:0xc9ffe0}));ghost.add(edges);scene.add(ghost);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),point=new THREE.Vector3();
function message(text){$('message').textContent=text;}
function stats(){$('count').textContent=`${blocks.size} blocks`;$('damage').textContent=broken?`${broken} blocks destroyed`:'Site intact';}
function addBlock(x,y,z,type){const k=key(x,y,z);if(blocks.has(k)||blocks.size>=1800)return false;const m=new THREE.Mesh(blockGeo,materials[type]);m.position.set(x*CELL,y*CELL+1,z*CELL);m.castShadow=m.receiveShadow=true;const b={x,y,z,type,hp:strength[type],m};m.userData.block=b;scene.add(m);blocks.set(k,b);return true;}
function tower(){let ox=0;while([...blocks.values()].some(b=>Math.abs(b.x-ox)<=3&&Math.abs(b.z)<=3)){ox+=8;if(ox>24){message('Clear some space before adding another tower.');return;}}
 for(let y=0;y<8;y++)for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
  const edge=Math.abs(x)===2||Math.abs(z)===2,corner=Math.abs(x)===2&&Math.abs(z)===2;
  if(y%3===0||edge)addBlock(ox+x,y,z,corner?'steel':y%3===0?'concrete':edge&&x===0&&z===2?'brick':'glass');
 }
 stats();message('Tower ready. Add your own sections or choose a weapon.');}
function fragment(b,origin,power,falling=false){
 const count=falling?1:b.type==='glass'?5:3;
 for(let j=0;j<count;j++){
  if(debris.length>=550){const old=debris.shift();scene.remove(old.m);}
  const size=falling?1.85:.35+Math.random()*.65,m=new THREE.Mesh(rubbleGeo,materials[b.type]);m.scale.setScalar(size);m.position.copy(b.m.position);if(!falling)m.position.add(new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5));m.castShadow=true;scene.add(m);
  const dir=m.position.clone().sub(origin);dir.y+=2;dir.normalize();const v=dir.multiplyScalar(falling?2:Math.min(25,power*.025)*( .4+Math.random()));v.y+=falling?0:3+Math.random()*5;
  debris.push({m,v,spin:new THREE.Vector3(Math.random()*4,Math.random()*4,Math.random()*4),life:18,radius:size/2});
 }
}
function remove(b,origin,power,falling=false){blocks.delete(key(b.x,b.y,b.z));scene.remove(b.m);fragment(b,origin,power,falling);broken++;}
function collapse(){const supported=supportedKeys([...blocks.values()]);for(const [k,b] of blocks)if(!supported.has(k))remove(b,b.m.position.clone().add(new THREE.Vector3(0,-2,0)),80,true);}
const explosionGeo=new THREE.SphereGeometry(1,20,12),ringGeo=new THREE.TorusGeometry(1,.035,8,64);
function effect(geo,pos,color,size,duration,kind){const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false});const m=new THREE.Mesh(geo,mat);m.position.copy(pos);scene.add(m);effects.push({m,age:0,duration,size,kind});return m;}
function blast(pos,nuclear){const radius=nuclear?31:4.5,power=nuclear?2000:180;
 for(const b of [...blocks.values()]){const damage=blastDamage(b.m.position.distanceTo(pos),radius,power);b.hp-=damage;if(b.hp<=0)remove(b,pos,power);}
 collapse();stats();shake=nuclear?1.2:.18;
 effect(explosionGeo,pos,0xffc266,nuclear?16:3,nuclear?2:.4,'fire');
 const ring=effect(ringGeo,new THREE.Vector3(pos.x,.15,pos.z),0xffde9e,nuclear?48:7,nuclear?2.7:.6,'ring');ring.rotation.x=Math.PI/2;
 if(nuclear){
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2;effect(explosionGeo,new THREE.Vector3(pos.x+Math.cos(a)*6,pos.y+12+Math.random()*3,pos.z+Math.sin(a)*6),0x55514a,6+Math.random()*3,9,'smoke');}
  for(let i=0;i<7;i++)effect(explosionGeo,new THREE.Vector3(pos.x,pos.y+i*2,pos.z),0x6a6255,3,8,'smoke');
  nukeCooldown=5;message('Nuclear blast detonated. Unsupported structures are collapsing.');
 }else message('Blaster impact. Break the foundations to bring a building down.');
}
function aim(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);}
function pickBuild(e){aim(e);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-(floor*CELL+.02));if(!ray.ray.intersectPlane(plane,point))return null;const x=Math.round(point.x/CELL),z=Math.round(point.z/CELL);return Math.abs(x)<=24&&Math.abs(z)<=24?{x,y:floor,z}:null;}
let down=null;
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
canvas.addEventListener('pointermove',e=>{hover=pickBuild(e);});
canvas.addEventListener('pointerleave',()=>{hover=null;});
canvas.addEventListener('pointerup',e=>{
 if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||e.button!==0){down=null;return;}down=null;
 if(tool==='build'){
  const p=pickBuild(e);if(!p)return;const neighbors=[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
  if(p.y>0&&!neighbors.some(([x,y,z])=>blocks.has(key(p.x+x,p.y+y,p.z+z)))){message('Upper blocks need support. Build beside or above an existing section.');return;}
  if(addBlock(p.x,p.y,p.z,$('material').value)){stats();message('Section placed. Change height to build another floor.');}else message('That cell is occupied or the site is full.');
 }else{
  aim(e);const hits=ray.intersectObjects([...blocks.values()].map(b=>b.m));let hit=hits[0]?.point;
  if(!hit)hit=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());
  if(!hit||Math.abs(hit.x)>60||Math.abs(hit.z)>60)return;
  if(tool==='nuke'&&nukeCooldown>0){message(`Nuclear blast recharging: ${Math.ceil(nukeCooldown)} seconds.`);return;}
  if(tool==='blaster'){
   const start=camera.position.clone().add(new THREE.Vector3(1,-1,-1)),dir=hit.clone().sub(start),beam=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,dir.length(),8),new THREE.MeshBasicMaterial({color:0xff5840,transparent:true}));beam.position.copy(start).add(hit).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());scene.add(beam);effects.push({m:beam,age:0,duration:.15,size:1,kind:'beam'});
  }
  blast(hit.clone(),tool==='nuke');
 }
});
function selectTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('selected',b.dataset.tool===t));ghost.visible=t==='build';message(t==='build'?'Click the grid to place a section. Use the height slider for upper floors.':t==='blaster'?'Click a building to fire the blaster. Drag to inspect another side.':'Click a target to detonate a fictional nuclear blast.');}
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>selectTool(b.dataset.tool);
function setFloor(n){floor=Math.max(0,Math.min(11,n));$('height').value=floor;$('height-label').textContent=floor+1;hover=null;}
$('height').oninput=e=>setFloor(Number(e.target.value));$('tower').onclick=tower;
function reset(){for(const b of blocks.values())scene.remove(b.m);blocks.clear();for(const d of debris)scene.remove(d.m);debris.length=0;for(const e of effects){scene.remove(e.m);e.m.material.dispose();}effects.length=0;broken=0;nukeCooldown=0;shake=0;setFloor(0);tower();selectTool('build');}
$('reset').onclick=reset;
addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(document.activeElement.tagName))return;const k=e.key.toLowerCase();if(['1','2','3'].includes(k))selectTool(['build','blaster','nuke'][Number(k)-1]);if(k==='q')setFloor(floor-1);if(k==='e')setFloor(floor+1);});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();reset();
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);nukeCooldown=Math.max(0,nukeCooldown-dt);
 ghost.visible=tool==='build'&&!!hover;if(hover){ghost.position.set(hover.x*CELL,hover.y*CELL+1,hover.z*CELL);ghost.material.color.set(blocks.has(key(hover.x,hover.y,hover.z))?0xff7878:0x9bdda8);}
 for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;d.v.y-=18*dt;d.m.position.addScaledVector(d.v,dt);d.m.rotation.x+=d.spin.x*dt;d.m.rotation.y+=d.spin.y*dt;d.m.rotation.z+=d.spin.z*dt;
  if(d.m.position.y<d.radius){d.m.position.y=d.radius;d.v.y=Math.abs(d.v.y)*.25;d.v.x*=.85;d.v.z*=.85;d.spin.multiplyScalar(.8);if(Math.abs(d.v.y)<.6)d.v.y=0;}
  if(d.life<0){scene.remove(d.m);debris.splice(i,1);}
 }
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.age+=dt;const f=e.age/e.duration;e.m.material.opacity=(1-f)*(e.kind==='smoke'?.5:.9);if(e.kind!=='beam')e.m.scale.setScalar(e.size*(e.kind==='smoke'?.7+f*.6:.15+f));if(e.kind==='smoke')e.m.position.y+=dt*1.4;if(f>=1){scene.remove(e.m);e.m.material.dispose();if(e.kind==='beam')e.m.geometry.dispose();effects.splice(i,1);}}
 controls.update();const offset=new THREE.Vector3();if(shake>0){shake=Math.max(0,shake-dt);offset.set((Math.random()-.5)*shake,(Math.random()-.5)*shake,0);camera.position.add(offset);}renderer.render(scene,camera);camera.position.sub(offset);
}frame();
// Read-only diagnostic state for automated smoke checks.
window.demolitionState=()=>({blocks:blocks.size,debris:debris.length,destroyed:broken,tool,effects:effects.length});
