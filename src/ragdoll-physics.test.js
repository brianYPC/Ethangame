import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRagdoll,explodeRagdoll,stepRagdoll,jointError} from './ragdoll-physics.js';
test('a distant explosion leaves a person standing',()=>{const p=createRagdoll(12,0,0);assert.equal(explodeRagdoll(p,{x:0,y:1,z:0},4.5,13),false);assert.equal(p.ragdoll,false);});
test('a nearby blast throws an articulated body away from the impact',()=>{const p=createRagdoll(2,0,0);assert.equal(explodeRagdoll(p,{x:0,y:1,z:0},4.5,13),true);stepRagdoll(p);assert.ok(p.nodes[0].p.x>2);assert.ok(p.nodes[0].p.y>.93);assert.ok(jointError(p)<.08);});
test('ragdolls stay connected and collide with the ground after landing',()=>{const p=createRagdoll(2,0,0);explodeRagdoll(p,{x:0,y:1,z:0},31,23);for(let i=0;i<600;i++)stepRagdoll(p);assert.ok(p.nodes.every(n=>Number.isFinite(n.p.x)&&n.p.y>=n.radius-.0001));assert.ok(jointError(p)<.12);assert.ok(p.nodes[0].p.y<1);});
test('an already fallen figure can be launched again',()=>{const p=createRagdoll(0,0,0);p.ragdoll=true;p.active=false;assert.equal(explodeRagdoll(p,{x:0,y:0,z:0},4.5,13),true);assert.equal(p.active,true);});

test('falling joints land on a building roof instead of passing through it',()=>{const p=createRagdoll(0,3,0);p.active=true;p.ragdoll=true;for(let i=0;i<240;i++)stepRagdoll(p,[{x:0,y:0,z:0}]);assert.ok(p.nodes.every(n=>n.p.y>=2+n.radius-.001));assert.ok(jointError(p)<.12);});
