import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TypingCharge} from './typing-charge.js';
test('incorrect or partial words never unlock a nuke',()=>{const c=new TypingCharge(()=>0);assert.equal(c.type('rock'),false);assert.equal(c.type('rocker'),false);assert.equal(c.consume(),false);});
test('a correctly typed word grants exactly one launch and a new challenge',()=>{const c=new TypingCharge(()=>0),word=c.word;assert.equal(c.type(word.toUpperCase()),true);assert.equal(c.completed,1);assert.equal(c.type(word),false);assert.equal(c.consume(),true);assert.equal(c.consume(),false);assert.notEqual(c.word,word);assert.equal(c.completed,1);});
