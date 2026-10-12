import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clearBody,landingHeight} from './movement.js';
const block={x:0,y:0,z:0};
test('worker cannot walk through a building or place a block over themselves',()=>{assert.equal(clearBody(0,0,0,[block]),false);assert.equal(clearBody(1.2,0,0,[block]),false);assert.equal(clearBody(2,0,0,[block]),true);});
test('worker can stand and walk on top of a block',()=>assert.equal(clearBody(0,2,0,[block]),true));
test('falling worker lands on a roof before the ground',()=>assert.equal(landingHeight(0,0,2.1,1.9,[block]),2));
test('jumping through a ceiling is blocked',()=>assert.equal(clearBody(0,1,0,[{x:0,y:1,z:0}]),false));
test('ground landing is separate from being airborne beside a building',()=>{assert.equal(landingHeight(4,4,3,2,[block]),-Infinity);assert.equal(landingHeight(4,4,.1,-.1,[block]),0);});
