import {clearBody} from './movement.js';
import {blastDamage} from './physics.js';
export class Encounter {
 constructor(random=Math.random){this.random=random;this.enabled=true;this.reset();}
 reset(){this.enemies=[];this.started=false;this.health=100;this.score=0;this.wave=0;this.cleared=0;this.nextWave=20;this.waveActive=false;this.serial=0;this.spawned=0;this.spawnClock=0;this.notice='Build your yard. Monsters arrive after you start playing.';}
 start(){this.started=true;}
 seedCity(blocks=[]){if(!this.enabled)return;for(const [x,z] of [[10,5],[5,10],[-6,9]])if(this.enemies.length<19&&clearBody(x,0,z,blocks))this.addEnemy('zombie',x,z);this.notice='Zombies are already in the streets. Use the blaster or type to arm a nuke.';}
 setEnabled(enabled){this.enabled=enabled;if(!enabled){this.enemies=[];this.waveActive=false;this.notice='Monster waves paused. Practice or build freely.';}else{this.nextWave=20;this.notice='Monster waves enabled. Stay ready!';}}
 addEnemy(type,x,z){const monster=type==='monster';const e={id:++this.serial,type,x,y:0,z,size:monster?1.8:1,hp:monster?180:50,vy:monster?10:0,arriving:monster,attack:1,phase:this.random()*6.28};this.enemies.push(e);return e;}
 summon(player,blocks=[]){
  if(!this.enabled||this.waveActive||this.health<=0)return false;
  let position=null;
  for(let i=0;i<24;i++){const angle=this.random()*Math.PI*2+i*.4,x=Math.max(-43,Math.min(43,player.x+Math.cos(angle)*12)),z=Math.max(-43,Math.min(43,player.z+Math.sin(angle)*12));if(Math.hypot(x-player.x,z-player.z)>6&&clearBody(x,0,z,blocks)){position={x,z};break;}}
  if(!position){this.nextWave=5;return false;}
  this.started=true;this.wave++;this.waveActive=true;this.spawned=0;this.spawnClock=1;this.addEnemy('monster',position.x,position.z);this.notice=`Wave ${this.wave}: a monster jumped in! Type a word to arm your nuke.`;return true;
 }
 advance(dt,player,blocks=[]){
  if(!this.enabled||!this.started||this.health<=0||dt<=0)return;
  if(!this.waveActive){this.nextWave-=dt;if(this.nextWave<=0)this.summon(player,blocks);}
  const monster=this.enemies.find(e=>e.type==='monster');
  if(monster&&!monster.arriving&&this.spawned<Math.min(18,8+this.wave*2)){
   this.spawnClock-=dt;
   if(this.spawnClock<=0&&this.enemies.length<19){
    const angle=this.random()*Math.PI*2,x=monster.x+Math.cos(angle)*1.5,z=monster.z+Math.sin(angle)*1.5;
    if(clearBody(x,0,z,blocks)){this.addEnemy('zombie',x,z);this.spawned++;}this.spawnClock=2.5;
   }
  }
  for(const e of this.enemies){
   e.phase+=dt*6;e.attack=Math.max(0,e.attack-dt);
   if(e.arriving){e.y+=e.vy*dt;e.vy-=22*dt;if(e.y<=0){e.y=0;e.arriving=false;}continue;}
   const dx=player.x-e.x,dz=player.z-e.z,distance=Math.hypot(dx,dz),reach=e.type==='monster'?2:1.35;
   if(distance>reach*.8){
    const step=(e.type==='monster'?.9:1.45)*dt,x=e.x+dx/Math.max(.001,distance)*step,z=e.z+dz/Math.max(.001,distance)*step;
    if(clearBody(x,0,e.z,blocks))e.x=x;if(clearBody(e.x,0,z,blocks))e.z=z;
   }
   if(distance<reach&&player.y<1.6&&e.attack===0&&clearBody((player.x+e.x)/2,0,(player.z+e.z)/2,blocks)){
    this.health=Math.max(0,this.health-(e.type==='monster'?14:7));e.attack=1.4;this.notice=this.health?`You were hit! ${this.health} health remaining.`:'Ethan is down. Try again!';
   }
  }
  if(this.waveActive&&this.enemies.length===0){this.waveActive=false;this.cleared++;this.health=Math.min(100,this.health+15);this.nextWave=45+this.random()*20;this.notice=`Wave cleared! +15 health. Another monster will arrive later.`;}
 }
 hit(origin,radius,power){
  const defeated=[];
  for(const e of this.enemies){const distance=Math.hypot(e.x-origin.x,e.y+.95*e.size-origin.y,e.z-origin.z);e.hp-=blastDamage(distance,radius,power);if(e.hp<=0){defeated.push({...e});this.score+=e.type==='monster'?100:10;}}
  this.enemies=this.enemies.filter(e=>e.hp>0);return defeated;
 }
 state(){return {enabled:this.enabled,started:this.started,health:this.health,score:this.score,wave:this.wave,cleared:this.cleared,active:this.waveActive,zombies:this.enemies.filter(e=>e.type==='zombie').length,monsters:this.enemies.filter(e=>e.type==='monster').length,nextWave:this.nextWave,notice:this.notice};}
}
