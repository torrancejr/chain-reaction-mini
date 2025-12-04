import { NextResponse } from "next/server";
import { getGameState, getGameConstants } from "../gameState";

export async function GET() {
  const state = await getGameState();
  const constants = getGameConstants();
  return NextResponse.json({
    ...state,
    constants,
  });
}

