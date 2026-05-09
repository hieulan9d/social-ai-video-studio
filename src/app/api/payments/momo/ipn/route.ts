import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      resultCode: 1,
      message: "MoMo is disabled. Use PayOS webhook.",
    },
    { status: 410 },
  );
}
