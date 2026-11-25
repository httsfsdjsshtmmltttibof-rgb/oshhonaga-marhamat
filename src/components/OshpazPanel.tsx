'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Clock,
  PlusCircle,
  Save,
  Utensils,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatSum } from '@/lib/utils';

export function OshpazPanel() {
  const {
    taomlar,
    kunlikMenyu,
    vaqtOraliqlari,
    buyurtmalar,
    buyurtmaTarkibi,
    addDishToMenu,
    updateMenuPortions,
  } = useApp();

  const [nomi, setNomi] = useState('');
  const [tavsif, setTavsif] = useState('');
  const [narx, setNarx] = useState('');
  const [jamiPorsiya, setJamiPorsiya] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [portionDrafts, setPortionDrafts] = useState<
    Record<string, { jami: number; qolgan: number }>
  >({});

  // Matrix: dishId -> slotId -> pending portion count
  const prepMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    for (const menu of kunlikMenyu) {
      matrix[menu.taom_id] = {};
      for (const slot of vaqtOraliqlari) {
        matrix[menu.taom_id][slot.id] = 0;
      }
    }

    const pendingOrders = buyurtmalar.filter((b) => b.holat === 'kutilmoqda');
    for (const order of pendingOrders) {
      const items = buyurtmaTarkibi.filter((i) => i.buyurtma_id === order.id);
      for (const item of items) {
        if (!matrix[item.taom_id]) {
          matrix[item.taom_id] = {};
        }
        matrix[item.taom_id][order.vaqt_oraligi_id] =
          (matrix[item.taom_id][order.vaqt_oraligi_id] ?? 0) + item.soni;
      }
    }
    return matrix;
  }, [buyurtmaTarkibi, buyurtmalar, kunlikMenyu, vaqtOraliqlari]);

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addDishToMenu({
      nomi,
      tavsif,
      narx: Number(narx),
      jami_porsiya: Number(jamiPorsiya),
    });
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
    if (res.ok) {
      setNomi('');
      setTavsif('');
      setNarx('');
      setJamiPorsiya('');
    }
  };

  const handleSavePortion = (menuId: string, jami: number, qolgan: number) => {
    const res = updateMenuPortions(menuId, jami, qolgan);
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="space-y-6">
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

      {/* Time-Slot Prep Summary Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="font-bold text-slate-900">
                Vaqt oraliqlari bo&apos;yicha tayyorlash jadvali
              </h2>
              <p className="text-xs text-slate-500">
                &ldquo;Kutilmoqda&rdquo; holatidagi buyurtmalar asosida qaysi vaqtga nechta porsiya kerakligi
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4">Taom nomi</th>
                {vaqtOraliqlari.map((slot) => (
                  <th key={slot.id} className="px-3 py-2.5 text-center">
                    {slot.oraliq_nomi}
                  </th>
                ))}
                <th className="pl-4 py-2.5 text-right">Jami kerak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kunlikMenyu.map((menu) => {
                const taom = taomlar.find((t) => t.id === menu.taom_id);
                if (!taom) return null;
                const row = prepMatrix[taom.id] ?? {};
                const rowTotal = vaqtOraliqlari.reduce(
                  (sum, slot) => sum + (row[slot.id] ?? 0),
                  0
                );

                return (
                  <tr key={menu.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {taom.nomi}
                    </td>
                    {vaqtOraliqlari.map((slot) => {
                      const count = row[slot.id] ?? 0;
                      return (
                        <td key={slot.id} className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex min-w-8 items-center justify-center rounded-lg px-2 py-1 text-xs font-bold ${
                              count > 0
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </td>
                      );
                    })}
                    <td className="pl-4 py-3 text-right font-bold text-emerald-700">
                      {rowTotal} ta
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add New Dish Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PlusCircle className="h-5 w-5 text-amber-600" />
            <h2 className="font-bold text-slate-900">Yangi taom qo&apos;shish</h2>
          </div>

          <form onSubmit={handleAddDish} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Taom nomi *
              </label>
              <input
                type="text"
                required
                value={nomi}
                onChange={(e) => setNomi(e.target.value)}
                placeholder="Masalan: Mastava"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Qisqacha tavsif
              </label>
              <textarea
                rows={2}
                value={tavsif}
                onChange={(e) => setTavsif(e.target.value)}
                placeholder="Tarkibi va ta'mi haqida..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Narxi (so&apos;m) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={narx}
                  onChange={(e) => setNarx(e.target.value)}
                  placeholder="22000"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Porsiya soni *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={jamiPorsiya}
                  onChange={(e) => setJamiPorsiya(e.target.value)}
                  placeholder="30"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ChefHat className="h-4 w-4" />
              <span>Menyuga qo&apos;shish</span>
            </button>
          </form>
        </section>

        {/* Edit Existing Menu Portions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Utensils className="h-5 w-5 text-amber-600" />
            <h2 className="font-bold text-slate-900">
              Kunlik menyu va porsiyalarni boshqarish
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {kunlikMenyu.map((menu) => {
              const taom = taomlar.find((t) => t.id === menu.taom_id);
              if (!taom) return null;

              const draft = portionDrafts[menu.id] ?? {
                jami: menu.jami_porsiya,
                qolgan: menu.qolgan_porsiya,
              };

              return (
                <div
                  key={menu.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={taom.rasm_url}
                      alt={taom.nomi}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        {taom.nomi}
                      </div>
                      <div className="text-xs font-medium text-emerald-700">
                        {formatSum(taom.narx)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500">
                        Jami
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={draft.jami}
                        onChange={(e) => {
                          const nextJami = Math.max(0, Number(e.target.value));
                          setPortionDrafts((prev) => ({
                            ...prev,
                            [menu.id]: {
                              jami: nextJami,
                              qolgan: Math.min(draft.qolgan, nextJami),
                            },
                          }));
                        }}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-500">
                        Qolgan
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={draft.jami}
                        value={draft.qolgan}
                        onChange={(e) => {
                          const nextQolgan = Math.max(
                            0,
                            Number(e.target.value)
                          );
                          setPortionDrafts((prev) => ({
                            ...prev,
                            [menu.id]: {
                              jami: draft.jami,
                              qolgan: nextQolgan,
                            },
                          }));
                        }}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={() =>
                        handleSavePortion(menu.id, draft.jami, draft.qolgan)
                      }
                      className="mt-4 inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Saqlash</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
