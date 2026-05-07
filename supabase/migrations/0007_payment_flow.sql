alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add column if not exists checkout_url text,
  add column if not exists return_url text,
  add column if not exists provider_session_id text,
  add column if not exists failure_reason text,
  add column if not exists paid_at timestamptz,
  add column if not exists credited_at timestamptz,
  add column if not exists webhook_event_id text;

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'));

create unique index if not exists payments_provider_provider_payment_id_idx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists payments_provider_webhook_event_id_idx
  on public.payments (provider, webhook_event_id)
  where webhook_event_id is not null;

create unique index if not exists credit_transactions_payment_reference_idx
  on public.credit_transactions (reference_type, reference_id)
  where reference_type = 'payment';

create or replace function public.complete_payment_success(
  p_payment_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_provider_session_id text default null,
  p_webhook_event_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row public.payments;
  payment_reference_id text;
  already_credited boolean;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Only service role can complete payments';
  end if;

  select *
  into payment_row
  from public.payments
  where id = p_payment_id
  for update;

  if payment_row.id is null then
    raise exception 'Payment not found';
  end if;

  if payment_row.provider <> p_provider then
    raise exception 'Payment provider mismatch';
  end if;

  if payment_row.provider_payment_id is not null
     and payment_row.provider_payment_id <> p_provider_payment_id then
    raise exception 'Provider payment id mismatch';
  end if;

  if payment_row.webhook_event_id is not null
     and p_webhook_event_id is not null
     and payment_row.webhook_event_id = p_webhook_event_id then
    return payment_row;
  end if;

  payment_reference_id := payment_row.id::text;

  select exists(
    select 1
    from public.credit_transactions
    where reference_type = 'payment'
      and reference_id = payment_reference_id
  )
  into already_credited;

  update public.payments
  set
    status = 'success',
    provider_payment_id = coalesce(public.payments.provider_payment_id, p_provider_payment_id),
    provider_session_id = coalesce(p_provider_session_id, public.payments.provider_session_id),
    webhook_event_id = coalesce(p_webhook_event_id, public.payments.webhook_event_id),
    metadata = public.payments.metadata || coalesce(p_metadata, '{}'::jsonb),
    paid_at = coalesce(public.payments.paid_at, timezone('utc'::text, now())),
    credited_at = case
      when already_credited then coalesce(public.payments.credited_at, timezone('utc'::text, now()))
      else public.payments.credited_at
    end,
    failure_reason = null
  where id = p_payment_id
  returning *
  into payment_row;

  if not already_credited then
    perform public.add_credits(
      payment_row.user_id,
      payment_row.credits_purchased,
      'Payment top-up',
      'payment',
      payment_reference_id,
      jsonb_build_object(
        'payment_id', payment_reference_id,
        'provider', p_provider,
        'provider_payment_id', p_provider_payment_id
      ) || coalesce(p_metadata, '{}'::jsonb)
    );

    update public.payments
    set credited_at = coalesce(credited_at, timezone('utc'::text, now()))
    where id = p_payment_id
    returning *
    into payment_row;
  end if;

  return payment_row;
end;
$$;

create or replace function public.mark_payment_failed(
  p_payment_id uuid,
  p_provider text,
  p_provider_payment_id text default null,
  p_webhook_event_id text default null,
  p_failure_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row public.payments;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Only service role can update payments';
  end if;

  update public.payments
  set
    status = case when status = 'success' then status else 'failed' end,
    provider_payment_id = coalesce(public.payments.provider_payment_id, p_provider_payment_id),
    webhook_event_id = coalesce(p_webhook_event_id, public.payments.webhook_event_id),
    metadata = public.payments.metadata || coalesce(p_metadata, '{}'::jsonb),
    failure_reason = coalesce(p_failure_reason, public.payments.failure_reason)
  where id = p_payment_id
    and provider = p_provider
  returning *
  into payment_row;

  if payment_row.id is null then
    raise exception 'Payment not found';
  end if;

  return payment_row;
end;
$$;
