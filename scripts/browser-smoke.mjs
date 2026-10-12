import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('Browser error:',e.message)});
const state=()=>page.evaluate(()=>window.demolitionState());
await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.demolitionState?.().blocks===155,null,{polling:100,timeout:30000});
try {
assert.equal((await state()).audio.state,'locked');
await page.screenshot({path:'/tmp/game-preview.png'});
await page.evaluate(()=>{window.audioPeak=0;window.audioProbe=setInterval(()=>{window.audioPeak=Math.max(window.audioPeak,window.demolitionState().audio.level);},10);});
await page.mouse.click(920,550);assert.equal((await state()).blocks,156);
await page.waitForFunction(()=>window.audioPeak>.0001,null,{polling:50,timeout:3000});await page.evaluate(()=>clearInterval(window.audioProbe));console.log('Building generates a real audio waveform.');
await page.locator('[data-tool="blaster"]').click();await page.mouse.click(640,400);assert.ok((await state()).destroyed>0);
await page.locator('[data-tool="nuke"]').click();await page.mouse.click(640,400);assert.equal((await state()).blocks,0);assert.equal((await state()).nuclear.active,true);
await page.waitForFunction(()=>window.demolitionState().nuclear.phase==='mushroom',null,{polling:100,timeout:15000});
await page.screenshot({path:'/tmp/game-preview-nuclear.png'});console.log('Nuclear mushroom cloud reaches its rising phase.');
await page.locator('#sound').click();await page.waitForTimeout(300);assert.equal((await state()).audio.muted,true);assert.ok((await state()).audio.level<.0001);console.log('Mute silences the output.');
await page.locator('#reset').click();assert.equal((await state()).blocks,155);assert.equal((await state()).nuclear.active,false);
await page.locator('#follow').click();assert.equal((await state()).follow,true);
const before=(await state()).character.position;await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');const after=(await state()).character.position;assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>.3);
await page.locator('#sound').click();await page.mouse.move(1100,700);await page.locator('#world').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>window.demolitionState().character.position[1]>.1,null,{polling:50,timeout:3000});
await page.waitForFunction(()=>window.demolitionState().character.grounded,null,{polling:100,timeout:10000});console.log('Character follows camera, walks and jumps.');
await page.screenshot({path:'/tmp/game-preview-character.png'});
assert.deepEqual(errors,[]);console.log('No browser errors.');} finally {await browser.close();}
