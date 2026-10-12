import * as THREE from 'three';
import {CELL} from './physics.js';
import {clearBody} from './movement.js';
import {BONES,FIXED_STEP,createRagdoll,explodeRagdoll,stepRagdoll,jointError} from './ragdoll-physics.js';
const MAX_PEOPLE=24,colors=[0x458cc4,0xe3a54d,0x7dae7e,0xb48bcc,0xe18d78,0x70b9bf];
export class People {
 constructor(scene){
  this.scene=scene;this.people=[];this.accumulator=0;this.serial=0;
  this.sphere=new THREE.SphereGeometry(1,12,10);this.cylinder=new THREE.CylinderGeometry(1,1,1,8);
  this.headMaterial=new THREE.MeshStandardMaterial({color:0xf0e6ce,roughness:.7});
  this.eyeMaterial=new THREE.MeshStandardMaterial({color:0x24313c});
 }
 get targets(){return this.people.flatMap(person=>[person.head,...person.bones]);}
 occupied(x,y,z){return this.people.some(p=>!p.body.ragdoll&&Math.hypot(p.body.nodes[0].p.x-x,p.body.nodes[0].p.z-z)<.85&&Math.abs(p.spawn.y-y)<2);}
 add(position,blocks){
  if(this.people.length>=MAX_PEOPLE)return 'The yard holds up to 24 people. Stand them up or reset the site.';
  if(!clearBody(position.x,position.y,position.z,[...blocks.values()])||this.occupied(position.x,position.y,position.z))return 'Choose an open spot on the ground or a rooftop.';
  const material=new THREE.MeshStandardMaterial({color:colors[this.serial%colors.length],roughness:.7}),group=new THREE.Group(),body=createRagdoll(position.x,position.y,position.z,this.serial*.8);
  this.scene.add(group);const person={id:++this.serial,group,material,body,spawn:{...position},phase:this.serial,bones:[]};
  for(const [a,b] of BONES){const m=new THREE.Mesh(this.cylinder,material);m.castShadow=true;m.receiveShadow=true;m.userData.person=person;group.add(m);person.bones.push(m);}
  person.head=new THREE.Mesh(this.sphere,this.headMaterial);person.head.scale.setScalar(.19);person.head.castShadow=true;person.head.userData.person=person;group.add(person.head);
  for(const x of [-.065,.065]){const eye=new THREE.Mesh(this.sphere,this.eyeMaterial);eye.scale.setScalar(.018/.19);eye.position.set(x/.19,.025/.19,.174/.19);person.head.add(eye);}
  this.people.push(person);this.draw(person);return null;
 }
 addNear(origin,blocks){
  for(let i=0;i<72;i++){const a=i*2.4,r=2+Math.floor(i/10)*1.2,x=origin.x+Math.cos(a)*r,z=origin.z+Math.sin(a)*r;if(Math.abs(x)>46||Math.abs(z)>46)continue;
   const position={x,y:0,z};if(!clearBody(x,0,z,[...blocks.values()])||this.occupied(x,0,z))continue;return this.add(position,blocks);
  }
  return 'No open space nearby. Use Place person to choose a spot.';
 }
 draw(person){
  const nodes=person.body.nodes;
  for(let i=0;i<BONES.length;i++){
   const [a,b]=BONES[i],p=nodes[a].p,q=nodes[b].p,m=person.bones[i],delta=new THREE.Vector3(q.x-p.x,q.y-p.y,q.z-p.z),length=delta.length();
   m.position.set((p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2);m.scale.set(i===0?.085:.055,length,i===0?.085:.055);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  }
  const head=nodes[2].p,chest=nodes[1].p;person.head.position.set(head.x,head.y,head.z);person.head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(head.x-chest.x,head.y-chest.y,head.z-chest.z).normalize());
 }
 explode(origin,radius,nuclear){let hit=0;for(const p of this.people)if(explodeRagdoll(p.body,origin,radius,nuclear?23:13))hit++;return hit;}
 update(dt,blocks){
  this.accumulator=Math.min(.1,this.accumulator+dt);const list=[...blocks.values()];
  while(this.accumulator>=FIXED_STEP){for(const p of this.people)stepRagdoll(p.body,list);this.accumulator-=FIXED_STEP;}
  for(const p of this.people){
   if(!p.body.ragdoll){
    if(!this.supported(p.spawn,list)){p.body.ragdoll=true;p.body.active=true;}
    else{p.phase+=dt;const sway=Math.sin(p.phase*1.4)*.025;p.body.nodes[2].p.x=p.spawn.x+sway;}
   }
   this.draw(p);
  }
 }
 supported(spawn,blocks){if(spawn.y<.15)return true;return blocks.some(b=>Math.abs(spawn.x-b.x*CELL)<=CELL/2&&Math.abs(spawn.z-b.z*CELL)<=CELL/2&&Math.abs((b.y+1)*CELL-spawn.y)<.15);}
 standEveryone(blocks){
  const list=[...blocks.values()];for(const person of this.people){let {x,z}=person.spawn,y=0;
   for(const b of list)if(Math.abs(x-b.x*CELL)<=CELL/2&&Math.abs(z-b.z*CELL)<=CELL/2)y=Math.max(y,(b.y+1)*CELL);
   person.spawn={x,y,z};person.body=createRagdoll(x,y,z,person.id*.8);this.draw(person);
  }
 }
 reset(blocks){for(const p of this.people){this.scene.remove(p.group);p.material.dispose();}this.people=[];this.serial=0;this.accumulator=0;for(const [x,z] of [[-7,6],[1,7],[7,1],[-7,-2]])this.add({x,y:0,z},blocks);}
 counts(){return {total:this.people.length,ragdolls:this.people.filter(p=>p.body.ragdoll).length,moving:this.people.filter(p=>p.body.active).length,limit:MAX_PEOPLE};}
 state(camera){return {...this.counts(),items:this.people.map(p=>{const head=p.body.nodes[2].p,projected=camera?new THREE.Vector3(head.x,head.y,head.z).project(camera):null;return {id:p.id,ragdoll:p.body.ragdoll,position:[p.body.nodes[0].p.x,p.body.nodes[0].p.y,p.body.nodes[0].p.z],head:[head.x,head.y,head.z],screen:projected?[(projected.x*.5+.5)*innerWidth,(-projected.y*.5+.5)*innerHeight]:null,maxJointError:jointError(p.body)};})};}
}
