'use client';

import { useRef, useState, useCallback } from 'react';
import { Undo2, Redo2, Workflow, Download, Upload } from 'lucide-react';
import { useFunnelStore, useTemporalStore } from '../../store';
import { IconButton, Toast } from '@/shared/components/ui';
import type { FunnelNode, FunnelEdge, FunnelNodeType } from '../../types';

const VALID_NODE_TYPES: FunnelNodeType[] = [
  'salesPage',
  'orderPage',
  'upsell',
  'downsell',
  'thankYou',
];

function validateImportData(data: unknown): {
  nodes: FunnelNode[];
  edges: FunnelEdge[];
} {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON structure');
  }

  const obj = data as Record<string, unknown>;

  if (!('version' in obj) || typeof obj.version !== 'string') {
    throw new Error('Missing or invalid "version" field');
  }

  if (!('exportedAt' in obj) || typeof obj.exportedAt !== 'string') {
    throw new Error('Missing or invalid "exportedAt" field');
  }

  if (!('funnel' in obj) || typeof obj.funnel !== 'object' || !obj.funnel) {
    throw new Error('Missing or invalid "funnel" field');
  }

  const funnel = obj.funnel as Record<string, unknown>;

  if (!('nodes' in funnel) || !Array.isArray(funnel.nodes)) {
    throw new Error('Missing or invalid "funnel.nodes" array');
  }

  if (!('edges' in funnel) || !Array.isArray(funnel.edges)) {
    throw new Error('Missing or invalid "funnel.edges" array');
  }

  const nodes = funnel.nodes.map((node: unknown, index: number) => {
    if (!node || typeof node !== 'object') {
      throw new Error(`Node at index ${index} is invalid`);
    }

    const n = node as Record<string, unknown>;

    if (!('id' in n) || typeof n.id !== 'string' || !n.id) {
      throw new Error(`Node at index ${index}: missing or invalid "id"`);
    }

    if (
      !('type' in n) ||
      typeof n.type !== 'string' ||
      !VALID_NODE_TYPES.includes(n.type as FunnelNodeType)
    ) {
      throw new Error(`Node at index ${index}: missing or invalid "type"`);
    }

    if (!('label' in n) || typeof n.label !== 'string' || !n.label) {
      throw new Error(`Node at index ${index}: missing or invalid "label"`);
    }

    if (!('position' in n) || typeof n.position !== 'object' || !n.position) {
      throw new Error(`Node at index ${index}: missing or invalid "position"`);
    }

    const pos = n.position as Record<string, unknown>;

    if (!('x' in pos) || typeof pos.x !== 'number') {
      throw new Error(
        `Node at index ${index}: missing or invalid "position.x"`
      );
    }

    if (!('y' in pos) || typeof pos.y !== 'number') {
      throw new Error(
        `Node at index ${index}: missing or invalid "position.y"`
      );
    }

    return {
      id: n.id,
      type: n.type as FunnelNodeType,
      label: n.label,
      position: { x: pos.x, y: pos.y },
    } as FunnelNode;
  });

  const edges = funnel.edges.map((edge: unknown, index: number) => {
    if (!edge || typeof edge !== 'object') {
      throw new Error(`Edge at index ${index} is invalid`);
    }

    const e = edge as Record<string, unknown>;

    if (!('id' in e) || typeof e.id !== 'string' || !e.id) {
      throw new Error(`Edge at index ${index}: missing or invalid "id"`);
    }

    if (!('source' in e) || typeof e.source !== 'string' || !e.source) {
      throw new Error(`Edge at index ${index}: missing or invalid "source"`);
    }

    if (!('target' in e) || typeof e.target !== 'string' || !e.target) {
      throw new Error(`Edge at index ${index}: missing or invalid "target"`);
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
    } as FunnelEdge;
  });

  return { nodes, edges };
}

interface TemporalState {
  pastStates: unknown[];
  futureStates: unknown[];
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export function Toolbar() {
  const {
    undo,
    redo,
    pastStates,
    futureStates,
    clear: clearHistory,
  } = useTemporalStore((state: TemporalState) => state);

  const { nodes, edges, importState } = useFunnelStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'error') => {
      setToast({ message, type });
    },
    []
  );

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;
  const hasNodes = nodes.length > 0;

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      funnel: { nodes, edges },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        const { nodes: validatedNodes, edges: validatedEdges } =
          validateImportData(data);

        importState(validatedNodes, validatedEdges);
        clearHistory();
        showToast('Funnel imported successfully', 'success');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to import file',
          'error'
        );
      }
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header
      role="banner"
      className="
        h-[var(--toolbar-height)]
        bg-[var(--muted)]
        border-b border-[var(--border)]
        flex items-center justify-between px-4
      "
    >
      <div className="flex items-center gap-2">
        <Workflow
          className="w-5 h-5 text-[var(--primary)]"
          aria-hidden="true"
        />
        <h1 className="font-semibold text-lg">Funnel Builder</h1>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import JSON file"
        />

        <IconButton
          aria-label="Import JSON"
          onClick={() => fileInputRef.current?.click()}
          title="Import JSON"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          aria-label="Export JSON"
          onClick={handleExport}
          disabled={!hasNodes}
          title="Export JSON"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
        </IconButton>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <nav aria-label="Actions" className="flex items-center gap-2">
        <IconButton
          aria-label="Undo (Ctrl+Z)"
          onClick={() => undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-label="Redo (Ctrl+Y)"
          onClick={() => redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" aria-hidden="true" />
        </IconButton>
      </nav>
    </header>
  );
}
