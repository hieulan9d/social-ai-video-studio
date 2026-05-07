import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách hoàn tín dụng",
  description: "Chính sách hoàn tín dụng của Social AI Video Studio.",
};

const policies = [
  "Tín dụng đã trừ cho lỗi generation hoặc render thuộc phía nền tảng sẽ được hoàn tự động khi không có output dùng được.",
  "Hoàn tiền thanh toán, chargeback hoặc điều chỉnh tín dụng thủ công được admin xử lý thông qua giao dịch ví có thể audit.",
  "Tín dụng không được hoàn cho lỗi thao tác của người dùng như prompt sai, tải nhầm tài sản hoặc output đã duyệt nhưng không khớp sở thích sáng tạo chủ quan.",
  "Thanh toán thất bại không cộng tín dụng và không cần hoàn tín dụng trong ví.",
];

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold">
          Social AI Video Studio
        </Link>
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Cập nhật lần cuối: 8 tháng 5, 2026
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Chính sách hoàn tín dụng</h1>
        <p className="mt-5 leading-8 text-[var(--muted-foreground)]">
          Social AI Video Studio dùng workflow dựa trên tín dụng. Nền tảng được
          thiết kế để hoàn tín dụng khi tác vụ trả phí thất bại sau khi đã trừ.
        </p>
        <div className="mt-10 space-y-4">
          {policies.map((policy) => (
            <div
              key={policy}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted-foreground)]"
            >
              {policy}
            </div>
          ))}
        </div>
        <p className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
          Nội dung này đã sẵn sàng cho MVP, nhưng nên được rà soát bởi tư vấn pháp
          lý trước khi phát hành thương mại.
        </p>
      </div>
    </main>
  );
}
