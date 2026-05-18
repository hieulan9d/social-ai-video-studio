import { StyleStudio } from "./style-studio";
import { ImageIcon } from "lucide-react";

export default function StylesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-600/10 via-teal-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Phong cách ảnh</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Tạo và quản lý prompt templates — người dùng chỉ cần chọn phong cách, điền thông tin, tạo ảnh ngay.
            </p>
          </div>
        </div>
      </div>

      <StyleStudio />
    </div>
  );
}
