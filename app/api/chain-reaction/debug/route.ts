import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// Debug endpoint to check player data directly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({
      error: "Missing fid parameter",
      usage: "/api/chain-reaction/debug?fid=YOUR_FID",
    });
  }

  const now = new Date();
  const todayUTC = now.toISOString().split("T")[0];

  try {
    // Check if KV is available
    const kvAvailable = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

    if (!kvAvailable) {
      return NextResponse.json({
        kvAvailable: false,
        message: "KV not configured - using local storage",
      });
    }

    // Get raw player data from KV
    const playerKey = `player:${fid}`;
    const player = await kv.get(playerKey);

    return NextResponse.json({
      kvAvailable: true,
      playerKey,
      currentTimeUTC: now.toISOString(),
      todayDateUTC: todayUTC,
      playerFound: !!player,
      playerData: player,
      analysis: player ? {
        lastDailyReset: (player as Record<string, unknown>).lastDailyReset,
        pointsBalance: (player as Record<string, unknown>).pointsBalance,
        needsReset: (player as Record<string, unknown>).lastDailyReset !== todayUTC,
        daysOld: player ? Math.floor((now.getTime() - new Date(String((player as Record<string, unknown>).lastDailyReset)).getTime()) / (1000 * 60 * 60 * 24)) : null,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      kvAvailable: null,
    });
  }
}

// Force reset endpoint
export async function POST(request: NextRequest) {
  const { fid } = await request.json();

  if (!fid) {
    return NextResponse.json({ error: "Missing fid" }, { status: 400 });
  }

  const kvAvailable = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (!kvAvailable) {
    return NextResponse.json({ error: "KV not available" }, { status: 500 });
  }

  try {
    const playerKey = `player:${fid}`;
    const player = await kv.get(playerKey) as Record<string, unknown> | null;

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const todayUTC = new Date().toISOString().split("T")[0];

    // Force reset
    player.pointsBalance = 100;
    player.lastDailyReset = todayUTC;
    player.dailyBreakPot = 0;

    await kv.set(playerKey, player);

    return NextResponse.json({
      success: true,
      message: "Forced reset complete",
      newBalance: 100,
      lastDailyReset: todayUTC,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

