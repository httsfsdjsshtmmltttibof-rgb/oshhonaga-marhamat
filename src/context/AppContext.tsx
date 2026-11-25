'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Buyurtma,
  BuyurtmaTarkibi,
  CartItem,
  Foydalanuvchi,
  KunlikMenyu,
  Taom,
  UserRole,
  VaqtOraligi,
} from '@/types';
import {
  createSeedBuyurtmalar,
  createSeedKunlikMenyu,
  SEED_BUYURTMA_TARKIBI,
  SEED_TAOMLAR,
  SEED_USERS,
  SEED_VAQT_ORALIQLARI,
} from '@/data/seed';
import {
  checkCancelEligibility,
  generateUniqueCode,
  getTodayISO,
} from '@/lib/utils';

const STORAGE_KEY = 'oshga_marhamat_state_v1';

export type TimeSimulationMode = 'real' | '10:30' | '11:30';

interface PersistedState {
  currentRole: UserRole;
  taomlar: Taom[];
  kunlikMenyu: KunlikMenyu[];
  vaqtOraliqlari: VaqtOraligi[];
  buyurtmalar: Buyurtma[];
  buyurtmaTarkibi: BuyurtmaTarkibi[];
}

interface ActionResult {
  ok: boolean;
  message: string;
  buyurtma?: Buyurtma;
}

interface AppContextValue {
  isHydrated: boolean;
  currentRole: UserRole;
  currentUser: Foydalanuvchi;
  users: Foydalanuvchi[];
  taomlar: Taom[];
  kunlikMenyu: KunlikMenyu[];
  vaqtOraliqlari: VaqtOraligi[];
  buyurtmalar: Buyurtma[];
  buyurtmaTarkibi: BuyurtmaTarkibi[];
  cart: CartItem[];
  timeSimMode: TimeSimulationMode;
  setTimeSimMode: (mode: TimeSimulationMode) => void;
  getEffectiveNow: () => Date;
  switchRole: (role: UserRole) => void;
  addToCart: (taomId: string) => ActionResult;
  updateCartQty: (taomId: string, delta: number) => void;
  removeFromCart: (taomId: string) => void;
  clearCart: () => void;
  placeOrder: (vaqtOraligiId: string) => ActionResult;
  cancelOrder: (buyurtmaId: string) => ActionResult;
  rateOrderItem: (itemId: string, baho: number, izoh: string) => ActionResult;
  addDishToMenu: (input: {
    nomi: string;
    tavsif: string;
    narx: number;
    jami_porsiya: number;
    rasm_url?: string;
  }) => ActionResult;
  updateMenuPortions: (
    menuId: string,
    jamiPorsiya: number,
    qolganPorsiya: number
  ) => ActionResult;
  markOrderServed: (buyurtmaId: string) => ActionResult;
  markOrderUncollected: (buyurtmaId: string) => ActionResult;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function buildEmptyState(): PersistedState {
  return {
    currentRole: 'talaba',
    taomlar: [],
    kunlikMenyu: [],
    vaqtOraliqlari: [],
    buyurtmalar: [],
    buyurtmaTarkibi: [],
  };
}

function buildInitialState(): PersistedState {
  return {
    currentRole: 'talaba',
    taomlar: SEED_TAOMLAR,
    kunlikMenyu: createSeedKunlikMenyu(),
    vaqtOraliqlari: SEED_VAQT_ORALIQLARI,
    buyurtmalar: createSeedBuyurtmalar(),
    buyurtmaTarkibi: SEED_BUYURTMA_TARKIBI,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(buildEmptyState);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [timeSimMode, setTimeSimMode] = useState<TimeSimulationMode>('real');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          if (
            parsed &&
            Array.isArray(parsed.taomlar) &&
            Array.isArray(parsed.kunlikMenyu) &&
            Array.isArray(parsed.vaqtOraliqlari) &&
            Array.isArray(parsed.buyurtmalar) &&
            Array.isArray(parsed.buyurtmaTarkibi)
          ) {
            setState({
              currentRole: parsed.currentRole ?? 'talaba',
              taomlar: parsed.taomlar,
              kunlikMenyu: parsed.kunlikMenyu,
              vaqtOraliqlari: parsed.vaqtOraliqlari,
              buyurtmalar: parsed.buyurtmalar,
              buyurtmaTarkibi: parsed.buyurtmaTarkibi,
            });
            setIsHydrated(true);
            return;
          }
        }
        setState(buildInitialState());
      } catch {
        setState(buildInitialState());
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state, isHydrated]);

  const currentUser = useMemo(() => {
    return (
      SEED_USERS.find((u) => u.rol === state.currentRole) ?? SEED_USERS[0]
    );
  }, [state.currentRole]);

  const getEffectiveNow = useCallback((): Date => {
    const real = new Date();
    if (timeSimMode === '10:30') {
      return new Date(
        real.getFullYear(),
        real.getMonth(),
        real.getDate(),
        10,
        30,
        0,
        0
      );
    }
    if (timeSimMode === '11:30') {
      return new Date(
        real.getFullYear(),
        real.getMonth(),
        real.getDate(),
        11,
        30,
        0,
        0
      );
    }
    return real;
  }, [timeSimMode]);

  const switchRole = useCallback((role: UserRole) => {
    setState((prev) => ({ ...prev, currentRole: role }));
  }, []);

  const addToCart = useCallback(
    (taomId: string): ActionResult => {
      const menu = state.kunlikMenyu.find((m) => m.taom_id === taomId);
      if (!menu || menu.qolgan_porsiya <= 0) {
        return { ok: false, message: 'Bu taom hozircha tugagan.' };
      }

      const existing = cart.find((c) => c.taom_id === taomId);
      const nextQty = (existing?.soni ?? 0) + 1;

      if (nextQty > menu.qolgan_porsiya) {
        return {
          ok: false,
          message: `Faqat ${menu.qolgan_porsiya} ta porsiya qolgan.`,
        };
      }

      setCart((prev) => {
        if (existing) {
          return prev.map((item) =>
            item.taom_id === taomId ? { ...item, soni: nextQty } : item
          );
        }
        return [...prev, { taom_id: taomId, soni: 1 }];
      });

      return { ok: true, message: "Savatchaga qo'shildi." };
    },
    [cart, state.kunlikMenyu]
  );

  const updateCartQty = useCallback(
    (taomId: string, delta: number) => {
      const menu = state.kunlikMenyu.find((m) => m.taom_id === taomId);
      const maxAvailable = menu?.qolgan_porsiya ?? 0;

      setCart((prev) =>
        prev
          .map((item) => {
            if (item.taom_id !== taomId) return item;
            const next = Math.min(maxAvailable, item.soni + delta);
            return { ...item, soni: next };
          })
          .filter((item) => item.soni > 0)
      );
    },
    [state.kunlikMenyu]
  );

  const removeFromCart = useCallback((taomId: string) => {
    setCart((prev) => prev.filter((item) => item.taom_id !== taomId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const placeOrder = useCallback(
    (vaqtOraligiId: string): ActionResult => {
      if (cart.length === 0) {
        return { ok: false, message: "Savatcha bo'sh." };
      }

      const slot = state.vaqtOraliqlari.find((v) => v.id === vaqtOraligiId);
      if (!slot) {
        return { ok: false, message: "Vaqt oralig'i topilmadi." };
      }

      if (slot.joriy_buyurtmalar >= slot.max_buyurtma_soni) {
        return {
          ok: false,
          message: "Tanlangan vaqt oralig'ida joylar to'lgan.",
        };
      }

      for (const item of cart) {
        const menu = state.kunlikMenyu.find((m) => m.taom_id === item.taom_id);
        const taom = state.taomlar.find((t) => t.id === item.taom_id);
        if (!menu || menu.qolgan_porsiya < item.soni) {
          return {
            ok: false,
            message: `"${taom?.nomi ?? 'Taom'}" uchun yetarli porsiya qolmagan.`,
          };
        }
      }

      const existingCodes = new Set(state.buyurtmalar.map((b) => b.kod));
      const kod = generateUniqueCode(existingCodes);
      const orderId = `order-${Date.now()}`;

      let jamiSumma = 0;
      const newItems: BuyurtmaTarkibi[] = cart.map((item, idx) => {
        const taom = state.taomlar.find((t) => t.id === item.taom_id);
        const price = taom?.narx ?? 0;
        jamiSumma += price * item.soni;
        return {
          id: `item-${Date.now()}-${idx}`,
          buyurtma_id: orderId,
          taom_id: item.taom_id,
          soni: item.soni,
        };
      });

      const newOrder: Buyurtma = {
        id: orderId,
        kod,
        talaba_id: currentUser.id,
        vaqt_oraligi_id: vaqtOraligiId,
        holat: 'kutilmoqda',
        jami_summa: jamiSumma,
        yaratilgan_vaqt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        kunlikMenyu: prev.kunlikMenyu.map((m) => {
          const ordered = cart.find((c) => c.taom_id === m.taom_id);
          if (!ordered) return m;
          return {
            ...m,
            qolgan_porsiya: Math.max(0, m.qolgan_porsiya - ordered.soni),
          };
        }),
        vaqtOraliqlari: prev.vaqtOraliqlari.map((v) =>
          v.id === vaqtOraligiId
            ? { ...v, joriy_buyurtmalar: v.joriy_buyurtmalar + 1 }
            : v
        ),
        buyurtmalar: [newOrder, ...prev.buyurtmalar],
        buyurtmaTarkibi: [...prev.buyurtmaTarkibi, ...newItems],
      }));

      setCart([]);
      return {
        ok: true,
        message: `Buyurtma #${kod} muvaffaqiyatli yaratildi!`,
        buyurtma: newOrder,
      };
    },
    [
      cart,
      currentUser.id,
      state.buyurtmalar,
      state.kunlikMenyu,
      state.taomlar,
      state.vaqtOraliqlari,
    ]
  );

  const cancelOrder = useCallback(
    (buyurtmaId: string): ActionResult => {
      const order = state.buyurtmalar.find((b) => b.id === buyurtmaId);
      if (!order) {
        return { ok: false, message: 'Buyurtma topilmadi.' };
      }
      if (order.holat !== 'kutilmoqda') {
        return {
          ok: false,
          message: 'Faqat kutilayotgan buyurtmani bekor qilish mumkin.',
        };
      }

      const slot = state.vaqtOraliqlari.find(
        (v) => v.id === order.vaqt_oraligi_id
      );
      if (!slot) {
        return { ok: false, message: "Vaqt oralig'i topilmadi." };
      }

      const eligibility = checkCancelEligibility(
        slot.oraliq_nomi,
        getEffectiveNow()
      );
      if (!eligibility.allowed) {
        return {
          ok: false,
          message: "Bekor qilish vaqti o'tgan",
        };
      }

      const orderItems = state.buyurtmaTarkibi.filter(
        (i) => i.buyurtma_id === buyurtmaId
      );

      setState((prev) => ({
        ...prev,
        buyurtmalar: prev.buyurtmalar.map((b) =>
          b.id === buyurtmaId ? { ...b, holat: 'bekor_qilindi' } : b
        ),
        kunlikMenyu: prev.kunlikMenyu.map((m) => {
          const item = orderItems.find((i) => i.taom_id === m.taom_id);
          if (!item) return m;
          return {
            ...m,
            qolgan_porsiya: Math.min(
              m.jami_porsiya,
              m.qolgan_porsiya + item.soni
            ),
          };
        }),
        vaqtOraliqlari: prev.vaqtOraliqlari.map((v) =>
          v.id === order.vaqt_oraligi_id
            ? { ...v, joriy_buyurtmalar: Math.max(0, v.joriy_buyurtmalar - 1) }
            : v
        ),
      }));

      return {
        ok: true,
        message: `Buyurtma #${order.kod} bekor qilindi va porsiyalar menyuga qaytarildi.`,
      };
    },
    [getEffectiveNow, state.buyurtmaTarkibi, state.buyurtmalar, state.vaqtOraliqlari]
  );

  const rateOrderItem = useCallback(
    (itemId: string, baho: number, izoh: string): ActionResult => {
      if (baho < 1 || baho > 5) {
        return { ok: false, message: 'Baho 1 dan 5 gacha bo‘lishi kerak.' };
      }

      const item = state.buyurtmaTarkibi.find((i) => i.id === itemId);
      if (!item) {
        return { ok: false, message: 'Taom tarkibi topilmadi.' };
      }

      const order = state.buyurtmalar.find((b) => b.id === item.buyurtma_id);
      if (!order || order.holat !== 'berildi') {
        return {
          ok: false,
          message: "Faqat 'berildi' holatidagi buyurtma taomlariga baho berish mumkin.",
        };
      }

      setState((prev) => ({
        ...prev,
        buyurtmaTarkibi: prev.buyurtmaTarkibi.map((i) =>
          i.id === itemId ? { ...i, baho, izoh: izoh.trim() } : i
        ),
      }));

      return { ok: true, message: 'Baho va izoh saqlandi. Rahmat!' };
    },
    [state.buyurtmaTarkibi, state.buyurtmalar]
  );

  const addDishToMenu = useCallback(
    (input: {
      nomi: string;
      tavsif: string;
      narx: number;
      jami_porsiya: number;
      rasm_url?: string;
    }): ActionResult => {
      const nomi = input.nomi.trim();
      if (!nomi || input.narx <= 0 || input.jami_porsiya <= 0) {
        return {
          ok: false,
          message: "Taom nomi, narxi va porsiya sonini to'g'ri kiriting.",
        };
      }

      const newTaomId = `taom-${Date.now()}`;
      const newTaom: Taom = {
        id: newTaomId,
        nomi,
        tavsif:
          input.tavsif.trim() ||
          "Universitet oshxonasida bugun tayyorlangan yangi issiq taom.",
        narx: input.narx,
        rasm_url: input.rasm_url || '/images/default-dish.svg',
      };

      const newMenu: KunlikMenyu = {
        id: `menu-${Date.now()}`,
        sana: getTodayISO(),
        taom_id: newTaomId,
        jami_porsiya: input.jami_porsiya,
        qolgan_porsiya: input.jami_porsiya,
      };

      setState((prev) => ({
        ...prev,
        taomlar: [...prev.taomlar, newTaom],
        kunlikMenyu: [...prev.kunlikMenyu, newMenu],
      }));

      return { ok: true, message: `"${nomi}" kunlik menyuga qo'shildi.` };
    },
    []
  );

  const updateMenuPortions = useCallback(
    (
      menuId: string,
      jamiPorsiya: number,
      qolganPorsiya: number
    ): ActionResult => {
      if (jamiPorsiya < 0 || qolganPorsiya < 0 || qolganPorsiya > jamiPorsiya) {
        return {
          ok: false,
          message: "Qolgan porsiya jami porsiyadan oshmasligi va 0 dan kam bo'lmasligi kerak.",
        };
      }

      setState((prev) => ({
        ...prev,
        kunlikMenyu: prev.kunlikMenyu.map((m) =>
          m.id === menuId
            ? { ...m, jami_porsiya: jamiPorsiya, qolgan_porsiya: qolganPorsiya }
            : m
        ),
      }));

      return { ok: true, message: 'Porsiya soni yangilandi.' };
    },
    []
  );

  const markOrderServed = useCallback(
    (buyurtmaId: string): ActionResult => {
      const order = state.buyurtmalar.find((b) => b.id === buyurtmaId);
      if (!order) {
        return { ok: false, message: 'Buyurtma topilmadi.' };
      }
      if (order.holat === 'berildi') {
        return {
          ok: false,
          message: 'Bu buyurtma kodi allaqachon berilgan va qayta ishlatilmaydi!',
        };
      }
      if (order.holat !== 'kutilmoqda') {
        return {
          ok: false,
          message: `Buyurtma holati "${order.holat}" — berish mumkin emas.`,
        };
      }

      setState((prev) => ({
        ...prev,
        buyurtmalar: prev.buyurtmalar.map((b) =>
          b.id === buyurtmaId ? { ...b, holat: 'berildi' } : b
        ),
      }));

      return {
        ok: true,
        message: `#${order.kod} buyurtma uchun to'lov qabul qilindi va taom berildi.`,
      };
    },
    [state.buyurtmalar]
  );

  const markOrderUncollected = useCallback(
    (buyurtmaId: string): ActionResult => {
      const order = state.buyurtmalar.find((b) => b.id === buyurtmaId);
      if (!order) {
        return { ok: false, message: 'Buyurtma topilmadi.' };
      }
      if (order.holat !== 'kutilmoqda') {
        return {
          ok: false,
          message: "Faqat kutilayotgan buyurtmani 'olib ketilmadi' deb belgilash mumkin.",
        };
      }

      setState((prev) => ({
        ...prev,
        buyurtmalar: prev.buyurtmalar.map((b) =>
          b.id === buyurtmaId ? { ...b, holat: 'olib_ketilmadi' } : b
        ),
      }));

      return {
        ok: true,
        message: `#${order.kod} buyurtma "olib ketilmadi" deb belgilandi.`,
      };
    },
    [state.buyurtmalar]
  );

  const resetDemoData = useCallback(() => {
    const fresh = buildInitialState();
    setState((prev) => ({ ...fresh, currentRole: prev.currentRole }));
    setCart([]);
    setTimeSimMode('real');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const value: AppContextValue = {
    isHydrated,
    currentRole: state.currentRole,
    currentUser,
    users: SEED_USERS,
    taomlar: state.taomlar,
    kunlikMenyu: state.kunlikMenyu,
    vaqtOraliqlari: state.vaqtOraliqlari,
    buyurtmalar: state.buyurtmalar,
    buyurtmaTarkibi: state.buyurtmaTarkibi,
    cart,
    timeSimMode,
    setTimeSimMode,
    getEffectiveNow,
    switchRole,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    placeOrder,
    cancelOrder,
    rateOrderItem,
    addDishToMenu,
    updateMenuPortions,
    markOrderServed,
    markOrderUncollected,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
