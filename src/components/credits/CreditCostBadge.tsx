export function CreditCostBadge({
  cost,
  label = "Chi phí",
}: {
  cost: number;
  label?: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-[rgba(251,191,36,0.24)] bg-[#111c35] px-3 py-1 text-[11px] text-[#fbbf24]">
      {label}: {cost.toLocaleString("vi-VN")} credit
    </span>
  );
}
