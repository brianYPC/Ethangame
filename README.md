# Ethan: Demolition Lab

A 3D building and destruction sandbox using Three.js. Place concrete, brick, steel, and glass sections, add eight-story towers, and destroy them with a blaster or a fictional nuclear blast. Procedural material textures, shadows, animated explosions, and debris give the yard an industrial look.

## Run

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm ci --cache /tmp/ethangame-npm
npm run dev
```

Click the grid to build; select a height for upper floors. Upper sections require adjacent structural support. Drag to orbit and scroll to zoom. Select Blaster or Nuclear blast and click a target to destroy it. Keys 1/2/3 change tools; Q/E change construction height. Reset restores the starter tower.

```sh
npm test
npm run build
```

A WebGL-capable browser is required. Dependencies and textures are local; no external assets or credentials are needed. Structural support uses connected blocks anchored at ground level; debris uses simplified ballistic motion and ground collisions rather than engineering-grade simulation. The nuclear effect is a fictional visual game mechanic.

## Browser hosting

GitHub Pages publishes the production build from the `main` branch. The deployment workflow runs the tests, builds the site, and uploads it to Pages. Relative asset paths allow the game to run under a repository URL. Future pushes to `main` automatically publish updates.
