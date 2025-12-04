import { NextResponse } from "next/server";
import { getDailyLeaderboard, getWeeklyLeaderboard } from "../playerStore";

export async function GET() {
  const daily = await getDailyLeaderboard(5);
  const weekly = await getWeeklyLeaderboard(5);
  
  return NextResponse.json({
    success: true,
    daily,
    weekly,
  });
}
