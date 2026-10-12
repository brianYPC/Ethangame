import * as THREE from 'three';
function smokeTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,128);
 const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,u=a*a*(3-2*a),v=b*b*(3-2*b);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;};
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const n=noise(x/24,y/24)*.55+noise(x/8,y/8)*.3+noise(x/3,y/3)*.15,i=(y*128+x)*4;
  const radius=Math.hypot((x-64)/64,(y-64)/64),edge=Math.max(0,1-radius/(.73+n*.28)),light=(128-x-y)/256;
  const value=135+n*100+light*35;
  data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=Math.min(255,Math.pow(edge,.65)*(140+n*150));
 }
 ctx.putImageData(data,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
// Cinematic, fictional blast sequence: flash, fireball, shockwave, dust and buoyant cloud.
export class NuclearBlast {
 constructor(scene){
  this.scene=scene;this.active=false;this.age=0;this.duration=15;
  this.group=new THREE.Group();this.group.visible=false;scene.add(this.group);
  this.sphere=new THREE.SphereGeometry(1,20,14);this.puffs=[];
  this.smokeTexture=smokeTexture();
  const glow=new THREE.MeshBasicMaterial({color:0xffd18b,transparent:true,opacity:0,depthWrite:false});
  this.fireball=new THREE.Mesh(this.sphere,glow);this.group.add(this.fireball);
  this.light=new THREE.PointLight(0xffe2b2,0,85,1.3);this.group.add(this.light);
  const ringMat=new THREE.MeshBasicMaterial({color:0xd8c8a9,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
  this.ring=new THREE.Mesh(new THREE.RingGeometry(.87,1,80),ringMat);this.ring.rotation.x=-Math.PI/2;this.group.add(this.ring);
  let seed=9;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<66;i++){
   const kind=i<30?'cap':i<46?'stem':'dust';
   const material=new THREE.SpriteMaterial({color:0x635b51,map:this.smokeTexture,transparent:true,opacity:0,depthWrite:false});
   const puff=new THREE.Sprite(material);this.group.add(puff);this.puffs.push({m:puff,kind,a:rand()*Math.PI*2,r:rand(),size:1.2+rand()*2.2,seed:rand()});
  }
 }
 detonate(position){this.origin=position.clone();this.origin.y=.15;this.group.position.copy(this.origin);this.group.visible=true;this.age=0;this.active=true;this.update(0);}
 clear(){this.active=false;this.group.visible=false;this.light.intensity=0;}
 update(dt){
  if(!this.active)return;this.age+=dt;const t=this.age;if(t>this.duration){this.clear();return;}
  const fire=Math.min(1,t/1.4),fade=1-Math.min(1,Math.max(0,t-.75)/1.6);
  this.fireball.scale.setScalar(.2+fire*10);this.fireball.position.y=2+t*2;this.fireball.material.opacity=fade*.9;this.fireball.material.color.setRGB(1,.38+.4*fade,.08+.3*fade);
  this.light.position.y=this.fireball.position.y;this.light.intensity=90*Math.exp(-t*2.5);
  this.ring.position.y=.04-this.origin.y;this.ring.scale.setScalar(1+t*23);this.ring.material.opacity=Math.max(0,.65-t*.15);
  for(const p of this.puffs){
   const start=p.kind==='dust'?.15:p.kind==='stem'?.65:1.1,age=Math.max(0,t-start),growth=Math.min(1,age/3),alpha=Math.min(1,age)*Math.min(1,(this.duration-t)/4);
   p.m.material.opacity=alpha*(p.kind==='dust'?.4:.95);const radius=p.kind==='cap'?(3+age*1.15)*(.2+p.r*.8):p.kind==='dust'?age*8:Math.sin(age+p.seed)*.6;
   if(p.kind==='cap'){
    p.m.position.set(Math.cos(p.a)*radius,9+age*1.35+(1-p.r)*3+Math.sin(age*1.3+p.a)*.5,Math.sin(p.a)*radius);
    p.m.scale.set(p.size*(1.6+growth*3.6),p.size*(1.2+growth*2.8),1);
   }else if(p.kind==='stem'){
    p.m.position.set(Math.cos(p.a)*radius,p.r*(9+age*1.45),Math.sin(p.a)*radius);p.m.scale.set(p.size*(.7+growth*1.6),p.size*(1+growth*2.4),1);
   }else{
    p.m.position.set(Math.cos(p.a)*radius,1+p.seed*1.5-this.origin.y,Math.sin(p.a)*radius);p.m.scale.set(p.size*(2+age*1.4),p.size*(1+age*.3),1);
   }
   p.m.material.rotation=age*.07+p.seed;
   const heat=Math.max(0,1-age/3);p.m.material.color.setRGB(.52+heat*.48,.5+heat*.14,.47-heat*.15);
  }
 }
 state(){return {active:this.active,age:this.age,phase:!this.active?'idle':this.age<.5?'flash':this.age<2?'fireball':this.age<7?'mushroom':'dust'};}
}
