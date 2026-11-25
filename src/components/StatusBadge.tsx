import { OrderStatus } from '@/types';

const STATUS_STYLES: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  kutilmoqda: {
    label: 'Kutilmoqda',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  berildi: {
    label: 'Berildi',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  bekor_qilindi: {
    label: 'Bekor qilindi',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  olib_ketilmadi: {
    label: 'Olib ketilmadi',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
