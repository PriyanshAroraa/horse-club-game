# Horse Club

A mobile horse racing management game built with Expo and React Native.

The current build focuses on a stronger single-player loop:
- stable management
- horse care and training
- jockey assignment
- race selection with weather and track factors
- betting
- league and trophy progression
- daily challenges
- market buying and selling

## Stack

- Expo SDK 54
- Expo Router
- React Native
- Zustand
- React Native Reanimated

## Current Features

- 5-tab mobile shell: Home, Tasks, Stable, Market, History
- edge-only tab swipe navigation to avoid accidental page flips during normal interaction
- horse traits, track preferences, weather effects, and race odds
- jockey system with specialties by track and distance
- race favorites and stable power standings
- pre-race parade, live race commentary, and post-race results flow
- stable upgrades: Barn, Trainer, Scout
- market loop for horse acquisition and selling
- daily progression and reward tracking

## Screens

- `Home`: overview, standings, next progression move
- `Stable`: horse management, training, care, jockey assignment, upgrades
- `Tasks`: daily challenges
- `Market`: buy and sell horses
- `History`: race and betting log
- `Race`: lobby, pre-race sequence, live race, post-race summary

## Project Structure

- `app/`: Expo Router screens
- `components/`: shared UI and race presentation components
- `lib/`: game state, race simulation, horse/race data
- `assets/models/`: bundled third-party model assets

## Run Locally

```bash
npm install
npx expo start --clear
```

## Verification

Useful checks:

```bash
npx tsc --noEmit
node --max-old-space-size=4096 .\node_modules\expo\bin\cli export --platform android
```

## Notes

- The app currently prioritizes stable mobile performance over always-on real-time 3D rendering.
- Bundled model files under `assets/models/` are retained for future 3D experiments and scene work.
- If you publish this repository publicly, confirm the license terms and attribution requirements for any third-party asset files you include.

## Roadmap

- replace abstract horse visuals with proper horse render assets
- richer rival and tournament systems
- stronger race presentation and broadcast UI
- deeper horse classes, track biases, and event variety

