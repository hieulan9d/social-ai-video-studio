"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

export function CreditBalance() {
  const { balance, loading } = useCredits();

  return (
    <Link
      href="/credits"
      className="inline-flex items-center gap-2 rounded-full border border-[rgba(251,191,36,0.22)] bg-[color:color-mix(in_srgb,#111c35_78%,rgba(251,191,36,0.22)_22%)] px-4 py-2 text-[12px] text-[var(--foreground)]"
    >
      <Coins className="h-4 w-4 text-[#fbbf24]" />
      <span>{loading ? "Đang tải..." : `Credit: ${balance.toLocaleString("vi-VN")}`}</span>
    </Link>
  );
}
