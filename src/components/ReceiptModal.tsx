'use client';

import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, X } from 'lucide-react';
import { Buyurtma } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatSum, formatTimeShort } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';

interface ReceiptModalProps {
  order: Buyurtma | null;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const { buyurtmaTarkibi, taomlar, vaqtOraliqlari } = useApp();

  if (!order) return null;

  const items = buyurtmaTarkibi.filter((i) => i.buyurtma_id === order.id);
  const slot = vaqtOraliqlari.find((v) => v.id === order.vaqt_oraligi_id);

  const qrPayload = JSON.stringify({
    app: 'Oshga marhamat',
    kod: order.kod,
    vaqt: slot?.oraliq_nomi ?? '',
    summa: order.jami_summa,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Buyurtma cheki
          </h3>
          <p className="text-xs text-slate-500">
            Kassada ushbu 6 xonali kod yoki QR-kodni ko&apos;rsating
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Buyurtma kodi
            </div>
            <div className="mt-0.5 font-mono text-3xl font-extrabold tracking-[0.2em] text-slate-900">
              {order.kod}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <QRCodeSVG value={qrPayload} size={148} level="M" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              {slot?.oraliq_nomi ?? '—'}
            </span>
            <StatusBadge status={order.holat} />
            <span className="text-slate-400">
              {formatTimeShort(order.yaratilgan_vaqt)}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="space-y-2 text-sm">
            {items.map((item) => {
              const taom = taomlar.find((t) => t.id === item.taom_id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-slate-700"
                >
                  <span>
                    {taom?.nomi ?? 'Taom'}{' '}
                    <span className="text-slate-400">× {item.soni}</span>
                  </span>
                  <span className="font-medium">
                    {formatSum((taom?.narx ?? 0) * item.soni)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
            <span>Jami summa</span>
            <span className="text-emerald-700">
              {formatSum(order.jami_summa)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Yopish
        </button>
      </div>
    </div>
  );
}
