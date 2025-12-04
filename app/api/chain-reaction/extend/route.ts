import { NextRequest, NextResponse } from "next/server";
import { extendChain } from "../gameState";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username } = body;

    if (!fid) {
      return NextResponse.json(
        { success: false, message: "Missing FID" },
        { status: 400 }
      );
    }

    const result = await extendChain(fid, username || `fid:${fid}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Extend error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to extend chain" },
      { status: 500 }
    );
  }
}

