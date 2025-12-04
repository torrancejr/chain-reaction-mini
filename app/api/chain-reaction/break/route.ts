import { NextRequest, NextResponse } from "next/server";
import { breakChain } from "../gameState";

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

    const result = await breakChain(fid, username || `fid:${fid}`);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Break error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to break chain" },
      { status: 500 }
    );
  }
}

