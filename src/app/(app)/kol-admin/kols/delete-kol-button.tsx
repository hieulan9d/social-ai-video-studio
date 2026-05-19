"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
      className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      title="Xóa KOL"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
