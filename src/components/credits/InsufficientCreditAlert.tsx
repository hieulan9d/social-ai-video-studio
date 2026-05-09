export function InsufficientCreditAlert() {
  return (
    <div className="rounded-[12px] border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
      Bạn không đủ credit để thực hiện thao tác này.
    </div>
  );
}
