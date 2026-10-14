import * as THREE from 'three';
import {BONES,FIXED_STEP,createRagdoll,explodeRagdoll,stepRagdoll} from './ragdoll-physics.js';
export class EnemyWorld {
 constructor(scene){this.scene=scene;this.actors=new Map();this.corpses=[];this.accumulator=0;this.sphere=new THREE.SphereGeometry(1,12,10);this.cylinder=new THREE.CylinderGeometry(1,1,1,8);this.horn=new THREE.ConeGeometry(.18,.9,8);}
 create(e){
  const group=new THREE.Group();this.scene.add(group);
  const monster=e.type==='monster',color=monster?0x795385:0x789458;
  const material=new THREE.MeshStandardMaterial({color,roughness:.8}),faceMaterial=new THREE.MeshStandardMaterial({color:monster?0x8e5e9b:0x95aa68,roughness:.8}),eyeMaterial=new THREE.MeshStandardMaterial({color:0xffd070,emissive:0xff5830,emissiveIntensity:1});
  const a={id:e.id,type:e.type,size:e.size,group,material,faceMaterial,eyeMaterial,bones:[],body:createRagdoll(e.x,e.y,e.z)};
  for(let i=0;i<BONES.length;i++){const m=new THREE.Mesh(this.cylinder,material);m.castShadow=true;m.receiveShadow=true;group.add(m);a.bones.push(m);}
  a.head=new THREE.Mesh(this.sphere,faceMaterial);a.head.castShadow=true;group.add(a.head);
  for(const x of [-.35,.35]){const eye=new THREE.Mesh(this.sphere,eyeMaterial);eye.position.set(x,.18,.91);eye.scale.set(.13,.1,.09);a.head.add(eye);}
  if(monster)for(const x of [-.7,.7]){const horn=new THREE.Mesh(this.horn,eyeMaterial);horn.position.set(x,1.1,0);horn.rotation.z=-x*.5;a.head.add(horn);}
  this.actors.set(e.id,a);return a;
 }
 pose(a,e,player){
  const yaw=Math.atan2(player.x-e.x,player.z-e.z),body=createRagdoll(e.x,e.y,e.z,yaw),s=e.size;
  for(const n of body.nodes){n.p.x=e.x+(n.p.x-e.x)*s;n.p.y=e.y+(n.p.y-e.y)*s;n.p.z=e.z+(n.p.z-e.z)*s;n.radius*=s;n.previous={...n.p};}
  for(const j of body.joints)j.length*=s;
  const stride=Math.sin(e.phase)*.23*s;
  for(const [index,direction] of [[11,1],[14,-1]]){body.nodes[index].p.x+=Math.sin(yaw)*stride*direction;body.nodes[index].p.z+=Math.cos(yaw)*stride*direction;}
  for(const index of [5,8]){body.nodes[index].p.x+=Math.sin(yaw)*.35*s;body.nodes[index].p.z+=Math.cos(yaw)*.35*s;body.nodes[index].p.y+=.3*s;}
  a.body=body;this.draw(a);
 }
 draw(a){
  for(let i=0;i<BONES.length;i++){const [b,c]=BONES[i],p=a.body.nodes[b].p,q=a.body.nodes[c].p,m=a.bones[i],dir=new THREE.Vector3(q.x-p.x,q.y-p.y,q.z-p.z),radius=(i===0?.25:i===1?.1:.105)*a.size;m.position.set((p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2);m.scale.set(radius,dir.length(),radius);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());}
  const head=a.body.nodes[2].p,chest=a.body.nodes[1].p;a.head.position.set(head.x,head.y,head.z);a.head.scale.set(.23*a.size,.28*a.size,.22*a.size);a.head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(head.x-chest.x,head.y-chest.y,head.z-chest.z).normalize());
 }
 defeat(enemies,origin,radius,nuclear){
  for(const e of enemies){const a=this.actors.get(e.id);if(!a)continue;explodeRagdoll(a.body,origin,radius,nuclear?23:13);a.life=9;this.actors.delete(e.id);this.corpses.push(a);}
 }
 dispose(a){this.scene.remove(a.group);a.material.dispose();a.faceMaterial.dispose();a.eyeMaterial.dispose();}
 update(dt,encounter,player,blocks){
  const ids=new Set(encounter.enemies.map(e=>e.id));for(const [id,a] of this.actors)if(!ids.has(id)){this.dispose(a);this.actors.delete(id);}
  for(const e of encounter.enemies)this.pose(this.actors.get(e.id)||this.create(e),e,player);
  this.accumulator=Math.min(.1,this.accumulator+dt);const list=[...blocks.values()];
  while(this.accumulator>=FIXED_STEP){for(const a of this.corpses)stepRagdoll(a.body,list);this.accumulator-=FIXED_STEP;}
  for(let i=this.corpses.length-1;i>=0;i--){const a=this.corpses[i];a.life-=dt;this.draw(a);if(a.life<0){this.dispose(a);this.corpses.splice(i,1);}}
 }
 get targets(){return [...this.actors.values()].flatMap(a=>[a.head,...a.bones]);}
 clear(){for(const a of [...this.actors.values(),...this.corpses])this.dispose(a);this.actors.clear();this.corpses=[];this.accumulator=0;}
 state(camera){return [...this.actors.values()].map(a=>{const head=a.head.position,screen=head.clone().project(camera);return {id:a.id,type:a.type,head:head.toArray(),screen:[(screen.x*.5+.5)*innerWidth,(-screen.y*.5+.5)*innerHeight]};});}
}
