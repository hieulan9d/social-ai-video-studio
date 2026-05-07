import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư",
  description: "Chính sách quyền riêng tư của Social AI Video Studio.",
};

const sections = [
  {
    title: "Dữ liệu chúng tôi xử lý",
    body: "Chúng tôi xử lý thông tin tài khoản, brief dự án, tài sản tải lên, kịch bản đã tạo, metadata render, bản ghi ví tín dụng, thanh toán và analytics vận hành cần thiết để chạy sản phẩm.",
  },
  {
    title: "Cách dữ liệu được sử dụng",
    body: "Dữ liệu được dùng để xác thực người dùng, bảo vệ dự án riêng tư, tạo tài sản sản xuất bằng AI, xử lý giao dịch tín dụng, khắc phục job lỗi và cải thiện độ tin cậy của sản phẩm.",
  },
  {
    title: "Tài sản và output",
    body: "File tải lên và video đã tạo được giới hạn theo người dùng và dự án sở hữu. Quyền truy cập được kiểm soát bằng policy cơ sở dữ liệu, signed URL và kiểm tra phân quyền ở backend.",
  },
  {
    title: "Nhà cung cấp dịch vụ",
    body: "Nền tảng có thể dùng Supabase, payment provider, AI text provider, Google Veo, storage provider và hạ tầng hosting để cung cấp dịch vụ.",
  },
  {
    title: "Thời gian lưu trữ",
    body: "Bản ghi vận hành được lưu khi cần cho thanh toán, audit, hỗ trợ, tính toàn vẹn sản phẩm và nghĩa vụ pháp lý. Bản ghi ledger tài chính không nên bị xóa tùy tiện.",
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Chính sách quyền riêng tư" updated="8 tháng 5, 2026" sections={sections} />;
}

function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: Array<{ title: string; body: string }>;
}) {
  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold">
          Social AI Video Studio
        </Link>
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Cập nhật lần cuối: {updated}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
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
