import {test} from 'node:test';
import assert from 'node:assert/strict';
import {supportedKeys,blastDamage,strength} from './physics.js';
test('grounded towers remain supported',()=>assert.equal(supportedKeys([{x:0,y:0,z:0},{x:0,y:1,z:0},{x:0,y:2,z:0}]).size,3));
test('removing the foundation detaches the upper floors',()=>assert.equal(supportedKeys([{x:0,y:1,z:0},{x:0,y:2,z:0}]).size,0));
test('horizontal structural connections carry upper sections',()=>assert.equal(supportedKeys([{x:0,y:0,z:0},{x:0,y:1,z:0},{x:1,y:1,z:0},{x:5,y:1,z:0}]).size,3));
test('blast damage falls off and stops at its radius',()=>{assert.equal(blastDamage(0,10,100),100);assert.equal(blastDamage(10,10,100),0);assert.ok(blastDamage(2,10,100)>blastDamage(7,10,100));});
test('glass breaks before concrete and steel',()=>assert.ok(strength.glass<strength.brick&&strength.brick<strength.concrete&&strength.concrete<strength.steel));
