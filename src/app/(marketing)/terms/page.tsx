import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ",
  description: "Điều khoản dịch vụ của Social AI Video Studio.",
};

const sections = [
  {
    title: "Sử dụng dịch vụ",
    body: "Người dùng chịu trách nhiệm với brief, prompt, tài sản tải lên, output đã tạo và chiến dịch được tạo thông qua nền tảng.",
  },
  {
    title: "Tín dụng và thanh toán",
    body: "Tín dụng là đơn vị sử dụng trả trước được lưu trong cơ sở dữ liệu. Giao dịch mua chỉ được cộng tín dụng sau khi xác nhận thanh toán hợp lệ, và các action trả phí có thể trừ tín dụng trước khi chạy.",
  },
  {
    title: "AI generation và render",
    body: "Output AI có thể thay đổi theo từng lần tạo. Nền tảng lưu trạng thái render và generation, đồng thời có thể hoàn tín dụng cho lỗi thuộc phía nền tảng khi không tạo được output dùng được.",
  },
  {
    title: "Nội dung của người dùng",
    body: "Người dùng cần có quyền hợp lệ để tải lên và xử lý hình ảnh, logo, nhạc, voiceover, phụ đề và các tài liệu chiến dịch khác.",
  },
  {
    title: "Giới hạn vận hành",
    body: "Dịch vụ có thể áp dụng giới hạn sử dụng, giới hạn theo provider, kiểm tra file, policy storage và hạn chế tài khoản để bảo vệ tính toàn vẹn của nền tảng.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold">
          Social AI Video Studio
        </Link>
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Cập nhật lần cuối: 8 tháng 5, 2026
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Điều khoản dịch vụ</h1>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-8 text-[var(--muted-foreground)]">
                {section.body}
              </p>
            </section>
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
