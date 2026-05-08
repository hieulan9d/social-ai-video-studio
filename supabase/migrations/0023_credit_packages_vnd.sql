alter table public.credit_packages
  alter column currency set default 'VND';

update public.credit_packages
set
  price_amount = round(price_amount * 26000),
  currency = 'VND'
where currency = 'USD';
