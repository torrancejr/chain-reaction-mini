// Player data store with Vercel KV for production
// Falls back to in-memory for local development

import { kv } from "@vercel/kv";

export interface Player {
  fid: number;
  username: string;
  displayName: string;
  pointsBalance: number;
  totalPotWon: number;
  lastBreakPot: number;
  lastBreakAt: string | null;
  dailyBreakPot: number;
  weeklyBreakPot: number;
  dominoesPlaced: number;
  chainsBroken: number;
  longestChainAtBreak: number;
  lastDailyReset: string;
  createdAt: string;
  lastActiveAt: string;
}

// Starting balance for new players (resets daily)
const STARTING_POINTS = 100;

// KV Keys
const PLAYER_KEY = (fid: number) => `player:${fid}`;
const DAILY_LEADERBOARD_KEY = () => `leaderboard:daily:${getTodayDateString()}`;
const WEEKLY_LEADERBOARD_KEY = () => `leaderboard:weekly:${getWeekStartString()}`;
const ALL_PLAYERS_KEY = "players:all";

// Check if we're in production (KV available)
function isKVAvailable(): boolean {
  const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  console.log(`[PlayerStore] KV Available: ${hasKV}, URL exists: ${!!process.env.KV_REST_API_URL}, Token exists: ${!!process.env.KV_REST_API_TOKEN}`);
  return hasKV;
}

// In-memory fallback for local development
const localPlayers: Map<number, Player> = new Map();

// Date helpers
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekStartString(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  return weekStart.toISOString().split("T")[0];
}

function isThisWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const weekStart = new Date(getWeekStartString());
  return date >= weekStart;
}

// Check and reset player's daily points if needed
function checkAndResetDaily(player: Player): boolean {
  const today = getTodayDateString();
  const lastReset = player.lastDailyReset || "";

  if (!lastReset) {
    player.lastDailyReset = today;
    player.dailyBreakPot = player.dailyBreakPot || 0;
    player.weeklyBreakPot = player.weeklyBreakPot || 0;
    return true;
  }

  if (lastReset !== today) {
    player.pointsBalance = STARTING_POINTS;
    player.dailyBreakPot = 0;
    player.lastDailyReset = today;

    if (!isThisWeek(lastReset)) {
      player.weeklyBreakPot = 0;
    }

    console.log(`[PlayerStore] Daily reset for ${player.username}: ${STARTING_POINTS} points`);
    return true;
  }

  return false;
}

// Get a player by FID
export async function getPlayer(fid: number): Promise<Player | null> {
  if (!isKVAvailable()) {
    return localPlayers.get(fid) || null;
  }

  try {
    const player = await kv.get<Player>(PLAYER_KEY(fid));
    return player;
  } catch (error) {
    console.error("[PlayerStore] KV get error:", error);
    return localPlayers.get(fid) || null;
  }
}

// Save a player
async function savePlayer(player: Player): Promise<void> {
  if (!isKVAvailable()) {
    localPlayers.set(player.fid, player);
    return;
  }

  try {
    await kv.set(PLAYER_KEY(player.fid), player);
    // Also add to the set of all player FIDs
    await kv.sadd(ALL_PLAYERS_KEY, player.fid);
  } catch (error) {
    console.error("[PlayerStore] KV save error:", error);
    localPlayers.set(player.fid, player);
  }
}

// Get or create a player
export async function getOrCreatePlayer(
  fid: number,
  username: string,
  displayName?: string
): Promise<Player> {
  let player = await getPlayer(fid);
  console.log(`[PlayerStore] getOrCreatePlayer fid=${fid}, found=${!!player}, balance=${player?.pointsBalance}`);

  if (!player) {
    const today = getTodayDateString();
    player = {
      fid,
      username,
      displayName: displayName || username,
      pointsBalance: STARTING_POINTS,
      totalPotWon: 0,
      lastBreakPot: 0,
      lastBreakAt: null,
      dailyBreakPot: 0,
      weeklyBreakPot: 0,
      dominoesPlaced: 0,
      chainsBroken: 0,
      longestChainAtBreak: 0,
      lastDailyReset: today,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    await savePlayer(player);
    console.log(`[PlayerStore] Created NEW player: ${username} (fid: ${fid}) with ${STARTING_POINTS} points`);
  } else {
    console.log(`[PlayerStore] Found EXISTING player: ${username} (fid: ${fid}) with ${player.pointsBalance} points`);
    const wasReset = checkAndResetDaily(player);
    player.username = username;
    if (displayName) player.displayName = displayName;
    player.lastActiveAt = new Date().toISOString();
    if (wasReset) {
      console.log(`[PlayerStore] Daily reset triggered for ${username}`);
      await savePlayer(player);
    }
  }

  return player;
}

// Update player balance
export async function updatePlayerBalance(fid: number, amount: number): Promise<Player | null> {
  const player = await getPlayer(fid);
  if (!player) return null;

  player.pointsBalance += amount;
  player.lastActiveAt = new Date().toISOString();
  await savePlayer(player);
  return player;
}

// Record a domino placement
export async function recordExtend(fid: number): Promise<Player | null> {
  const player = await getPlayer(fid);
  if (!player) return null;

  player.dominoesPlaced += 1;
  player.lastActiveAt = new Date().toISOString();
  await savePlayer(player);
  return player;
}

// Record a chain break
export async function recordBreak(fid: number, chainLength: number, potWon: number): Promise<Player | null> {
  const player = await getPlayer(fid);
  if (!player) return null;

  player.chainsBroken += 1;
  player.totalPotWon += potWon;
  player.lastBreakPot = potWon;
  player.lastBreakAt = new Date().toISOString();

  if (potWon > (player.dailyBreakPot || 0)) {
    player.dailyBreakPot = potWon;
  }

  if (potWon > (player.weeklyBreakPot || 0)) {
    player.weeklyBreakPot = potWon;
  }

  if (chainLength > player.longestChainAtBreak) {
    player.longestChainAtBreak = chainLength;
  }

  player.lastActiveAt = new Date().toISOString();
  await savePlayer(player);

  // Update leaderboards
  if (isKVAvailable()) {
    try {
      await kv.zadd(DAILY_LEADERBOARD_KEY(), { score: player.dailyBreakPot, member: player.fid.toString() });
      await kv.zadd(WEEKLY_LEADERBOARD_KEY(), { score: player.weeklyBreakPot, member: player.fid.toString() });
    } catch (error) {
      console.error("[PlayerStore] Failed to update leaderboard:", error);
    }
  }

  return player;
}

// Get daily leaderboard
export async function getDailyLeaderboard(limit: number = 5): Promise<Player[]> {
  if (!isKVAvailable()) {
    // Local fallback
    return Array.from(localPlayers.values())
      .filter((p) => (p.dailyBreakPot ?? 0) > 0)
      .sort((a, b) => (b.dailyBreakPot ?? 0) - (a.dailyBreakPot ?? 0))
      .slice(0, limit);
  }

  try {
    // Get top FIDs from sorted set (highest scores first)
    const topFids = await kv.zrange<string[]>(DAILY_LEADERBOARD_KEY(), 0, limit - 1, { rev: true });
    
    if (!topFids || topFids.length === 0) {
      return [];
    }

    // Fetch all player data
    const players: Player[] = [];
    for (const fidStr of topFids) {
      const player = await getPlayer(parseInt(fidStr));
      if (player && player.dailyBreakPot > 0) {
        players.push(player);
      }
    }

    return players.sort((a, b) => (b.dailyBreakPot ?? 0) - (a.dailyBreakPot ?? 0));
  } catch (error) {
    console.error("[PlayerStore] Failed to get daily leaderboard:", error);
    return [];
  }
}

// Get weekly leaderboard
export async function getWeeklyLeaderboard(limit: number = 5): Promise<Player[]> {
  if (!isKVAvailable()) {
    return Array.from(localPlayers.values())
      .filter((p) => (p.weeklyBreakPot ?? 0) > 0)
      .sort((a, b) => (b.weeklyBreakPot ?? 0) - (a.weeklyBreakPot ?? 0))
      .slice(0, limit);
  }

  try {
    const topFids = await kv.zrange<string[]>(WEEKLY_LEADERBOARD_KEY(), 0, limit - 1, { rev: true });
    
    if (!topFids || topFids.length === 0) {
      return [];
    }

    const players: Player[] = [];
    for (const fidStr of topFids) {
      const player = await getPlayer(parseInt(fidStr));
      if (player && player.weeklyBreakPot > 0) {
        players.push(player);
      }
    }

    return players.sort((a, b) => (b.weeklyBreakPot ?? 0) - (a.weeklyBreakPot ?? 0));
  } catch (error) {
    console.error("[PlayerStore] Failed to get weekly leaderboard:", error);
    return [];
  }
}

// Legacy function for backwards compat
export async function getLeaderboard(limit: number = 10): Promise<Player[]> {
  return getWeeklyLeaderboard(limit);
}

// Get all players
export async function getAllPlayers(): Promise<Player[]> {
  if (!isKVAvailable()) {
    return Array.from(localPlayers.values());
  }

  try {
    const fids = await kv.smembers<number[]>(ALL_PLAYERS_KEY);
    if (!fids || fids.length === 0) return [];

    const players: Player[] = [];
    for (const fid of fids) {
      const player = await getPlayer(fid);
      if (player) players.push(player);
    }
    return players;
  } catch (error) {
    console.error("[PlayerStore] Failed to get all players:", error);
    return [];
  }
}
