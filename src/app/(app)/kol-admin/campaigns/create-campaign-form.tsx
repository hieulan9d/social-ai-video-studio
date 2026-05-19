"use client";

import { useState } from "react";
import { createCampaignAction } from "./actions";

export function CreateCampaignForm({
  kolId,
  workspaceId,
}: {
  kolId: string;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-1.5 border border-dashed border-white/20 rounded text-xs text-gray-400 hover:text-white hover:border-white/40 transition-colors"
      >
        + Tạo campaign mới
      </button>
    );
  }

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      await createCampaignAction(formData);
      setOpen(false);
    } catch {
      alert("Lỗi tạo campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="border border-white/10 rounded p-3 space-y-2 bg-white/5">
      <input type="hidden" name="kolId" value={kolId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <input
        name="name"
        required
        placeholder="Tên campaign (e.g. Skincare Campaign)"
        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          name="platform"
          className="px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs"
        >
          <option value="" className="bg-gray-900">Platform</option>
          <option value="TikTok" className="bg-gray-900">TikTok</option>
          <option value="Reels" className="bg-gray-900">Reels</option>
          <option value="Shorts" className="bg-gray-900">Shorts</option>
          <option value="Facebook" className="bg-gray-900">Facebook</option>
        </select>
        <select
          name="content_type"
          className="px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs"
        >
          <option value="" className="bg-gray-900">Content type</option>
          <option value="commercial" className="bg-gray-900">Commercial</option>
          <option value="educational" className="bg-gray-900">Educational</option>
          <option value="branding" className="bg-gray-900">Branding</option>
          <option value="romance" className="bg-gray-900">Romance</option>
        </select>
      </div>

      <textarea
        name="campaign_goal"
        placeholder="Mục tiêu campaign (tùy chọn)"
        rows={2}
        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium disabled:opacity-50"
        >
          {submitting ? "..." : "Tạo"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 border border-white/10 rounded text-xs hover:bg-white/5"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
