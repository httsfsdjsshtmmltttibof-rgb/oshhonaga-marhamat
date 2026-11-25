import {
  Buyurtma,
  BuyurtmaTarkibi,
  Foydalanuvchi,
  KunlikMenyu,
  Taom,
  VaqtOraligi,
} from '@/types';
const SEED_DATE = '2026-11-25';

export const SEED_USERS: Foydalanuvchi[] = [
  {
    id: 'user-talaba-1',
    ism: 'Azizbek Karimov',
    rol: 'talaba',
    login: 'azizbek.k',
  },
  {
    id: 'user-oshpaz-1',
    ism: 'Dilshod Usta',
    rol: 'oshpaz',
    login: 'oshpaz.dilshod',
  },
  {
    id: 'user-kassir-1',
    ism: 'Madina Rahimova',
    rol: 'kassir',
    login: 'kassir.madina',
  },
];

export const SEED_TAOMLAR: Taom[] = [
  {
    id: 'taom-osh',
    nomi: "To'y oshi",
    tavsif: "Sariq sabzi, mol go'shti, no'xat va mayiz bilan damlangan an'anaviy osh.",
    narx: 28000,
    rasm_url: '/images/osh.svg',
  },
  {
    id: 'taom-manti',
    nomi: 'Qaynoq manti (4 dona)',
    tavsif: "Mayda to'g'ralgan mol go'shti va piyozli bug'da pishirilgan manti, smetana bilan.",
    narx: 24000,
    rasm_url: '/images/manti.svg',
  },
  {
    id: 'taom-lagmon',
    nomi: "Uy lag'moni",
    tavsif: "Qo'lda cho'zilgan xamir, sabzavotlar va shirador go'shtli qayla.",
    narx: 26000,
    rasm_url: '/images/lagmon.svg',
  },
  {
    id: 'taom-somsa',
    nomi: 'Tandir somsa (2 dona)',
    tavsif: "Qatlama xamirli, qo'y go'shti va ziravorli issiq tandir somsa.",
    narx: 16000,
    rasm_url: '/images/somsa.svg',
  },
  {
    id: 'taom-choy',
    nomi: "Limonli ko'k choy",
    tavsif: "Yangi damlangan ko'k choy, limon bo'lagi va shirinlik bilan (choynak).",
    narx: 5000,
    rasm_url: '/images/choy.svg',
  },
];

export function createSeedKunlikMenyu(): KunlikMenyu[] {
  const today = SEED_DATE;
  return [
    {
      id: 'menu-1',
      sana: today,
      taom_id: 'taom-osh',
      jami_porsiya: 40,
      qolgan_porsiya: 28,
    },
    {
      id: 'menu-2',
      sana: today,
      taom_id: 'taom-manti',
      jami_porsiya: 25,
      qolgan_porsiya: 14,
    },
    {
      id: 'menu-3',
      sana: today,
      taom_id: 'taom-lagmon',
      jami_porsiya: 20,
      qolgan_porsiya: 11,
    },
    {
      id: 'menu-4',
      sana: today,
      taom_id: 'taom-somsa',
      jami_porsiya: 35,
      qolgan_porsiya: 0, // Validation testi uchun tugagan taom namunasi
    },
    {
      id: 'menu-5',
      sana: today,
      taom_id: 'taom-choy',
      jami_porsiya: 60,
      qolgan_porsiya: 48,
    },
  ];
}

export const SEED_VAQT_ORALIQLARI: VaqtOraligi[] = [
  {
    id: 'slot-1',
    oraliq_nomi: '12:00–12:15',
    max_buyurtma_soni: 15,
    joriy_buyurtmalar: 2,
  },
  {
    id: 'slot-2',
    oraliq_nomi: '12:15–12:30',
    max_buyurtma_soni: 15,
    joriy_buyurtmalar: 1,
  },
  {
    id: 'slot-3',
    oraliq_nomi: '12:30–12:45',
    max_buyurtma_soni: 15,
    joriy_buyurtmalar: 0,
  },
  {
    id: 'slot-4',
    oraliq_nomi: '12:45–13:00',
    max_buyurtma_soni: 10,
    joriy_buyurtmalar: 10, // Limitga yetgan vaqt oralig'i namunasi
  },
];

export function createSeedBuyurtmalar(): Buyurtma[] {
  const today = SEED_DATE;
  return [
    {
      id: 'order-seed-1',
      kod: '482910',
      talaba_id: 'user-talaba-1',
      vaqt_oraligi_id: 'slot-1',
      holat: 'kutilmoqda',
      jami_summa: 33000,
      yaratilgan_vaqt: `${today}T09:15:00`,
    },
    {
      id: 'order-seed-2',
      kod: '739104',
      talaba_id: 'user-talaba-1',
      vaqt_oraligi_id: 'slot-2',
      holat: 'berildi',
      jami_summa: 50000,
      yaratilgan_vaqt: `${today}T08:40:00`,
    },
    {
      id: 'order-seed-3',
      kod: '195428',
      talaba_id: 'user-talaba-1',
      vaqt_oraligi_id: 'slot-1',
      holat: 'olib_ketilmadi',
      jami_summa: 28000,
      yaratilgan_vaqt: `${today}T08:10:00`,
    },
  ];
}

export const SEED_BUYURTMA_TARKIBI: BuyurtmaTarkibi[] = [
  {
    id: 'item-seed-1',
    buyurtma_id: 'order-seed-1',
    taom_id: 'taom-osh',
    soni: 1,
  },
  {
    id: 'item-seed-2',
    buyurtma_id: 'order-seed-1',
    taom_id: 'taom-choy',
    soni: 1,
  },
  {
    id: 'item-seed-3',
    buyurtma_id: 'order-seed-2',
    taom_id: 'taom-manti',
    soni: 1,
    baho: 5,
    izoh: 'Juda mazali va issiq ekan, rahmat!',
  },
  {
    id: 'item-seed-4',
    buyurtma_id: 'order-seed-2',
    taom_id: 'taom-lagmon',
    soni: 1,
  },
  {
    id: 'item-seed-5',
    buyurtma_id: 'order-seed-3',
    taom_id: 'taom-osh',
    soni: 1,
  },
];
