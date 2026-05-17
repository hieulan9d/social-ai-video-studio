"use client";

import { useState } from "react";
import { deleteKolAction } from "./actions";

export function DeleteKolButton({ kolId, kolName }: { kolId: string; kolName: string }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Xóa KOL "${kolName}"?\n\nHành động này sẽ soft-delete KOL và tất cả dữ liệu liên quan.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteKolAction(kolId);
    } catch (error) {
      alert(`Lỗi xóa: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded text-xs font-medium text-red-400 whitespace-nowrap disabled:opacity-50"
      title="Xóa KOL"
    >
      {deleting ? "..." : "🗑 Xóa"}
    </button>
  );
}
