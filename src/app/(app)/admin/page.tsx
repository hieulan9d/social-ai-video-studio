import {
  Activity,
  BadgeDollarSign,
  CreditCard,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Video,
  WalletCards,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  manualRefundCreditsAction,
  markFailedExportReviewedAction,
  markFailedRenderReviewedAction,
  updateAdminPaymentAction,
  updateAdminUserAction,
  updateFeaturePriceAction,
  upsertCreditPackageAction,
  upsertPromptTemplateAction,
} from "@/lib/admin/actions";
import { getAdminDashboardData } from "@/lib/admin/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import type {
  AdminCreditPackageRecord,
  AdminAnalyticsEventRecord,
  AdminFailedExportRecord,
  AdminFailedRenderRecord,
  AdminPaymentRecord,
  AdminPromptTemplateRecord,
  AdminUserRecord,
  AdminWalletRecord,
} from "@/lib/admin/types";
import type { PaymentStatus } from "@/lib/payments/types";
import type { FeaturePriceRecord } from "@/lib/pricing/types";

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "processing",
  "success",
  "paid",
  "credited",
  "failed",
  "refunded",
  "cancelled",
];

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "đang chờ",
  processing: "đang xử lý",
  success: "thành công",
  paid: "đã thanh toán",
  credited: "đã cộng credit",
  failed: "thất bại",
  refunded: "đã hoàn",
  cancelled: "đã hủy",
};

export default async function AdminDashboardPage() {
  let data;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Admin dashboard page load failed:", error);
    return <ServerDataFallback />;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Vận hành
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Bảng điều khiển admin
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
          Quản lý người dùng, ví tín dụng, thanh toán, lỗi render, template và
          bảng giá tín dụng bằng các admin action phía server.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Người dùng" value={data.metrics.users} icon={Users} />
        <MetricCard
          label="Đang hoạt động"
          value={data.metrics.activeUsers}
          icon={ShieldCheck}
        />
        <MetricCard
          label="Thanh toán"
          value={data.metrics.payments}
          icon={CreditCard}
        />
        <MetricCard
          label="Job lỗi"
          value={data.metrics.failedJobs}
          icon={Video}
        />
        <MetricCard
          label="Tín dụng ví"
          value={data.metrics.walletCredits}
          icon={WalletCards}
        />
        <MetricCard
          label="Lượt xem trang"
          value={data.metrics.pageViews}
          icon={Activity}
        />
      </div>

      <SurfaceCard>
        <AnalyticsSection events={data.analyticsEvents} />
      </SurfaceCard>

      <SurfaceCard>
        <UsersSection users={data.users} />
      </SurfaceCard>

      <SurfaceCard>
        <WalletsSection wallets={data.wallets} />
      </SurfaceCard>

      <SurfaceCard>
        <PaymentsSection payments={data.payments} />
      </SurfaceCard>

      <SurfaceCard>
        <FailedJobsSection
          failedRenders={data.failedRenders}
          failedExports={data.failedExports}
        />
      </SurfaceCard>

      <SurfaceCard>
        <PricingSection
          packages={data.creditPackages}
          featurePrices={data.featurePrices}
        />
      </SurfaceCard>

      <SurfaceCard>
        <TemplatesSection templates={data.templates} />
      </SurfaceCard>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function UsersSection({ users }: { users: AdminUserRecord[] }) {
  return (
    <section>
      <SectionTitle icon={Users} title="Người dùng" />
      <div className="mt-5 space-y-4">
        {users.map((user) => (
          <form
            key={user.id}
            action={updateAdminUserAction}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
          >
            <input type="hidden" name="userId" value={user.id} />
            <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_1.2fr_auto] xl:items-end">
              <div className="min-w-0">
                <p className="truncate font-medium">{user.email}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {user.full_name || user.workspace_name || "Chưa có tên hồ sơ"} /{" "}
                  {user.wallets[0]?.balance_credit ?? 0} tín dụng
                </p>
              </div>
              <FieldLabel label="Vai trò">
                <select name="role" defaultValue={user.role} className={inputClass}>
                  <option value="user">người dùng</option>
                  <option value="admin">admin</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Trạng thái">
                <select
                  name="accountStatus"
                  defaultValue={user.account_status}
                  className={inputClass}
                >
                  <option value="active">đang hoạt động</option>
                  <option value="suspended">đã tạm khóa</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Ghi chú admin">
                <input
                  name="adminNotes"
                  defaultValue={user.admin_notes ?? ""}
                  className={inputClass}
                />
              </FieldLabel>
              <button className={buttonClass}>Lưu</button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}

function AnalyticsSection({ events }: { events: AdminAnalyticsEventRecord[] }) {
  return (
    <section>
      <SectionTitle icon={Activity} title="Analytics" />
      <div className="mt-5 space-y-3">
        {events.length > 0 ? (
          events.slice(0, 12).map((event) => (
            <div
              key={event.id}
              className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 md:grid-cols-[160px_1fr_220px] md:items-center"
            >
              <div>
                <p className="text-sm font-medium">{event.event_name}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
              <p className="truncate text-sm text-[var(--muted-foreground)]">
                {event.path ?? "Không có đường dẫn"}
              </p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {event.profiles?.email ?? "Ẩn danh"}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--muted-foreground)]">
            Chưa có sự kiện analytics.
          </div>
        )}
      </div>
    </section>
  );
}

function WalletsSection({ wallets }: { wallets: AdminWalletRecord[] }) {
  return (
    <section>
      <SectionTitle icon={WalletCards} title="Ví tín dụng và hoàn thủ công" />
      <form
        action={manualRefundCreditsAction}
        className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_160px_1.2fr_1fr_auto] lg:items-end">
          <FieldLabel label="Người dùng">
            <select name="userId" className={inputClass}>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.user_id}>
                  {wallet.profiles?.email ?? wallet.user_id} /{" "}
                  {wallet.balance_credit} tín dụng
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Tín dụng">
            <input name="amount" type="number" min="1" className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Lý do">
            <input name="reason" className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Reference ID">
            <input name="referenceId" className={inputClass} />
          </FieldLabel>
          <button className={buttonClass}>Hoàn tín dụng</button>
        </div>
      </form>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {wallets.slice(0, 12).map((wallet) => (
          <div
            key={wallet.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
          >
            <p className="font-medium">{wallet.profiles?.email ?? wallet.user_id}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Số dư: {wallet.balance_credit} tín dụng
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaymentsSection({ payments }: { payments: AdminPaymentRecord[] }) {
  return (
    <section>
      <SectionTitle icon={CreditCard} title="Thanh toán" />
      <div className="mt-5 space-y-4">
        {payments.map((payment) => (
          <form
            key={payment.id}
            action={updateAdminPaymentAction}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
          >
            <input type="hidden" name="paymentId" value={payment.id} />
            <div className="grid gap-4 xl:grid-cols-[1fr_150px_1fr_auto] xl:items-end">
              <div className="min-w-0">
                <p className="font-medium">
                  {payment.amount} {payment.currency} /{" "}
                  {payment.credits_purchased} tín dụng
                </p>
                <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                  {payment.profiles?.email ?? payment.user_id} / {payment.provider} /{" "}
                  {payment.provider_payment_id ?? payment.id}
                </p>
              </div>
              <FieldLabel label="Trạng thái">
                <select name="status" defaultValue={payment.status} className={inputClass}>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {paymentStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Lý do thất bại">
                <input
                  name="failureReason"
                  defaultValue={payment.failure_reason ?? ""}
                  className={inputClass}
                />
              </FieldLabel>
              <button className={buttonClass}>Cập nhật</button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}

function FailedJobsSection({
  failedRenders,
  failedExports,
}: {
  failedRenders: AdminFailedRenderRecord[];
  failedExports: AdminFailedExportRecord[];
}) {
  return (
    <section>
      <SectionTitle icon={RefreshCcw} title="Render và export thất bại" />
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-medium">Job render</h3>
          {failedRenders.map((job) => (
            <FailedJobCard
              key={job.id}
              jobId={job.id}
              title={`${job.render_mode} / ${job.provider ?? "không rõ"}`}
              subtitle={`${job.profiles?.email ?? job.user_id} / ${
                job.projects?.title ?? job.project_id
              }`}
              error={job.error_message}
              reviewed={job.metadata.admin_reviewed === true}
              action={markFailedRenderReviewedAction}
            />
          ))}
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">Job export</h3>
          {failedExports.map((job) => (
            <FailedJobCard
              key={job.id}
              jobId={job.id}
              title={`Export ${job.export_ratio}`}
              subtitle={`${job.profiles?.email ?? job.user_id} / ${
                job.projects?.title ?? job.project_id
              }`}
              error={job.error_message}
              reviewed={job.metadata.admin_reviewed === true}
              action={markFailedExportReviewedAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FailedJobCard({
  jobId,
  title,
  subtitle,
  error,
  reviewed,
  action,
}: {
  jobId: string;
  title: string;
  subtitle: string;
  error: string | null;
  reviewed: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{title}</p>
            <span className={reviewed ? successPillClass : warningPillClass}>
              {reviewed ? "đã xem xét" : "cần xem xét"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
          <p className="mt-3 text-sm text-rose-300">
            {error ?? "Chưa lưu thông báo lỗi."}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input name="note" placeholder="Ghi chú xử lý" className={inputClass} />
          <button className={buttonClass}>Đánh dấu đã xem</button>
        </div>
      </div>
    </form>
  );
}

function PricingSection({
  packages,
  featurePrices,
}: {
  packages: AdminCreditPackageRecord[];
  featurePrices: FeaturePriceRecord[];
}) {
  return (
    <section>
      <SectionTitle icon={BadgeDollarSign} title="Bảng giá" />
      <div className="mt-5">
        <h3 className="font-medium">Chi phí tín dụng theo tính năng</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Chi phí tính năng khi chạy được đọc từ cơ sở dữ liệu. Các giá trị này
          điều khiển việc trừ tín dụng cho luồng tạo nội dung, render và export.
        </p>
        <div className="mt-4 space-y-4">
          {featurePrices.map((price) => (
            <FeaturePriceForm key={price.id} price={price} />
          ))}
        </div>
      </div>
      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <h3 className="font-medium">Gói tín dụng</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Gói mua quy định số tín dụng người dùng nhận được sau mỗi lần nạp.
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {[...packages, null].map((pkg, index) => (
          <PackageForm key={pkg?.id ?? "new-package"} pkg={pkg} index={index} />
        ))}
      </div>
    </section>
  );
}

function FeaturePriceForm({ price }: { price: FeaturePriceRecord }) {
  return (
    <form
      action={updateFeaturePriceAction}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
    >
      <input type="hidden" name="featureKey" value={price.feature_key} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_140px_100px_auto] xl:items-end">
        <FieldLabel label="Tính năng">
          <input name="name" defaultValue={price.name} className={inputClass} />
        </FieldLabel>
        <FieldLabel label="Mô tả">
          <input
            name="description"
            defaultValue={price.description ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Chi phí tín dụng">
          <input
            name="creditCost"
            type="number"
            min="0"
            defaultValue={price.credit_cost}
            className={inputClass}
          />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={price.is_active}
          />
          Đang bật
        </label>
        <button className={buttonClass}>Lưu</button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Key: {price.feature_key}
      </p>
    </form>
  );
}

function PackageForm({
  pkg,
  index,
}: {
  pkg: AdminCreditPackageRecord | null;
  index: number;
}) {
  return (
    <form
      action={upsertCreditPackageAction}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
    >
      {pkg ? <input type="hidden" name="id" value={pkg.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_120px_120px_100px_100px_auto] xl:items-end">
        <FieldLabel label={pkg ? "Slug" : "Slug mới"}>
          <input name="slug" defaultValue={pkg?.slug ?? ""} className={inputClass} />
        </FieldLabel>
        <FieldLabel label="Tên">
          <input name="name" defaultValue={pkg?.name ?? ""} className={inputClass} />
        </FieldLabel>
        <FieldLabel label="Tín dụng">
          <input
            name="credits"
            type="number"
            min="1"
            defaultValue={pkg?.credits ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Giá">
          <input
            name="priceAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pkg?.price_amount ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Tiền tệ">
          <input name="currency" defaultValue={pkg?.currency ?? "VND"} className={inputClass} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={pkg?.is_active ?? true}
          />
          Đang bật
        </label>
        <button className={buttonClass}>{pkg ? "Lưu" : "Tạo"}</button>
      </div>
      <textarea
        name="description"
        defaultValue={pkg?.description ?? ""}
        placeholder={`Mô tả gói ${index + 1}`}
        rows={2}
        className={`${inputClass} mt-3`}
      />
    </form>
  );
}

function TemplatesSection({
  templates,
}: {
  templates: AdminPromptTemplateRecord[];
}) {
  return (
    <section>
      <SectionTitle icon={FileText} title="Template" />
      <div className="mt-5 space-y-4">
        {[...templates, null].map((template) => (
          <TemplateForm
            key={template?.id ?? "new-template"}
            template={template}
          />
        ))}
      </div>
    </section>
  );
}

function TemplateForm({
  template,
}: {
  template: AdminPromptTemplateRecord | null;
}) {
  return (
    <form
      action={upsertPromptTemplateAction}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
    >
      {template ? <input type="hidden" name="id" value={template.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_160px_100px_auto] xl:items-end">
        <FieldLabel label={template ? "Slug" : "Slug mới"}>
          <input
            name="slug"
            defaultValue={template?.slug ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Tên">
          <input
            name="name"
            defaultValue={template?.name ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Danh mục">
          <input
            name="category"
            defaultValue={template?.category ?? "general"}
            className={inputClass}
          />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={template?.is_active ?? true}
          />
          Đang bật
        </label>
        <button className={buttonClass}>{template ? "Lưu" : "Tạo"}</button>
      </div>
      <input
        name="description"
        defaultValue={template?.description ?? ""}
        placeholder="Mô tả"
        className={`${inputClass} mt-3`}
      />
      <textarea
        name="content"
        defaultValue={template?.content ?? ""}
        placeholder="Nội dung template"
        rows={5}
        className={`${inputClass} mt-3 font-mono`}
      />
    </form>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none";
const buttonClass =
  "rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]";
const successPillClass =
  "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300";
const warningPillClass =
  "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200";
