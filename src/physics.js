export const CELL=2;
export const strength={concrete:140,brick:85,steel:260,glass:25};
export function key(x,y,z){return `${x},${y},${z}`;}
export function supportedKeys(blocks){
 const map=new Map(blocks.map(b=>[key(b.x,b.y,b.z),b]));
 const supported=new Set(),queue=blocks.filter(b=>b.y===0);
 for(const b of queue)supported.add(key(b.x,b.y,b.z));
 for(let i=0;i<queue.length;i++){
  const b=queue[i];
  for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
   const k=key(b.x+dx,b.y+dy,b.z+dz);
   if(map.has(k)&&!supported.has(k)){supported.add(k);queue.push(map.get(k));}
  }
 }
 return supported;
}
export function blastDamage(distance,radius,power){return distance>=radius?0:power*(1-distance/radius)**1.3;}
