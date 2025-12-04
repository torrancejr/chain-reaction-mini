# Chain Reaction – Social Domino Mini App Roadmap

## 0. Concept Summary

### Game Idea
A single global chain of moves. Each move is a domino.  
Players spend **points** (fake currency) to extend the chain or break it and take the pot.  
Social identity via **Farcaster MiniKit** (FID, username).  

### Development Phases
- **Phase 0 – Points-Only MVP**
- **Phase 1 – DB + Leaderboard + Activity Feed**
- **Phase 2 – Onchain Upgrade (Optional)**

---

## 1. Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js + MiniKit (Farcaster Context) |
| Backend | Next.js API routes → DB later |
| DB (Phase 1) | SQLite/Postgres |
| Blockchain (Phase 2) | Base Smart Contract (optional) |

---

## 2. Phase 0 – MVP (No DB, No Crypto)

### Game State
- `currentDominoCount`
- `currentPotPoints`
- `lastMoveAt`

### Player Identity
- One user = one Farcaster **FID**

### Actions
| Action | Effect |
|---|---|
| **Extend** | increments domino count + pot |
| **Break** | awards pot to player + resets chain |

### API Endpoints
```
GET  /api/chain-reaction/state
POST /api/chain-reaction/extend
POST /api/chain-reaction/break
```

### UI Displays
- Chain length
- Pot value
- Extend + Break buttons
- FID-based identity

---

## 3. Phase 1 – Add DB + Leaderboard

### Database Structure

#### `players`
- fid (PK)
- username
- display_name
- points_balance
- total_pot_won
- dominoes_placed
- chains_broken
- longest_chain_at_break

#### `game_state`
- current_domino_count
- current_pot_points
- last_move_at

#### `moves`
- id
- fid
- type (EXTEND | BREAK | RESET)
- domino_number
- pot_before
- pot_after
- created_at

### New Endpoints
```
GET /api/chain-reaction/leaderboard
GET /api/chain-reaction/activity
```

### UI Updates
- Stats display
- Leaderboard
- Activity feed

---

## 4. Phase 2 – Onchain Upgrade (Optional)

- Replace points with actual contract logic
- Extend/Break become blockchain tx calls
- Contract events → indexed for leaderboards

---

## 5. Build Order (Do this in sequence)

1. Scaffold →  
   ```
   npx create-onchain --mini chain-reaction-mini
   cd chain-reaction-mini
   npm install
   npm run dev
   ```
2. Create + import `ChainReactionApp` component
3. Implement simple API routes (in-memory)
4. Add DB → persistence + leaderboards
5. Optional smart contract upgrade later

---

This file is formatted and ready to drop directly into Cursor.
