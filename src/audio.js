// Generated sound effects keep the game self-contained and start only after a gesture.
export class SoundEffects {
 constructor(){
  this.context=null;this.output=null;this.analyser=null;this.sources=new Set();this.lastEvent='';this.events=0;this.lastImpact=-Infinity;
  this.muted=false;this.volume=.45;
  try{this.muted=localStorage.getItem('ethan-muted')==='true';const v=localStorage.getItem('ethan-volume');if(v!==null)this.volume=Math.min(1,Math.max(0,Number(v)||0));}catch{}
 }
 unlock(){
  try{
   if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    this.context=new Context();this.output=this.context.createGain();this.output.gain.value=this.muted?0:this.volume;
    const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.3;
    this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;
    this.output.connect(limiter);limiter.connect(this.analyser);this.analyser.connect(this.context.destination);
   }
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
  }catch{}
 }
 settings(){
  if(this.output)this.output.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.025);
  try{localStorage.setItem('ethan-muted',String(this.muted));localStorage.setItem('ethan-volume',String(this.volume));}catch{}
 }
 mute(value){this.muted=value;this.settings();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));this.settings();}
 track(source,filter,gain){
  this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();filter?.disconnect();gain.disconnect();};
 }
 tone(start,end,duration,gain=.2,shape='sine',delay=0){
  const c=this.context,t=c.currentTime+delay,osc=c.createOscillator(),amp=c.createGain();osc.type=shape;osc.frequency.setValueAtTime(start,t);osc.frequency.exponentialRampToValueAtTime(Math.max(1,end),t+duration);
  amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(gain,t+.008);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(amp);amp.connect(this.output);this.track(osc,null,amp);osc.start(t);osc.stop(t+duration+.02);
 }
 noise(duration,gain,frequency,delay=0,kind='lowpass'){
  const c=this.context,t=c.currentTime+delay,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),amp=c.createGain();source.buffer=buffer;filter.type=kind;filter.frequency.setValueAtTime(frequency,t);filter.frequency.exponentialRampToValueAtTime(Math.max(50,frequency*.25),t+duration);
  amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(gain,t+.012);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(amp);amp.connect(this.output);this.track(source,filter,amp);source.start(t);
 }
 play(event,material='concrete'){
  if(!this.context||this.muted||this.volume===0)return;
  if(this.context.state==='suspended'){this.context.resume().then(()=>{if(this.context.state==='running')this.play(event,material);}).catch(()=>{});return;}
  if(this.context.state!=='running')return;
  this.lastEvent=event;this.events++;
  if(event==='blaster'){this.tone(950,75,.23,.22,'sawtooth');this.noise(.3,.32,2600);this.tone(100,30,.45,.28);}
  else if(event==='nuclear'){this.tone(65,22,3.5,.5);this.noise(4.5,.8,850,.12);this.noise(6,.45,200,.5);this.tone(35,17,5,.35,'sine',.25);}
  else if(event==='typing'){this.tone(360,280,.06,.035,'triangle');}
  else if(event==='charged'){this.tone(440,440,.12,.07,'triangle');this.tone(660,660,.12,.07,'triangle',.1);this.tone(880,880,.2,.07,'triangle',.2);}
  else if(event==='alert'){this.tone(90,45,.6,.14);this.tone(240,480,.45,.08,'triangle');this.noise(.5,.13,800);}
  else if(event==='collapse'){this.noise(1.6,.3,600);this.tone(90,35,.9,.16);}
  else if(event==='glass'){this.noise(.45,.12,6000,0,'highpass');this.tone(1900,850,.4,.025,'triangle');}
  else if(event==='step'){this.noise(.09,.07,450);this.tone(90,45,.09,.04);}
  else if(event==='jump'){this.noise(.18,.045,1400);}
  else if(event==='impact'){const now=this.context.currentTime;if(now-this.lastImpact<.14)return;this.lastImpact=now;this.noise(.16,.065,500);}
  else if(event==='build'){this.noise(.17,.16,material==='glass'?3200:900);this.tone(material==='steel'?460:material==='glass'?1100:170,70,.22,.1,'triangle');}
 }
 stop(){for(const s of this.sources){try{s.stop();}catch{}}}
 level(){if(!this.analyser)return 0;const data=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);}
 state(){return {available:!!(window.AudioContext||window.webkitAudioContext),state:this.context?.state||'locked',muted:this.muted,volume:this.volume,events:this.events,lastEvent:this.lastEvent,level:this.level()};}
}
