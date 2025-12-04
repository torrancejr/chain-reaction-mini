import { NextRequest, NextResponse } from "next/server";
import { getOrCreatePlayer } from "../playerStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, displayName } = body;

    if (!fid) {
      return NextResponse.json(
        { success: false, message: "Missing FID" },
        { status: 400 }
      );
    }

    const player = await getOrCreatePlayer(fid, username || `fid:${fid}`, displayName);

    return NextResponse.json({
      success: true,
      player,
    });
  } catch (error) {
    console.error("Player fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch player" },
      { status: 500 }
    );
  }
}

