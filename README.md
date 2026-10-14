# Ethan: Demolition Lab

A 3D building and destruction sandbox using Three.js. Place concrete, brick, steel, and glass sections, add eight-story towers, and destroy them with a blaster or a fictional nuclear blast. Procedural material textures, shadows, animated explosions, and debris bring a city with streets, storefronts, trees, and traffic to life. Seven surrounding buildings can also be demolished; six cars drive around the streets and react to explosions.

## Run

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm ci --cache /tmp/ethangame-npm
npm run dev
```

Click the grid to build; select a height for upper floors. Upper sections require adjacent structural support. Drag to orbit and scroll to zoom. Select Blaster or Nuclear blast and click a target to destroy it. Keys 1/2/3 change tools; Q/E change construction height. Reset restores the starter tower and Ethan’s starting position. WASD or arrow keys move Ethan, Shift runs, and Space jumps. Select Follow Ethan (or press C) for the character camera. Movement buttons appear on touch devices.

```sh
npm test
npm run build
```

Sound effects begin after the first click or key press. Sound: On/Off mutes them; the volume slider adjusts loudness. Building, the blaster, glass breaking, collapses, footsteps, jumping, debris impacts, and nuclear explosions use locally generated Web Audio. Settings are remembered in the browser.

Nuclear blasts include a brief flash, an expanding fireball, a ground shockwave, turbulent smoke, a rising mushroom cloud, and lingering dust. Reduced-motion preferences reduce the flash and disable camera shake.

With the dev server running, `npm run test:browser` checks construction, real audio output, mute, both weapons, the mushroom-cloud phase, movement, jumping, camera following, and reset. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Chromium is installed at a different location.

A WebGL-capable browser is required. Dependencies and textures are local; no external assets or credentials are needed. Structural support uses connected blocks anchored at ground level; debris uses simplified ballistic motion and ground collisions rather than engineering-grade simulation. The nuclear effect is a fictional visual game mechanic.

## Browser hosting

The GitHub Pages workflow is prepared to publish the production build from `main` once Pages is enabled in the repository settings with GitHub Actions as the source. The deployment workflow runs the tests, builds the site, and uploads it to Pages. Relative asset paths allow the game to run under a repository URL. Future pushes to `main` automatically publish updates.

For a temporary 30-minute public playtest, run the Temporary browser preview workflow in GitHub Actions. Its deployment status contains the current browser URL. The Verify browser preview workflow checks the public game in Chrome. Old preview URLs expire and should not be reused.

## Stick people and ragdolls

Ten colorful stick figures start around the tower and walk around the sidewalks. Add person spawns another near Ethan; Place person (key 4) lets you click open ground or a rooftop to position one. The yard supports up to 24 people. Blaster impacts and nuclear blasts launch nearby figures into articulated ragdolls. Their connected arms, legs, torso, and head tumble, bounce off buildings, and settle on the ground. Stand everyone up restores the crowd; Reset site restores the original ten. Rooftop figures also fall when their supports are destroyed.

## Typing and zombie waves

Typing practice is optional. Use **Typing practice: On/Off** in the left panel, or **Turn typing off** in the word dialog. With practice off, select Nuclear blast and click a target to fire immediately; there is no typing requirement or cooldown. The setting is remembered in this browser.

With practice on, each nuke needs a correctly typed random word, instead of a cooldown. Select Nuclear blast or Type to arm nuke, type the word shown, and click your target. Each word earns exactly one launch. The game pauses while you type, with no time limit. Errors are highlighted and can be corrected with Backspace.

Three zombies are visible immediately; **Find zombies** moves the camera to them, and **Add zombies now** brings in more. After you start playing, monsters periodically leap into the city and summon zombies. Enemies chase Ethan and reduce his health. Use the blaster or earn a nuke to stop them; destroying a monster stops its zombie spawning. Clearing a wave restores some health. Monster waves can be switched off for free building, and Call a monster now starts a practice wave.
