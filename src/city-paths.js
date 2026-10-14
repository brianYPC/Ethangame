export function loopLength(half,radius=2.5){return 8*(half-radius)+2*Math.PI*radius;}
export function sampleLoop(distance,half,radius=2.5){
 const straight=2*(half-radius),arc=Math.PI*radius/2,length=loopLength(half,radius);let d=((distance%length)+length)%length;
 const sections=[
 {len:straight,at:t=>({x:-half+radius+t,z:-half,yaw:Math.PI/2})},
 {len:arc,at:t=>{const a=-Math.PI/2+t/radius;return {x:half-radius+Math.cos(a)*radius,z:-half+radius+Math.sin(a)*radius,yaw:-a};}},
 {len:straight,at:t=>({x:half,z:-half+radius+t,yaw:0})},
 {len:arc,at:t=>{const a=t/radius;return {x:half-radius+Math.cos(a)*radius,z:half-radius+Math.sin(a)*radius,yaw:-a};}},
 {len:straight,at:t=>({x:half-radius-t,z:half,yaw:-Math.PI/2})},
 {len:arc,at:t=>{const a=Math.PI/2+t/radius;return {x:-half+radius+Math.cos(a)*radius,z:half-radius+Math.sin(a)*radius,yaw:-a};}},
 {len:straight,at:t=>({x:-half,z:half-radius-t,yaw:Math.PI})},
 {len:arc,at:t=>{const a=Math.PI+t/radius;return {x:-half+radius+Math.cos(a)*radius,z:-half+radius+Math.sin(a)*radius,yaw:-a};}}
 ];
 for(const section of sections){if(d<=section.len)return section.at(d);d-=section.len;}return sections[0].at(0);
}
export function roadBlocked(position,blocks){return blocks.some(b=>b.y===0&&Math.abs(b.x*2-position.x)<2.3&&Math.abs(b.z*2-position.z)<2.3);}
