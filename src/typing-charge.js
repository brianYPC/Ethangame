export const WORDS=['rocket','shield','garden','planet','rescue','thunder','castle','courage','lantern','reactor','victory','meteor','forest','copper','energy','crystal','dragon','shelter','comet','silver'];
export class TypingCharge {
 constructor(random=Math.random){this.random=random;this.word='';this.reset();}
 nextWord(){let index=Math.floor(this.random()*WORDS.length)%WORDS.length;if(WORDS[index]===this.word)index=(index+1)%WORDS.length;this.word=WORDS[index];this.typed='';}
 reset(){this.ready=false;this.completed=0;this.nextWord();}
 type(value){this.typed=value.toLowerCase();if(!this.ready&&this.typed===this.word){this.ready=true;this.completed++;return true;}return false;}
 consume(){if(!this.ready)return false;this.ready=false;this.nextWord();return true;}
 state(){return {word:this.word,typed:this.typed,ready:this.ready,completed:this.completed};}
}
