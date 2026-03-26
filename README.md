# Horse Club

Horse Club is a mobile-first single-player horse racing game built with Expo and React Native.

You manage a stable, assign jockeys, train horses, buy and sell talent, study race conditions, place bets, and push through league progression. The project is designed around a compact but replayable loop: prepare a horse, enter the right race, win resources, improve the stable, and come back stronger.

## What The Game Currently Includes

- `5-tab mobile shell`
  - Home
  - Tasks
  - Stable
  - Market
  - History
- `Stable management`
  - care actions
  - horse condition
  - training
  - stable upgrades
- `Jockey system`
  - assign riders to horses
  - jockey specialties by track and distance
  - rider bonuses feed directly into race prep and race results
- `Race loop`
  - race selection
  - track + weather effects
  - pre-race parade
  - favorites board
  - live race commentary
  - post-race summary
- `Progression`
  - trophies
  - leagues
  - daily challenges
  - horse market
  - persistent stable growth

## Core Gameplay Loop

1. Care for and train a horse in the stable.
2. Assign the best jockey for the target race.
3. Choose a race based on weather, track, and distance.
4. Bet on the best runner.
5. Watch the race event play out.
6. Collect coins, trophies, and progression.
7. Upgrade the stable or buy a better horse.
8. Repeat with stronger strategy and a deeper roster.

## Tech Stack

- Expo SDK 54
- React Native
- Expo Router
- Zustand
- React Native Reanimated
- React Native Gesture Handler
- TypeScript

## Project Highlights

### Race Simulation

The race system is not just a random winner picker. Outcomes are influenced by:

- horse stats
- track preference
- distance preference
- weather
- traits
- jockey bonuses
- stable progression effects

### Better Mobile Navigation

The app supports tab swiping, but tab changes are restricted to edge swipes so normal horizontal interaction does not accidentally flip pages.

### Stable Depth

The stable is not just cosmetic. Horses have:

- condition state
- mood
- energy
- hunger
- cleanliness
- training progression
- assigned jockeys

### Race Presentation

The race flow now includes:

- pre-race lineup
- favorites board
- starting gate countdown
- live race track view
- commentary
- post-race results and next-step suggestions

## Screens

### Home

Overview screen for:

- league position
- trophies
- featured horse
- stable standings
- next progression move

### Stable

Management screen for:

- horse selection
- care
- training
- jockey assignment
- stable upgrades

### Tasks

Daily challenge screen that supports the short-session retention loop.

### Market

Horse buying and selling screen with scout-influenced pricing.

### History

Race and betting history with coin and trophy results.

### Race

Dedicated race flow including:

- lobby
- race selection
- horse selection
- betting
- pre-race sequence
- live race
- results

## Folder Structure

```text
app/            Expo Router screens
components/     shared UI, race presentation, tab UI
lib/            game state, simulation, horse/race data
assets/models/  bundled third-party 3D model assets for future experiments
```

## Getting Started

### Requirements

- Node.js 20+
- npm
- Expo Go on device, or a local simulator

Note:
Expo SDK 54 expects Node `20.19.4+`. The project may still run on slightly older Node 20 builds, but upgrading is recommended.

### Install

```bash
npm install
```

### Run

```bash
npx expo start --clear
```

## Verification Commands

```bash
npx tsc --noEmit
node --max-old-space-size=4096 .\node_modules\expo\bin\cli export --platform android
```

## Asset Note

The repository currently includes bundled third-party model assets under `assets/models/`.

If this repo is made public or distributed, you should verify:

- license terms
- attribution requirements
- redistribution rights

before publishing those assets broadly.

## Current Limitations

- horse visuals are still stylized UI representations rather than final production horse art
- the game loop is stronger than the original prototype, but still early compared with a full content-complete management game
- tournaments, rivals, and richer race variety still need to be built out

## Roadmap

Planned improvements:

- proper horse render assets or final horse art direction
- named rivals and recurring competitors
- tournaments and cup structure
- deeper race-day broadcast UI
- more race condition variety
- better post-race reward and progression presentation
- richer stable identity and collection systems

## Status

This project is already playable as a mobile prototype and is being actively shaped into a more polished single-player horse racing management game.

