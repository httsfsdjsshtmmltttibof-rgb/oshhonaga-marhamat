'use client';

import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { TalabaPanel } from '@/components/TalabaPanel';
import { OshpazPanel } from '@/components/OshpazPanel';
import { KassirPanel } from '@/components/KassirPanel';

export default function HomePage() {
  const { currentRole, isHydrated } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {!isHydrated ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Yuklanmoqda...
          </div>
        ) : (
          <>
            {currentRole === 'talaba' && <TalabaPanel />}
            {currentRole === 'oshpaz' && <OshpazPanel />}
            {currentRole === 'kassir' && <KassirPanel />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        «Oshga marhamat» — Universitet oshxonasi oldindan buyurtma tizimi
      </footer>
    </div>
  );
}
