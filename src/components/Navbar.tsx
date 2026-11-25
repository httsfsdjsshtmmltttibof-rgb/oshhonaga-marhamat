'use client';

import {
  ChefHat,
  GraduationCap,
  Receipt,
  RotateCcw,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';

const ROLES: { id: UserRole; label: string; icon: typeof GraduationCap }[] = [
  { id: 'talaba', label: 'Talaba', icon: GraduationCap },
  { id: 'oshpaz', label: 'Oshpaz', icon: ChefHat },
  { id: 'kassir', label: 'Kassir', icon: Receipt },
];

export function Navbar() {
  const { currentRole, currentUser, switchRole, resetDemoData } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Oshga marhamat
            </h1>
            <p className="text-xs text-slate-500">
              Universitet oshxonasi • {currentUser.ism}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav
            aria-label="Rolni almashtirish"
            className="flex items-center rounded-xl bg-slate-100 p-1"
          >
            {ROLES.map(({ id, label, icon: Icon }) => {
              const active = currentRole === id;
              return (
                <button
                  key={id}
                  onClick={() => switchRole(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={resetDemoData}
            title="Demo ma'lumotlarni boshlang'ich holatga qaytarish"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Qayta tiklash</span>
          </button>
        </div>
      </div>
    </header>
  );
}
