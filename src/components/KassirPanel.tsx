'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  PackageCheck,
  Search,
  UserCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatSum, formatTimeShort } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';

export function KassirPanel() {
  const {
    buyurtmalar,
    buyurtmaTarkibi,
    taomlar,
    vaqtOraliqlari,
    users,
    markOrderServed,
    markOrderUncollected,
  } = useApp();

  const [searchCode, setSearchCode] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const stats = useMemo(() => {
    const served = buyurtmalar.filter((b) => b.holat === 'berildi');
    const pending = buyurtmalar.filter((b) => b.holat === 'kutilmoqda');
    const uncollected = buyurtmalar.filter((b) => b.holat === 'olib_ketilmadi');

    const totalRevenue = served.reduce((sum, b) => sum + b.jami_summa, 0);
    const uncollectedLoss = uncollected.reduce(
      (sum, b) => sum + b.jami_summa,
      0
    );

    return {
      totalRevenue,
      servedCount: served.length,
      pendingCount: pending.length,
      uncollectedCount: uncollected.length,
      uncollectedLoss,
    };
  }, [buyurtmalar]);

  const normalizedQuery = searchCode.replace(/\D/g, '').trim();

  const foundOrder = useMemo(() => {
    if (!normalizedQuery) return null;
    return buyurtmalar.find((b) => b.kod === normalizedQuery) ?? null;
  }, [buyurtmalar, normalizedQuery]);

  const handleServe = (orderId: string) => {
    const res = markOrderServed(orderId);
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleUncollected = (orderId: string) => {
    const res = markOrderUncollected(orderId);
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  const pendingCodes = buyurtmalar
    .filter((b) => b.holat === 'kutilmoqda')
    .map((b) => b.kod);

  return (
    <div className="space-y-6">
      {/* Daily Sales & Uncollected Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Kunlik tushum</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {formatSum(stats.totalRevenue)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Faqat berilgan buyurtmalar
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Berilgan buyurtmalar</span>
            <PackageCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {stats.servedCount} ta
          </div>
          <div className="mt-1 text-xs text-slate-400">
            To&apos;lovi qabul qilingan
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Kutilayotgan</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">
            {stats.pendingCount} ta
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Olib ketish navbatida
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Olib ketilmaganlar</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-600">
            {stats.uncollectedCount} ta
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Yo&apos;qotilgan summa: {formatSum(stats.uncollectedLoss)}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {feedback.text}
          </span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Search by 6-digit Code */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h2 className="font-bold text-slate-900">
          Buyurtma kodini tekshirish
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Talaba ko&apos;rsatgan 6 xonali kodni kiriting
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              maxLength={6}
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Masalan: 482910"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 font-mono text-base font-bold tracking-widest outline-none focus:border-amber-500"
            />
          </div>
          {searchCode && (
            <button
              onClick={() => setSearchCode('')}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Tozalash
            </button>
          )}
        </div>

        {pendingCodes.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Kutilayotgan kodlar:</span>
            {pendingCodes.map((code) => (
              <button
                key={code}
                onClick={() => setSearchCode(code)}
                className="rounded-lg bg-amber-50 px-2.5 py-1 font-mono font-bold text-amber-800 hover:bg-amber-100"
              >
                {code}
              </button>
            ))}
          </div>
        )}

        {/* Found Order Result */}
        {normalizedQuery.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            {foundOrder ? (
              (() => {
                const items = buyurtmaTarkibi.filter(
                  (i) => i.buyurtma_id === foundOrder.id
                );
                const slot = vaqtOraliqlari.find(
                  (v) => v.id === foundOrder.vaqt_oraligi_id
                );
                const student = users.find(
                  (u) => u.id === foundOrder.talaba_id
                );

                return (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-lg bg-white px-3 py-1 font-mono text-lg font-extrabold text-slate-900 shadow-2xs">
                          #{foundOrder.kod}
                        </span>
                        <StatusBadge status={foundOrder.holat} />
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                          <UserCheck className="h-3.5 w-3.5" />
                          {student?.ism ?? 'Talaba'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          {slot?.oraliq_nomi ?? '—'}
                        </span>
                      </div>

                      <div className="text-lg font-extrabold text-emerald-700">
                        {formatSum(foundOrder.jami_summa)}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm">
                      {items.map((item) => {
                        const taom = taomlar.find((t) => t.id === item.taom_id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-slate-700"
                          >
                            <span>
                              {taom?.nomi ?? 'Taom'} × {item.soni}
                            </span>
                            <span className="font-semibold">
                              {formatSum((taom?.narx ?? 0) * item.soni)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      {foundOrder.holat === 'kutilmoqda' ? (
                        <>
                          <button
                            onClick={() => handleServe(foundOrder.id)}
                            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700"
                          >
                            To&apos;lov qabul qilindi va berildi
                          </button>
                          <button
                            onClick={() => handleUncollected(foundOrder.id)}
                            className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Olib ketilmadi
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-600">
                          {foundOrder.holat === 'berildi'
                            ? 'Ushbu buyurtma allaqachon berilgan — kod qayta ishlatilmaydi.'
                            : `Buyurtma holati: ${foundOrder.holat}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                <span className="font-mono font-bold text-slate-700">
                  {normalizedQuery}
                </span>{' '}
                kodli buyurtma topilmadi.
              </div>
            )}
          </div>
        )}
      </section>

      {/* All Orders Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h2 className="font-bold text-slate-900">Barcha buyurtmalar</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4">Kod</th>
                <th className="px-3 py-2.5">Vaqt oralig&apos;i</th>
                <th className="px-3 py-2.5">Yaratilgan</th>
                <th className="px-3 py-2.5">Summa</th>
                <th className="px-3 py-2.5">Holat</th>
                <th className="pl-3 py-2.5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buyurtmalar.map((order) => {
                const slot = vaqtOraliqlari.find(
                  (v) => v.id === order.vaqt_oraligi_id
                );
                return (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900">
                      #{order.kod}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {slot?.oraliq_nomi ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {formatTimeShort(order.yaratilgan_vaqt)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {formatSum(order.jami_summa)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.holat} />
                    </td>
                    <td className="pl-3 py-3 text-right">
                      {order.holat === 'kutilmoqda' ? (
                        <button
                          onClick={() => handleServe(order.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Berildi
                        </button>
                      ) : (
                        <button
                          onClick={() => setSearchCode(order.kod)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Ko&apos;rish
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
