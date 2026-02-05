'use client';

import { useSyncExternalStore } from 'react';
import { NODE_TEMPLATES } from '../../constants';
import { useFunnelStore } from '../../store';
import { PaletteItem } from './palette-item';
import { ValidationPanel } from '../validation-panel';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function Palette() {
  const { canAddNode } = useFunnelStore();
  const hydrated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <aside
      className="
        w-[var(--sidebar-width)] h-full
        bg-[var(--muted)]
        border-r border-[var(--border)]
        flex flex-col
      "
      aria-label="Node palette"
    >
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-sm text-[var(--muted-foreground)] uppercase tracking-wide">
          Components
        </h2>
      </div>

      <div className="p-3 flex flex-col gap-2 overflow-y-auto flex-1">
        {NODE_TEMPLATES.map((template) => (
          <PaletteItem
            key={template.type}
            template={template}
            disabled={hydrated && !canAddNode(template.type)}
          />
        ))}
      </div>

      <ValidationPanel />
    </aside>
  );
}
