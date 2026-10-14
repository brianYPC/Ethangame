import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Encounter} from './encounter.js';
const player={x:8,y:0,z:8};
test('automatic waves begin after play starts and monsters spawn zombies',()=>{const game=new Encounter(()=>.1);game.advance(25,player);assert.equal(game.wave,0);game.start();for(let i=0;i<1500;i++)game.advance(1/60,player);assert.equal(game.wave,1);assert.equal(game.state().monsters,1);assert.ok(game.state().zombies>0);});
test('enemies can hurt Ethan while a well-aimed nuke defeats the wave',()=>{const game=new Encounter(()=>.1);game.start();const zombie=game.addEnemy('zombie',player.x+.5,player.z);zombie.attack=0;game.advance(.1,player);assert.ok(game.health<100);game.waveActive=true;game.addEnemy('monster',player.x+5,player.z);const defeated=game.hit({x:player.x,y:1,z:player.z},31,2000);assert.equal(defeated.length,2);game.advance(.1,player);assert.equal(game.enemies.length,0);assert.equal(game.cleared,1);assert.equal(game.health,100);assert.equal(game.score,110);});
test('disabling waves removes threats and zero-time updates pause the action',()=>{const game=new Encounter(()=>.1);game.start();game.summon(player);const before=game.enemies[0].y;game.advance(0,player);assert.equal(game.enemies[0].y,before);game.setEnabled(false);game.advance(60,player);assert.equal(game.enemies.length,0);assert.equal(game.wave,1);});
