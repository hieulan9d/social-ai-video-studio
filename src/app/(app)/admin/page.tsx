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
  "failed",
  "refunded",
  "cancelled",
];

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Operations
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Admin dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
          Manage users, wallet credits, payments, failed render operations,
          templates, and credit package pricing from server-side admin actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Users" value={data.metrics.users} icon={Users} />
        <MetricCard
          label="Active users"
          value={data.metrics.activeUsers}
          icon={ShieldCheck}
        />
        <MetricCard
          label="Payments"
          value={data.metrics.payments}
          icon={CreditCard}
        />
        <MetricCard
          label="Failed jobs"
          value={data.metrics.failedJobs}
          icon={Video}
        />
        <MetricCard
          label="Wallet credits"
          value={data.metrics.walletCredits}
          icon={WalletCards}
        />
        <MetricCard
          label="Page views"
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
      <SectionTitle icon={Users} title="Users" />
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
                  {user.full_name || user.workspace_name || "No profile name"} /{" "}
                  {user.wallets[0]?.balance_credit ?? 0} credits
                </p>
              </div>
              <FieldLabel label="Role">
                <select name="role" defaultValue={user.role} className={inputClass}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Status">
                <select
                  name="accountStatus"
                  defaultValue={user.account_status}
                  className={inputClass}
                >
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Admin notes">
                <input
                  name="adminNotes"
                  defaultValue={user.admin_notes ?? ""}
                  className={inputClass}
                />
              </FieldLabel>
              <button className={buttonClass}>Save</button>
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
                {event.path ?? "No path"}
              </p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {event.profiles?.email ?? "Anonymous"}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--muted-foreground)]">
            No analytics events yet.
          </div>
        )}
      </div>
    </section>
  );
}

function WalletsSection({ wallets }: { wallets: AdminWalletRecord[] }) {
  return (
    <section>
      <SectionTitle icon={WalletCards} title="Wallets and manual refunds" />
      <form
        action={manualRefundCreditsAction}
        className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_160px_1.2fr_1fr_auto] lg:items-end">
          <FieldLabel label="User">
            <select name="userId" className={inputClass}>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.user_id}>
                  {wallet.profiles?.email ?? wallet.user_id} /{" "}
                  {wallet.balance_credit} credits
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Credits">
            <input name="amount" type="number" min="1" className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Reason">
            <input name="reason" className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Reference ID">
            <input name="referenceId" className={inputClass} />
          </FieldLabel>
          <button className={buttonClass}>Refund</button>
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
              Balance: {wallet.balance_credit} credits
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
      <SectionTitle icon={CreditCard} title="Payments" />
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
                  {payment.credits_purchased} credits
                </p>
                <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                  {payment.profiles?.email ?? payment.user_id} / {payment.provider} /{" "}
                  {payment.provider_payment_id ?? payment.id}
                </p>
              </div>
              <FieldLabel label="Status">
                <select name="status" defaultValue={payment.status} className={inputClass}>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Failure reason">
                <input
                  name="failureReason"
                  defaultValue={payment.failure_reason ?? ""}
                  className={inputClass}
                />
              </FieldLabel>
              <button className={buttonClass}>Update</button>
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
      <SectionTitle icon={RefreshCcw} title="Failed renders and exports" />
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-medium">Render jobs</h3>
          {failedRenders.map((job) => (
            <FailedJobCard
              key={job.id}
              jobId={job.id}
              title={`${job.render_mode} / ${job.provider ?? "unknown"}`}
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
          <h3 className="font-medium">Export jobs</h3>
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
              {reviewed ? "reviewed" : "needs review"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
          <p className="mt-3 text-sm text-rose-300">
            {error ?? "No error message stored."}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input name="note" placeholder="Review note" className={inputClass} />
          <button className={buttonClass}>Mark reviewed</button>
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
      <SectionTitle icon={BadgeDollarSign} title="Pricing" />
      <div className="mt-5">
        <h3 className="font-medium">Feature credit costs</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Runtime feature costs are read from the database. These values control
          deductions for generation, rendering, and export flows.
        </p>
        <div className="mt-4 space-y-4">
          {featurePrices.map((price) => (
            <FeaturePriceForm key={price.id} price={price} />
          ))}
        </div>
      </div>
      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <h3 className="font-medium">Credit packages</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Purchase packages define how many credits users receive for each top-up.
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
        <FieldLabel label="Feature">
          <input name="name" defaultValue={price.name} className={inputClass} />
        </FieldLabel>
        <FieldLabel label="Description">
          <input
            name="description"
            defaultValue={price.description ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Credit cost">
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
          Active
        </label>
        <button className={buttonClass}>Save</button>
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
        <FieldLabel label={pkg ? "Slug" : "New slug"}>
          <input name="slug" defaultValue={pkg?.slug ?? ""} className={inputClass} />
        </FieldLabel>
        <FieldLabel label="Name">
          <input name="name" defaultValue={pkg?.name ?? ""} className={inputClass} />
        </FieldLabel>
        <FieldLabel label="Credits">
          <input
            name="credits"
            type="number"
            min="1"
            defaultValue={pkg?.credits ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Price">
          <input
            name="priceAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pkg?.price_amount ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Currency">
          <input name="currency" defaultValue={pkg?.currency ?? "USD"} className={inputClass} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={pkg?.is_active ?? true}
          />
          Active
        </label>
        <button className={buttonClass}>{pkg ? "Save" : "Create"}</button>
      </div>
      <textarea
        name="description"
        defaultValue={pkg?.description ?? ""}
        placeholder={`Package description ${index + 1}`}
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
      <SectionTitle icon={FileText} title="Templates" />
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
        <FieldLabel label={template ? "Slug" : "New slug"}>
          <input
            name="slug"
            defaultValue={template?.slug ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Name">
          <input
            name="name"
            defaultValue={template?.name ?? ""}
            className={inputClass}
          />
        </FieldLabel>
        <FieldLabel label="Category">
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
          Active
        </label>
        <button className={buttonClass}>{template ? "Save" : "Create"}</button>
      </div>
      <input
        name="description"
        defaultValue={template?.description ?? ""}
        placeholder="Description"
        className={`${inputClass} mt-3`}
      />
      <textarea
        name="content"
        defaultValue={template?.content ?? ""}
        placeholder="Template content"
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
