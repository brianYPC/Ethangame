import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {blastDamage} from './physics.js';
import {loopLength,sampleLoop,roadBlocked} from './city-paths.js';
const palette=[0xc6624d,0x4d86b6,0xe4b94c,0x75a498,0xd8d8d1,0x73718c];
function facade(floors,color){
 const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,256,512);
 for(let f=0;f<floors;f++)for(let col=0;col<4;col++){const left=14+col*61,top=12+f*480/floors,height=480/floors-25,g=x.createLinearGradient(0,top,0,top+height);g.addColorStop(0,'#819eab');g.addColorStop(.4,'#395360');g.addColorStop(1,'#1a303d');x.fillStyle='#e3dfd4';x.fillRect(left-3,top-3,39,height+6);x.fillStyle=g;x.fillRect(left,top,33,height);x.strokeStyle='#a6b9bd';x.lineWidth=2;x.beginPath();x.moveTo(left+16,top);x.lineTo(left+16,top+height);x.stroke();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function signTexture(text,color='#ddc99b'){
 const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#20333d';x.fillRect(0,0,256,64);x.fillStyle=color;x.font='bold 24px Arial';x.textAlign='center';x.fillText(text,128,42);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export class City {
 constructor(scene){
  this.scene=scene;this.buildings=[];this.cars=[];this.colliders=[];this.time=0;this.carMeshes=[];
  const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  this.asphalt=mat(0x343c42);this.paving=mat(0xb3b0a3);this.paint=mat(0xdcd9c6);this.green=mat(0x618867);this.steel=mat(0x53636b,.45,.6);
  const add=(parent,geo,material,x,y,z)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;};this.addMesh=add;
  const roadGeo=[],curbGeo=[],paintGeo=[];
  const box=(list,w,h,d,x,y,z)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);list.push(g);};
  for(const direction of [-1,1]){
   box(roadGeo,6,.02,32,direction*12,.018,0);box(roadGeo,32,.02,6,0,.018,direction*12);
   box(curbGeo,1.6,.09,18,direction*8,.045,0);box(curbGeo,18,.09,1.6,0,.045,direction*8);
   box(curbGeo,1.5,.09,34,direction*16,.045,0);box(curbGeo,34,.09,1.5,0,.045,direction*16);
   for(let p=-7;p<=7;p+=4){box(paintGeo,.12,.014,2,direction*12,.037,p);box(paintGeo,2,.014,.12,p,.037,direction*12);}
   for(let p=-14.5;p<-9;p+=.85){box(paintGeo,.45,.014,3.4,p,.038,direction*6);box(paintGeo,3.4,.014,.45,direction*6,.038,p);box(paintGeo,.45,.014,3.4,-p,.038,direction*6);box(paintGeo,3.4,.014,.45,direction*6,.038,-p);}
  }
  for(const [geos,material] of [[roadGeo,this.asphalt],[curbGeo,this.paving],[paintGeo,this.paint]]){const mesh=new THREE.Mesh(mergeGeometries(geos),material);mesh.receiveShadow=true;scene.add(mesh);for(const g of geos)g.dispose();}
  const sites=[[-24,0,5,'CITY CAFE','#b9a78e'],[24,0,6,'MARKET','#a9ada6'],[0,-24,7,'CENTRAL BANK','#a7b1b7'],[0,24,4,'RECORDS','#b9a393'],[-24,-24,6,'APARTMENTS','#b4b8aa'],[24,-24,8,'OFFICES','#9aaeb8'],[0,-44,9,'SKYLINE','#8e9fae']];
  for(const [x,z,floors,name,color] of sites){
   const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=Math.abs(x)>Math.abs(z)?-Math.sign(x)*Math.PI/2:z>0?Math.PI:0;scene.add(group);
   const height=floors*2,material=new THREE.MeshStandardMaterial({map:facade(floors,color),roughness:.7}),body=add(group,new THREE.BoxGeometry(10,height,10),material,0,height/2,0);body.castShadow=true;
   add(group,new THREE.BoxGeometry(10.5,.22,10.5),this.steel,0,height+.11,0);add(group,new THREE.BoxGeometry(1.5,.6,2.2),this.paving,-2,height+.5,-2);
   add(group,new THREE.BoxGeometry(8,.16,1.5),mat(0x517f78),0,2.25,5.45);add(group,new THREE.PlaneGeometry(7,.85),new THREE.MeshStandardMaterial({map:signTexture(name),roughness:.6}),0,2.8,5.02);
   const door=add(group,new THREE.BoxGeometry(1.1,1.8,.04),mat(0x213e4d,.2,.2),0,.9,5.03);door.castShadow=true;
   body.userData.cityBuilding=this.buildings.length;this.buildings.push({x,z,height,floors,name,group,body,hp:240,destroyed:false});
  }
  for(const [x,z] of [[-17,-17],[17,-17],[-17,17],[17,17],[-17,0],[17,0],[0,-17],[0,17]]){
   const pole=add(scene,new THREE.CylinderGeometry(.055,.075,4,8),this.steel,x,2,z);pole.castShadow=true;add(scene,new THREE.BoxGeometry(.6,.14,.28),mat(0xffe4b7,.4),x,4,z);
  }
  for(const [x,z] of [[-8,-8],[8,-8],[-8,8],[8,8],[-19,-8],[19,-8],[-19,8],[19,8]]){add(scene,new THREE.BoxGeometry(1,.4,1),this.paving,x,.2,z);const trunk=add(scene,new THREE.CylinderGeometry(.07,.11,1.9,8),mat(0x665347),x,1.1,z);trunk.castShadow=true;const crown=add(scene,new THREE.IcosahedronGeometry(1.1,1),this.green,x,2.65,z);crown.castShadow=true;}
  for(const [x,z] of [[-8,3],[8,-3],[3,8],[-3,-8]]){add(scene,new THREE.BoxGeometry(1.6,.12,.5),mat(0x987c58),x,.55,z);add(scene,new THREE.BoxGeometry(1.6,.6,.1),this.steel,x,.83,z+.23);}
  for(let i=0;i<6;i++)this.createCar(i,mat(palette[i],.3,.35));
  this.reset();
 }
 rebuildColliders(){this.colliders=[];for(const b of this.buildings)if(!b.destroyed)for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)for(let y=0;y<b.floors;y++)this.colliders.push({x:b.x/2+x,y,z:b.z/2+z});}
 createCar(i,paint){
  const group=new THREE.Group();this.scene.add(group);const car={id:i+1,group,lane:i<3?13.25:10.75,direction:i<3?1:-1,speed:3.4+i*.12,distance:(i%3)*loopLength(i<3?13.25:10.75)/3,wheels:[],wrecked:false,v:new THREE.Vector3(),age:0};
  const dark=new THREE.MeshStandardMaterial({color:0x18222a,roughness:.85}),glass=new THREE.MeshStandardMaterial({color:0x385b70,metalness:.4,roughness:.12});
  const part=(geo,material,x,y,z)=>{const m=this.addMesh(group,geo,material,x,y,z);m.castShadow=true;this.carMeshes.push(m);m.userData.car=car;return m;};
  part(new THREE.BoxGeometry(1.7,.45,3.2),paint,0,.58,0);part(new THREE.BoxGeometry(1.5,.55,1.7),glass,0,1.05,-.1);part(new THREE.BoxGeometry(1.5,.08,1.7),paint,0,1.35,-.1);
  for(const x of [-.85,.85])for(const z of [-1.08,1.08]){const axle=new THREE.Group();axle.position.set(x,.32,z);axle.rotation.z=Math.PI/2;group.add(axle);const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.2,12),dark);axle.add(wheel);car.wheels.push(wheel);}
  for(const x of [-.55,.55]){part(new THREE.BoxGeometry(.32,.12,.05),new THREE.MeshStandardMaterial({color:0xfff1c9,emissive:0xe7d49b,emissiveIntensity:.4}),x,.63,1.63);part(new THREE.BoxGeometry(.32,.12,.05),new THREE.MeshStandardMaterial({color:0xa74836}),x,.63,-1.63);}
  this.cars.push(car);
 }
 update(dt,blocks){
  this.time+=dt;const list=[...blocks.values()];
  for(const c of this.cars){
   if(c.wrecked){c.age+=dt;if(c.age<5){c.v.y-=18*dt;c.group.position.addScaledVector(c.v,dt);c.group.rotation.x+=dt*c.v.z*.09;c.group.rotation.z-=dt*c.v.x*.09;if(c.group.position.y<.25){c.group.position.y=.25;c.v.multiplyScalar(.8);c.v.y=Math.abs(c.v.y)*.15;}}continue;}
   const length=loopLength(c.lane),distance=c.distance+c.speed*dt*c.direction,next=sampleLoop(distance,c.lane);
   const lead=this.cars.some(other=>!other.wrecked&&other!==c&&other.lane===c.lane&&((other.distance-c.distance)*c.direction%length+length)%length<4.8);
   if(!lead&&!roadBlocked(next,list))c.distance=((distance%length)+length)%length;
   const p=sampleLoop(c.distance,c.lane);c.group.position.set(p.x,0,p.z);c.group.rotation.set(0,p.yaw+(c.direction<0?Math.PI:0),0);for(const wheel of c.wheels)wheel.rotation.y+=lead?0:c.speed*dt/.3;
  }
 }
 blast(position,radius,nuclear){
  const destroyed=[];for(const b of this.buildings){if(b.destroyed)continue;b.hp-=blastDamage(Math.hypot(b.x-position.x,b.height/2-position.y,b.z-position.z),radius,nuclear?2000:180);if(b.hp<=0){b.destroyed=true;b.group.visible=false;destroyed.push(b);}}
  if(destroyed.length)this.rebuildColliders();
  for(const c of this.cars){const p=c.group.position,d=p.distanceTo(position);if(d>=radius)continue;c.wrecked=true;c.age=0;const dir=p.clone().sub(position);dir.y=2;dir.normalize();c.v.copy(dir).multiplyScalar(nuclear?18:9);c.v.y+=nuclear?7:4;}
  return destroyed;
 }
 reset(){for(const b of this.buildings){b.hp=240;b.destroyed=false;b.group.visible=true;}this.rebuildColliders();for(let i=0;i<this.cars.length;i++){const c=this.cars[i];c.wrecked=false;c.age=0;c.distance=(i%3)*loopLength(c.lane)/3;c.v.set(0,0,0);}this.update(0,new Map());}
 get targets(){return [...this.buildings.filter(b=>!b.destroyed).map(b=>b.body),...this.carMeshes.filter(m=>!m.userData.car.wrecked)];}
 state(){return {buildings:this.buildings.filter(b=>!b.destroyed).length,cars:this.cars.length,driving:this.cars.filter(c=>!c.wrecked).length,vehicles:this.cars.map(c=>({id:c.id,position:c.group.position.toArray(),wrecked:c.wrecked}))};}
}
