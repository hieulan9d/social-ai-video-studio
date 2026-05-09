import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "MoMo đã tắt. Vui lòng dùng PayOS để nạp credit.",
    },
    { status: 410 },
  );
}
