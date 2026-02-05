'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useFunnelStore, type FunnelStore } from '../../store';
import type { FunnelNode, FunnelEdge } from '../../types';
import { isValidConnection } from '../../constants';

interface ValidationMessage {
  type: 'error' | 'warning' | 'success';
  message: string;
}

export function getValidationMessages(
  nodes: FunnelNode[],
  edges: FunnelEdge[]
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];

  const hasSalesPage = nodes.some((n) => n.type === 'salesPage');
  if (!hasSalesPage && nodes.length > 0) {
    messages.push({
      type: 'error',
      message: 'Add a Sales Page',
    });
  }

  const nodesWithOutgoing = new Set<string>();

  edges.forEach((edge) => {
    nodesWithOutgoing.add(edge.source);
  });

  let missingConnectionsCount = 0;

  nodes.forEach((node) => {
    const hasOutgoing = nodesWithOutgoing.has(node.id);

    if (node.type === 'thankYou') {
      return;
    }

    if (node.type === 'salesPage') {
      if (!hasOutgoing && nodes.length > 1) {
        missingConnectionsCount++;
      }
    } else {
      if (!hasOutgoing) {
        missingConnectionsCount++;
      }
    }
  });

  if (missingConnectionsCount > 0) {
    messages.push({
      type: 'error',
      message: `${missingConnectionsCount} connection${missingConnectionsCount > 1 ? 's' : ''} missing`,
    });
  }

  let invalidCount = 0;
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      if (!isValidConnection(sourceNode.type, targetNode.type)) {
        invalidCount++;
      }
    }
  });

  if (invalidCount > 0) {
    messages.push({
      type: 'warning',
      message: `${invalidCount} invalid connection${invalidCount > 1 ? 's' : ''}`,
    });
  }

  if (messages.length === 0 && nodes.length > 0) {
    messages.push({
      type: 'success',
      message: 'Funnel ready! ✨',
    });
  }

  return messages;
}

function ValidationIcon({ type }: { type: ValidationMessage['type'] }) {
  switch (type) {
    case 'error':
      return (
        <XCircle
          className="w-4 h-4 text-red-500 flex-shrink-0"
          aria-hidden="true"
        />
      );
    case 'warning':
      return (
        <AlertTriangle
          className="w-4 h-4 text-amber-500 flex-shrink-0"
          aria-hidden="true"
        />
      );
    case 'success':
      return (
        <CheckCircle2
          className="w-4 h-4 text-green-500 flex-shrink-0"
          aria-hidden="true"
        />
      );
  }
}

export function useValidation() {
  const { nodes, edges } = useFunnelStore(
    useShallow((state: FunnelStore) => ({
      nodes: state.nodes,
      edges: state.edges,
    }))
  );

  const messages = getValidationMessages(nodes, edges);

  const errorCount = messages.filter((m) => m.type === 'error').length;
  const warningCount = messages.filter((m) => m.type === 'warning').length;
  const isValid = errorCount === 0 && warningCount === 0 && nodes.length > 0;

  return {
    messages,
    errorCount,
    warningCount,
    isValid,
    nodeCount: nodes.length,
  };
}

export function ValidationPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, errorCount, warningCount, isValid, nodeCount } =
    useValidation();

  return (
    <div className="border-t border-[var(--border)] bg-[var(--background)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="validation-panel-content"
        aria-label={`Validation panel, ${errorCount} errors, ${warningCount} warnings`}
        className="
          w-full
          flex items-center gap-2
          px-3 py-2.5
          hover:bg-[var(--muted)]
          transition-colors
          text-left
          cursor-pointer
        "
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}

        <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
        <span className="font-medium text-sm flex-1">Validation</span>
        <div className="flex items-center gap-1.5">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
              <XCircle className="w-3 h-3" />
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              {warningCount}
            </span>
          )}
          {isValid && (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div
          id="validation-panel-content"
          aria-live="polite"
          className="border-t border-[var(--border)] max-h-48 overflow-y-auto"
        >
          {nodeCount === 0 ? (
            <div className="flex items-center gap-2 p-3 text-sm text-[var(--muted-foreground)]">
              <AlertCircle className="w-4 h-4" />
              <span>Start by adding nodes</span>
            </div>
          ) : (
            <ul
              role="list"
              aria-label="Validation messages"
              className="p-2 space-y-0.5"
            >
              {messages.map((msg, index) => (
                <li
                  key={index}
                  role="listitem"
                  className="
                    flex items-center gap-2
                    px-2 py-1.5
                    text-sm
                    rounded
                    hover:bg-[var(--muted)]
                    transition-colors
                  "
                >
                  <ValidationIcon type={msg.type} />
                  <span>{msg.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
