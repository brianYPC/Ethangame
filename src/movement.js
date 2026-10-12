import {CELL} from './physics.js';
export const BODY_HEIGHT=1.85,BODY_RADIUS=.32;
export function clearBody(x,y,z,blocks){
 for(const b of blocks){
  if(Math.abs(x-b.x*CELL)<CELL/2+BODY_RADIUS&&Math.abs(z-b.z*CELL)<CELL/2+BODY_RADIUS&&y<b.y*CELL+CELL-.02&&y+BODY_HEIGHT>b.y*CELL+.02)return false;
 }
 return true;
}
export function landingHeight(x,z,previousY,nextY,blocks){
 let floor=nextY<=0?0:-Infinity;
 for(const b of blocks){const top=(b.y+1)*CELL;if(Math.abs(x-b.x*CELL)<CELL/2+BODY_RADIUS*.5&&Math.abs(z-b.z*CELL)<CELL/2+BODY_RADIUS*.5&&previousY>=top-.03&&nextY<=top)floor=Math.max(floor,top);}
 return floor;
}
