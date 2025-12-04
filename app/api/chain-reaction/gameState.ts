// Game state with Vercel KV for production
// Falls back to in-memory for local development

import { kv } from "@vercel/kv";
import {
  getOrCreatePlayer,
  updatePlayerBalance,
  recordExtend,
  recordBreak,
  type Player,
} from "./playerStore";

// Power Domino Types
export type PowerType = "double_down" | "shockwave" | "bomb" | "reverse" | null;

// Regular power dominoes (every 7th tile)
export const POWER_DOMINOES: { type: PowerType; emoji: string; name: string; description: string }[] = [
  { type: "double_down", emoji: "🔥", name: "Double Down", description: "Next placement adds +20 to pot instead of +10" },
  { type: "shockwave", emoji: "🌩", name: "Shockwave", description: "If broken next turn, pot is cut in half" },
  { type: "reverse", emoji: "🌀", name: "Reverse", description: "Breaker only gets half the pot for 3 turns" },
];

// Bomb is special - only appears randomly when pot is 50-500
export const BOMB_POWER = { type: "bomb" as PowerType, emoji: "💣", name: "Bomb", description: "If no move in 60s, pot nukes to zero" };

export interface DominoInChain {
  id: number;
  placedBy: {
    fid: number;
    username: string;
  };
  topValue: number;
  bottomValue: number;
  placedAt: string;
  isPowerDomino?: boolean;
  powerType?: PowerType;
}

export interface ActivePower {
  type: PowerType;
  emoji: string;
  name: string;
  turnsRemaining?: number;
  expiresAt?: string;
}

export interface GameState {
  currentDominoCount: number;
  currentPotPoints: number;
  lastMoveAt: string | null;
  dominoes: DominoInChain[];
  lastBreaker: {
    fid: number;
    username: string;
    potWon: number;
    chainLength: number;
  } | null;
  activePower: ActivePower | null;
  bombUsedThisGame: boolean;
}

export interface MoveResult {
  success: boolean;
  message: string;
  state: GameState;
  player?: Player;
  pointsAwarded?: number;
}

// KV Key for game state
const GAME_STATE_KEY = "game:state";

// Constants
const EXTEND_COST = 10;
const BREAK_COST = 20;
const MIN_DOMINOES_TO_BREAK = 3;
const POWER_DOMINO_INTERVAL = 7;
const BOMB_MIN_POT = 50;
const BOMB_MAX_POT = 500;
const BOMB_CHANCE = 0.15;

// Default game state
const defaultGameState: GameState = {
  currentDominoCount: 0,
  currentPotPoints: 0,
  lastMoveAt: null,
  dominoes: [],
  lastBreaker: null,
  activePower: null,
  bombUsedThisGame: false,
};

// Check if KV is available
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// In-memory fallback
let localGameState: GameState = { ...defaultGameState };

// Load game state
async function loadGameState(): Promise<GameState> {
  if (!isKVAvailable()) {
    return { ...localGameState, dominoes: [...localGameState.dominoes] };
  }

  try {
    const state = await kv.get<GameState>(GAME_STATE_KEY);
    if (state) {
      return state;
    }
  } catch (error) {
    console.error("[GameState] KV load error:", error);
  }

  return { ...defaultGameState };
}

// Save game state
async function saveGameState(state: GameState): Promise<void> {
  if (!isKVAvailable()) {
    localGameState = { ...state, dominoes: [...state.dominoes] };
    return;
  }

  try {
    await kv.set(GAME_STATE_KEY, state);
  } catch (error) {
    console.error("[GameState] KV save error:", error);
    localGameState = { ...state, dominoes: [...state.dominoes] };
  }
}

// Helper functions
function randomDominoValue(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function getRandomPower(): ActivePower {
  const power = POWER_DOMINOES[Math.floor(Math.random() * POWER_DOMINOES.length)];
  const activePower: ActivePower = {
    type: power.type,
    emoji: power.emoji,
    name: power.name,
  };

  if (power.type === "reverse") {
    activePower.turnsRemaining = 3;
  }

  return activePower;
}

function shouldPlaceBomb(currentPot: number, bombUsed: boolean): boolean {
  if (bombUsed) return false;
  if (currentPot < BOMB_MIN_POT || currentPot > BOMB_MAX_POT) return false;
  return Math.random() < BOMB_CHANCE;
}

function createBombPower(): ActivePower {
  return {
    type: BOMB_POWER.type,
    emoji: BOMB_POWER.emoji,
    name: BOMB_POWER.name,
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  };
}

// Check if bomb has expired
async function checkBombExpiry(state: GameState): Promise<boolean> {
  if (state.activePower?.type === "bomb" && state.activePower.expiresAt) {
    const expiresAt = new Date(state.activePower.expiresAt).getTime();
    if (Date.now() > expiresAt) {
      console.log("[GameState] 💣 BOMB EXPLODED! Pot nuked to zero!");
      state.currentPotPoints = 0;
      state.activePower = null;
      await saveGameState(state);
      return true;
    }
  }
  return false;
}

// Public API
export async function getGameState(): Promise<GameState> {
  const state = await loadGameState();

  // Check if bomb has expired
  await checkBombExpiry(state);

  // Initialize fields if not present
  if (state.activePower === undefined) {
    state.activePower = null;
  }
  if (state.bombUsedThisGame === undefined) {
    state.bombUsedThisGame = false;
  }

  return {
    ...state,
    dominoes: [...state.dominoes],
  };
}

export function getGameConstants() {
  return {
    EXTEND_COST,
    BREAK_COST,
    MIN_DOMINOES_TO_BREAK,
  };
}

export async function extendChain(
  fid: number,
  username: string,
  displayName?: string
): Promise<MoveResult> {
  const state = await loadGameState();

  // Check if bomb has expired first
  const bombExploded = await checkBombExpiry(state);

  // Get or create player
  const player = await getOrCreatePlayer(fid, username, displayName);

  // Check if player has enough points
  if (player.pointsBalance < EXTEND_COST) {
    return {
      success: false,
      message: `Not enough points! You have ${player.pointsBalance}, need ${EXTEND_COST}.`,
      state: await getGameState(),
      player,
    };
  }

  // Deduct points from player
  await updatePlayerBalance(fid, -EXTEND_COST);
  await recordExtend(fid);

  // Calculate pot addition (check for Double Down power)
  let potAddition = EXTEND_COST;
  let powerMessage = "";

  if (state.activePower?.type === "double_down") {
    potAddition = EXTEND_COST * 2;
    powerMessage = " 🔥 Double Down! +20 to pot!";
    state.activePower = null;
  }

  // Check if this is a power domino (every 7th tile)
  const newDominoNumber = state.currentDominoCount + 1;
  const isPowerDomino = newDominoNumber % POWER_DOMINO_INTERVAL === 0;
  let newPower: ActivePower | null = null;

  // Calculate pot after this placement
  const potAfterPlacement = state.currentPotPoints + potAddition;

  // Check for bomb placement
  const bombTriggered = shouldPlaceBomb(potAfterPlacement, state.bombUsedThisGame || false);

  if (bombTriggered) {
    newPower = createBombPower();
    state.activePower = newPower;
    state.bombUsedThisGame = true;
    powerMessage += ` 💣 BOMB PLACED! 60 seconds until detonation!`;
  } else if (isPowerDomino) {
    newPower = getRandomPower();
    state.activePower = newPower;
    powerMessage += ` ⚡ POWER DOMINO! ${newPower.emoji} ${newPower.name} activated!`;
  }

  // Add domino to chain
  const newDomino: DominoInChain = {
    id: newDominoNumber,
    placedBy: { fid, username },
    topValue: randomDominoValue(),
    bottomValue: randomDominoValue(),
    placedAt: new Date().toISOString(),
    isPowerDomino: isPowerDomino || bombTriggered,
    powerType: newPower?.type,
  };

  state.dominoes.push(newDomino);
  state.currentDominoCount += 1;
  state.currentPotPoints += potAddition;
  state.lastMoveAt = new Date().toISOString();

  // Decrement reverse turns if active
  if (state.activePower?.type === "reverse" && state.activePower.turnsRemaining) {
    if (!isPowerDomino) {
      state.activePower.turnsRemaining -= 1;
      if (state.activePower.turnsRemaining <= 0) {
        state.activePower = null;
      }
    }
  }

  // Save state
  await saveGameState(state);

  // Get updated player data
  const updatedPlayer = await getOrCreatePlayer(fid, username);

  let message = `${username} placed domino #${state.currentDominoCount}!`;
  if (bombExploded) {
    message = `💣 BOOM! The bomb exploded and nuked the pot! ` + message;
  }
  message += powerMessage;

  return {
    success: true,
    message,
    state: await getGameState(),
    player: updatedPlayer,
  };
}

export async function breakChain(
  fid: number,
  username: string,
  displayName?: string
): Promise<MoveResult> {
  const state = await loadGameState();

  // Check if bomb has expired first
  await checkBombExpiry(state);

  // Get or create player
  const player = await getOrCreatePlayer(fid, username, displayName);

  // Check if player has enough points to break
  if (player.pointsBalance < BREAK_COST) {
    return {
      success: false,
      message: `Not enough points to break! Need ${BREAK_COST}, you have ${player.pointsBalance}.`,
      state: await getGameState(),
      player,
    };
  }

  // Check minimum dominoes
  if (state.currentDominoCount < MIN_DOMINOES_TO_BREAK) {
    return {
      success: false,
      message: `Need at least ${MIN_DOMINOES_TO_BREAK} dominoes to break the chain!`,
      state: await getGameState(),
      player,
    };
  }

  // Check pot is not empty
  if (state.currentPotPoints <= 0) {
    return {
      success: false,
      message: `No points in the pot to claim!`,
      state: await getGameState(),
      player,
    };
  }

  let potWon = state.currentPotPoints;
  const chainLength = state.currentDominoCount;
  let powerMessage = "";

  // Apply power effects on break
  if (state.activePower) {
    const power = state.activePower;

    if (power.type === "shockwave") {
      potWon = Math.floor(potWon / 2);
      powerMessage = ` 🌩 Shockwave! Pot was cut in half!`;
    } else if (power.type === "reverse") {
      potWon = Math.floor(potWon / 2);
      powerMessage = ` 🌀 Reverse! You only got half the pot!`;
      if (power.turnsRemaining && power.turnsRemaining > 1) {
        state.activePower.turnsRemaining = power.turnsRemaining - 1;
      } else {
        state.activePower = null;
      }
    }
  }

  // Clear non-persistent powers after break
  if (state.activePower?.type === "shockwave" || state.activePower?.type === "bomb") {
    state.activePower = null;
  }

  // Deduct break cost from player
  await updatePlayerBalance(fid, -BREAK_COST);
  
  // Record the break for leaderboard (but DON'T add pot to balance)
  // Players only get 100 points per day - breaking scores points but doesn't refund them
  await recordBreak(fid, chainLength, potWon);
  
  // Get fresh player data
  const finalPlayer = await getOrCreatePlayer(fid, username) || player;

  // Store the breaker info
  state.lastBreaker = {
    fid,
    username,
    potWon,
    chainLength,
  };

  // Reset the chain
  state.currentDominoCount = 0;
  state.currentPotPoints = 0;
  state.dominoes = [];
  state.lastMoveAt = new Date().toISOString();
  state.bombUsedThisGame = false;

  // Clear any remaining power (except reverse which persists)
  if (state.activePower?.type !== "reverse") {
    state.activePower = null;
  }

  // Save state
  await saveGameState(state);

  return {
    success: true,
    message: `💥 ${username} broke a ${chainLength}-domino chain and claimed ${potWon} points!${powerMessage}`,
    state: await getGameState(),
    player: finalPlayer,
    pointsAwarded: potWon,
  };
}

export async function resetGame(): Promise<GameState> {
  const newState = { ...defaultGameState, activePower: null, bombUsedThisGame: false };
  await saveGameState(newState);
  return getGameState();
}
