# Ethan: Demolition Lab

A 3D building and destruction sandbox using Three.js. Place concrete, brick, steel, and glass sections, add eight-story towers, and destroy them with a blaster or a fictional nuclear blast. Procedural material textures, shadows, animated explosions, and debris give the yard an industrial look.

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
