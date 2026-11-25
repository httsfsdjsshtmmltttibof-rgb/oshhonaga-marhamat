export type UserRole = 'talaba' | 'oshpaz' | 'kassir';

export type OrderStatus =
  | 'kutilmoqda'
  | 'berildi'
  | 'bekor_qilindi'
  | 'olib_ketilmadi';

export interface Foydalanuvchi {
  id: string;
  ism: string;
  rol: UserRole;
  login: string;
}

export interface Taom {
  id: string;
  nomi: string;
  tavsif: string;
  narx: number;
  rasm_url: string;
}

export interface KunlikMenyu {
  id: string;
  sana: string;
  taom_id: string;
  jami_porsiya: number;
  qolgan_porsiya: number;
}

export interface VaqtOraligi {
  id: string;
  oraliq_nomi: string;
  max_buyurtma_soni: number;
  joriy_buyurtmalar: number;
}

export interface Buyurtma {
  id: string;
  kod: string;
  talaba_id: string;
  vaqt_oraligi_id: string;
  holat: OrderStatus;
  jami_summa: number;
  yaratilgan_vaqt: string;
}

export interface BuyurtmaTarkibi {
  id: string;
  buyurtma_id: string;
  taom_id: string;
  soni: number;
  baho?: number;
  izoh?: string;
}

export interface CartItem {
  taom_id: string;
  soni: number;
}
