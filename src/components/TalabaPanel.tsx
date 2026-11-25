'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp, TimeSimulationMode } from '@/context/AppContext';
import { Buyurtma } from '@/types';
import {
  checkCancelEligibility,
  formatSum,
  formatTimeShort,
} from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { ReceiptModal } from './ReceiptModal';

export function TalabaPanel() {
  const {
    taomlar,
    kunlikMenyu,
    vaqtOraliqlari,
    buyurtmalar,
    buyurtmaTarkibi,
    cart,
    currentUser,
    timeSimMode,
    setTimeSimMode,
    getEffectiveNow,
    addToCart,
    updateCartQty,
    removeFromCart,
    placeOrder,
    cancelOrder,
    rateOrderItem,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'menyu' | 'buyurtmalar'>('menyu');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Buyurtma | null>(null);

  // Local draft state for rating items
  const [ratingDrafts, setRatingDrafts] = useState<
    Record<string, { baho: number; izoh: string }>
  >({});

  const myOrders = useMemo(
    () => buyurtmalar.filter((b) => b.talaba_id === currentUser.id),
    [buyurtmalar, currentUser.id]
  );

  const pendingCount = useMemo(
    () => myOrders.filter((o) => o.holat === 'kutilmoqda').length,
    [myOrders]
  );

  // Average rating per dish across all rated items
  const dishRatings = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    for (const item of buyurtmaTarkibi) {
      if (typeof item.baho === 'number' && item.baho > 0) {
        if (!map[item.taom_id]) map[item.taom_id] = { sum: 0, count: 0 };
        map[item.taom_id].sum += item.baho;
        map[item.taom_id].count += 1;
      }
    }
    return map;
  }, [buyurtmaTarkibi]);

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => {
        const taom = taomlar.find((t) => t.id === item.taom_id);
        const menu = kunlikMenyu.find((m) => m.taom_id === item.taom_id);
        return {
          ...item,
          taom,
          qolgan: menu?.qolgan_porsiya ?? 0,
        };
      })
      .filter((x) => x.taom !== undefined);
  }, [cart, kunlikMenyu, taomlar]);

  const cartTotal = useMemo(
    () =>
      cartDetails.reduce(
        (acc, item) => acc + (item.taom?.narx ?? 0) * item.soni,
        0
      ),
    [cartDetails]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.soni, 0),
    [cart]
  );

  const handleAdd = (taomId: string) => {
    const res = addToCart(taomId);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message });
    } else {
      setFeedback(null);
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedSlotId) {
      setFeedback({
        type: 'error',
        text: "Iltimos, olib ketish vaqt oralig'ini tanlang.",
      });
      return;
    }
    const res = placeOrder(selectedSlotId);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message });
      return;
    }
    setFeedback({ type: 'success', text: res.message });
    setSelectedSlotId('');
    if (res.buyurtma) {
      setReceiptOrder(res.buyurtma);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const res = cancelOrder(orderId);
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSaveRating = (itemId: string) => {
    const draft = ratingDrafts[itemId];
    if (!draft || draft.baho < 1) {
      setFeedback({
        type: 'error',
        text: 'Iltimos, 1 dan 5 gacha yulduzcha tanlang.',
      });
      return;
    }
    const res = rateOrderItem(itemId, draft.baho, draft.izoh ?? '');
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  const effectiveNow = getEffectiveNow();

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('menyu')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'menyu'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kunlik menyu
          </button>
          <button
            onClick={() => setActiveTab('buyurtmalar')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'buyurtmalar'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mening buyurtmalarim</span>
            {pendingCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === 'buyurtmalar'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Oldindan buyurtma • Navbatsiz tushlik
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline opacity-75 hover:opacity-100"
          >
            Yopish
          </button>
        </div>
      )}

      {activeTab === 'menyu' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Menu Grid */}
          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {kunlikMenyu.map((menu) => {
                const taom = taomlar.find((t) => t.id === menu.taom_id);
                if (!taom) return null;

                const isSoldOut = menu.qolgan_porsiya === 0;
                const inCart =
                  cart.find((c) => c.taom_id === taom.id)?.soni ?? 0;
                const ratingInfo = dishRatings[taom.id];
                const avgRating = ratingInfo
                  ? (ratingInfo.sum / ratingInfo.count).toFixed(1)
                  : null;

                return (
                  <div
                    key={menu.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border bg-white transition ${
                      isSoldOut
                        ? 'border-slate-200 opacity-75'
                        : 'border-slate-200 hover:border-amber-300 hover:shadow-md'
                    }`}
                  >
                    <div className="relative h-40 w-full bg-amber-50/60">
                      <Image
                        src={taom.rasm_url}
                        alt={taom.nomi}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute right-3 top-3">
                        {isSoldOut ? (
                          <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                            Tugagan
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-xs">
                            {menu.qolgan_porsiya} ta qoldi
                          </span>
                        )}
                      </div>
                      {avgRating && (
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-slate-800 shadow-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{avgRating}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900">
                            {taom.nomi}
                          </h3>
                          <span className="shrink-0 font-bold text-emerald-700">
                            {formatSum(taom.narx)}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {taom.tavsif}
                        </p>
                      </div>

                      <div className="mt-4">
                        {isSoldOut ? (
                          <button
                            disabled
                            className="w-full cursor-not-allowed rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-400"
                          >
                            Tugagan
                          </button>
                        ) : inCart > 0 ? (
                          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-2 py-1.5">
                            <button
                              onClick={() => updateCartQty(taom.id, -1)}
                              aria-label="Kamaytirish"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-bold text-slate-900">
                              {inCart} dona savatchada
                            </span>
                            <button
                              onClick={() => handleAdd(taom.id)}
                              disabled={inCart >= menu.qolgan_porsiya}
                              aria-label="Ko'paytirish"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdd(taom.id)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Savatchaga qo&apos;shish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart & Time Slot Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-600" />
                  <h2 className="font-bold text-slate-900">Savatcha</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {cartItemCount} ta
                </span>
              </div>

              {cartDetails.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Savatchangiz bo&apos;sh. Menyudan taom tanlang.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {cartDetails.map((item) => (
                    <div
                      key={item.taom_id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {item.taom?.nomi}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatSum(item.taom?.narx ?? 0)} × {item.soni}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartQty(item.taom_id, -1)}
                          className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">
                          {item.soni}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.taom_id, 1)}
                          disabled={item.soni >= item.qolgan}
                          className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.taom_id)}
                          aria-label="O'chirish"
                          className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Time Slot Selection */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Olib ketish vaqti
                </label>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {vaqtOraliqlari.map((slot) => {
                    const isFull =
                      slot.joriy_buyurtmalar >= slot.max_buyurtma_soni;
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                          isFull
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {slot.oraliq_nomi}
                        </span>
                        <span className="mt-0.5 text-[11px]">
                          {isFull
                            ? "To'lgan"
                            : `${slot.joriy_buyurtmalar}/${slot.max_buyurtma_soni} band`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Jami:</span>
                  <span className="text-emerald-700">
                    {formatSum(cartTotal)}
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={cartDetails.length === 0}
                  className="mt-3 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Buyurtma berish
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* My Orders Tab */
        <div className="space-y-4">
          {/* Time Simulation Bar for testing the 1-hour cancellation rule */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">
                Bekor qilish qoidasi:
              </span>{' '}
              Olib ketish vaqtidan kamida 1 soat oldin bekor qilish mumkin.
              <span className="ml-1 text-slate-400">
                (Joriy tekshiruv vaqti:{' '}
                {effectiveNow.toLocaleTimeString('uz-UZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'real', label: 'Real vaqt' },
                  { id: '10:30', label: '10:30 (1+ soat oldin)' },
                  { id: '11:30', label: '11:30 (<1 soat)' },
                ] as { id: TimeSimulationMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTimeSimMode(opt.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    timeSimMode === opt.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Sizda hali buyurtmalar mavjud emas.
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const slot = vaqtOraliqlari.find(
                  (v) => v.id === order.vaqt_oraligi_id
                );
                const items = buyurtmaTarkibi.filter(
                  (i) => i.buyurtma_id === order.id
                );
                const cancelCheck = slot
                  ? checkCancelEligibility(slot.oraliq_nomi, effectiveNow)
                  : { allowed: false, message: '' };

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-base font-extrabold tracking-wider text-slate-900">
                          #{order.kod}
                        </span>
                        <StatusBadge status={order.holat} />
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          {slot?.oraliq_nomi ?? '—'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTimeShort(order.yaratilgan_vaqt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>QR Chek</span>
                        </button>

                        {order.holat === 'kutilmoqda' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            title={cancelCheck.message}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              cancelCheck.allowed
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Bekor qilish</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {items.map((item) => {
                        const taom = taomlar.find((t) => t.id === item.taom_id);
                        const draft = ratingDrafts[item.id] ?? {
                          baho: item.baho ?? 0,
                          izoh: item.izoh ?? '',
                        };

                        return (
                          <div
                            key={item.id}
                            className="rounded-xl bg-slate-50 p-3"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-slate-900">
                                {taom?.nomi ?? 'Taom'}{' '}
                                <span className="text-slate-400">
                                  × {item.soni}
                                </span>
                              </span>
                              <span className="font-semibold text-slate-700">
                                {formatSum((taom?.narx ?? 0) * item.soni)}
                              </span>
                            </div>

                            {order.holat === 'berildi' && (
                              <div className="mt-2.5 border-t border-slate-200/70 pt-2.5">
                                {item.baho ? (
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= (item.baho ?? 0)
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-slate-300'
                                          }`}
                                        />
                                      ))}
                                      <span className="ml-1 font-semibold text-slate-700">
                                        {item.baho}/5
                                      </span>
                                    </div>
                                    {item.izoh && (
                                      <span className="italic text-slate-600">
                                        &ldquo;{item.izoh}&rdquo;
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() =>
                                            setRatingDrafts((prev) => ({
                                              ...prev,
                                              [item.id]: {
                                                baho: star,
                                                izoh: draft.izoh,
                                              },
                                            }))
                                          }
                                          className="p-0.5"
                                        >
                                          <Star
                                            className={`h-4 w-4 transition ${
                                              star <= draft.baho
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-slate-300 hover:text-amber-300'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Taom haqida izoh qoldiring..."
                                      value={draft.izoh}
                                      onChange={(e) =>
                                        setRatingDrafts((prev) => ({
                                          ...prev,
                                          [item.id]: {
                                            baho: draft.baho,
                                            izoh: e.target.value,
                                          },
                                        }))
                                      }
                                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRating(item.id)}
                                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                                    >
                                      Saqlash
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1 text-sm font-bold text-slate-900">
                      <span>Jami summa</span>
                      <span className="text-emerald-700">
                        {formatSum(order.jami_summa)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}
