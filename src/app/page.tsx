'use client';

import { Palette } from '@/features/funnel-builder/components/palette';
import { FunnelCanvas } from '@/features/funnel-builder/components/canvas';
import { Toolbar } from '@/features/funnel-builder/components/toolbar';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <main className="flex-1 bg-[var(--canvas-bg)]">
          <FunnelCanvas />
        </main>
      </div>
    </div>
  );
}
