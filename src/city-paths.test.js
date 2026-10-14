import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loopLength,sampleLoop,roadBlocked} from './city-paths.js';
test('traffic completes a continuous rounded loop without teleporting',()=>{const length=loopLength(13.25);assert.deepEqual(sampleLoop(0,13.25),sampleLoop(length,13.25));for(let t=0;t<length;t+=.1){const a=sampleLoop(t,13.25),b=sampleLoop(t+.1,13.25);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<=.101);assert.ok(Math.abs(a.x)<=13.25&&Math.abs(a.z)<=13.25);}});
test('construction on a road stops cars while elevated blocks do not',()=>{assert.equal(roadBlocked({x:12,z:0},[{x:6,y:0,z:0}]),true);assert.equal(roadBlocked({x:12,z:0},[{x:6,y:2,z:0}]),false);});
