import * as THREE from 'three';
import {clearBody,landingHeight} from './movement.js';
export class Operator {
 constructor(scene){
  this.group=new THREE.Group();this.group.name='Ethan demolition operator';scene.add(this.group);
  const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const skin=mat(0xc9916d),suit=mat(0x293d4d),vest=mat(0xe78b24),reflective=mat(0xdce1d5,.35,.35),boots=mat(0x242627),helmet=mat(0xf0bb35,.4),dark=mat(0x19262e),metal=mat(0x586d79,.4,.7);
  const part=(parent,geo,material,x,y,z)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  part(this.group,new THREE.CapsuleGeometry(.24,.35,6,12),suit,0,1.1,0);
  part(this.group,new THREE.BoxGeometry(.54,.52,.54),vest,0,1.25,.035);
  for(const x of [-.17,.17])for(const z of [-.245,.315])part(this.group,new THREE.BoxGeometry(.065,.53,.02),reflective,x,1.25,z);
  part(this.group,new THREE.BoxGeometry(.55,.055,.56),reflective,0,1.13,.035);
  part(this.group,new THREE.BoxGeometry(.5,.1,.32),dark,0,.91,0);
  part(this.group,new THREE.BoxGeometry(.08,.07,.025),metal,0,.91,.175);
  part(this.group,new THREE.CylinderGeometry(.07,.085,.13,8),skin,0,1.53,0);
  part(this.group,new THREE.SphereGeometry(.16,16,12),skin,0,1.69,0).scale.set(1,1.15,.9);
  part(this.group,new THREE.BoxGeometry(.065,.06,.08),skin,0,1.67,.14);
  for(const x of [-.055,.055])part(this.group,new THREE.SphereGeometry(.018,8,8),dark,x,1.72,.13);
  for(const x of [-.16,.16])part(this.group,new THREE.SphereGeometry(.045,8,8),skin,x,1.68,0);
  part(this.group,new THREE.SphereGeometry(.2,16,12,0,Math.PI*2,0,Math.PI/2),helmet,0,1.79,0);
  part(this.group,new THREE.CylinderGeometry(.23,.23,.035,20),helmet,0,1.79,0);
  part(this.group,new THREE.BoxGeometry(.07,.025,.26),helmet,0,1.965,0);
  this.legs=[];this.arms=[];
  for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.15,.9,0);this.group.add(leg);this.legs.push(leg);
   part(leg,new THREE.CapsuleGeometry(.09,.49,5,8),suit,0,-.36,0);
   part(leg,new THREE.BoxGeometry(.2,.14,.32),boots,0,-.81,.05);
   part(leg,new THREE.BoxGeometry(.18,.16,.04),dark,0,-.37,.09);
   const arm=new THREE.Group();arm.position.set(side*.33,1.42,0);this.group.add(arm);this.arms.push(arm);
   part(arm,new THREE.CapsuleGeometry(.075,.37,5,8),suit,0,-.27,0);
   part(arm,new THREE.SphereGeometry(.085,8,8),skin,0,-.53,0);
  }
  this.weapon=new THREE.Group();this.weapon.position.set(.34,1.08,.34);this.group.add(this.weapon);
  part(this.weapon,new THREE.BoxGeometry(.16,.18,.5),dark,0,0,.17);
  part(this.weapon,new THREE.CylinderGeometry(.055,.075,.4,12),metal,0,.025,.51).rotation.x=Math.PI/2;
  part(this.weapon,new THREE.BoxGeometry(.1,.2,.12),dark,0,-.16,.05);
  part(this.weapon,new THREE.BoxGeometry(.05,.05,.25),mat(0xf18b51,.2),0,.115,.18);
  this.muzzle=new THREE.Object3D();this.muzzle.position.set(0,.025,.74);this.weapon.add(this.muzzle);
  this.remote=part(this.group,new THREE.BoxGeometry(.15,.09,.23),dark,.33,.91,.2);
  part(this.remote,new THREE.SphereGeometry(.025,8,8),mat(0xe45c37),0,.065,.03);
  this.velocity=0;this.grounded=true;this.phase=0;this.step=0;this.recoil=0;this.tool='build';this.reset();
 }
 reset(){this.group.position.set(8,0,8);this.group.rotation.y=-Math.PI*.75;this.velocity=0;this.grounded=true;this.recoil=0;this.phase=0;this.legs.forEach(l=>l.rotation.x=0);}
 setTool(tool){this.tool=tool;this.weapon.visible=tool==='blaster';this.remote.visible=tool==='nuke';}
 aim(target){const delta=target.clone().sub(this.group.position);this.group.rotation.y=Math.atan2(delta.x,delta.z);this.weapon.rotation.x=-Math.atan2(delta.y-1.1,Math.hypot(delta.x,delta.z));this.recoil=.12;}
 muzzlePosition(){this.group.updateMatrixWorld(true);return this.muzzle.getWorldPosition(new THREE.Vector3());}
 update(dt,keys,camera,blocks,sound,jump){
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));
  const f=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')),r=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  const move=forward.multiplyScalar(f).addScaledVector(right,r),moving=move.lengthSq()>0,sprint=keys.has('shift');
  const list=[...blocks.values()],p=this.group.position;
  if(moving){move.normalize().multiplyScalar((sprint?6.5:3.8)*dt);const x=Math.max(-48,Math.min(48,p.x+move.x)),z=Math.max(-48,Math.min(48,p.z+move.z));if(clearBody(x,p.y,p.z,list))p.x=x;if(clearBody(p.x,p.y,z,list))p.z=z;this.group.rotation.y=Math.atan2(move.x,move.z);this.weapon.rotation.x=0;}
  if(jump&&this.grounded){this.velocity=9.5;this.grounded=false;sound.play('jump');}
  const previousY=p.y;this.velocity-=22*dt;const next=p.y+this.velocity*dt,floor=landingHeight(p.x,p.z,previousY,next,list);
  if(this.velocity<=0&&floor!==-Infinity){p.y=floor;this.velocity=0;this.grounded=true;}else if(this.velocity>0&&!clearBody(p.x,next,p.z,list)){this.velocity=0;this.grounded=false;}else{p.y=next;this.grounded=false;}
  this.phase+=dt*(sprint?12:8);this.step-=dt;const swing=moving&&this.grounded?Math.sin(this.phase)*.55:0;
  this.legs[0].rotation.x=swing;this.legs[1].rotation.x=-swing;
  this.arms[0].rotation.x=this.tool==='blaster'?-.65:-swing*.65;this.arms[1].rotation.x=this.tool==='blaster'?-.9:swing*.65;
  if(moving&&this.grounded&&this.step<=0){sound.play('step');this.step=sprint?.25:.38;}
  this.recoil=Math.max(0,this.recoil-dt);this.weapon.position.z=.34-this.recoil*.5;
 }
 state(){return {position:this.group.position.toArray(),grounded:this.grounded,tool:this.tool};}
}
