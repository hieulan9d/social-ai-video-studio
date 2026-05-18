import { StyleStudio } from "./style-studio";

export default function StylesPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🎨 Phong cách tạo ảnh</h1>
        <p className="text-sm text-gray-500">
          Tạo và quản lý các phong cách (prompt template). Người dùng chỉ cần chọn phong cách,
          điền thông tin sản phẩm, upload ảnh → tạo ảnh ngay.
        </p>
      </div>
      <StyleStudio />
    </div>
  );
}
