import { memo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import type { FunnelNodeType } from '../../types';
import { getNodeTemplate } from '../../constants';

export interface FunnelNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FunnelNodeType;
  hasWarning?: boolean;
}

export type FunnelNodeType_ = Node<FunnelNodeData, 'funnel'>;

interface FunnelNodeComponentProps {
  data: FunnelNodeData;
  selected?: boolean;
}

function FunnelNodeComponent({ data, selected }: FunnelNodeComponentProps) {
  const template = getNodeTemplate(data.nodeType);
  const isThankYou = data.nodeType === 'thankYou';
  const hasWarning = data.hasWarning;

  const getBoxShadow = () => {
    if (selected) return `0 0 0 3px ${template.color}, var(--shadow-lg)`;
    if (hasWarning) return `0 0 0 3px var(--warning), var(--shadow-md)`;
    return 'var(--shadow-md)';
  };

  return (
    <div
      role="group"
      aria-label={`${data.label} node${hasWarning ? ', has invalid connection' : ''}`}
      tabIndex={0}
      className={`
        min-w-[180px] px-4 py-3
        bg-[var(--background)]
        rounded-[var(--radius-lg)]
        transition-all duration-[var(--transition-fast)]
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
      `}
      style={{
        boxShadow: getBoxShadow(),
      }}
    >
      {data.nodeType !== 'salesPage' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-[var(--muted-foreground)] !border-2 !border-[var(--background)]"
        />
      )}

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl"
          style={{ backgroundColor: `${template.color}20` }}
          aria-hidden="true"
        >
          {template.icon}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{data.label}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">
              {template.label}
            </span>
            {hasWarning && !selected && (
              <span
                className="text-xs text-[var(--warning)]"
                title="Invalid connection"
              >
                ⚠️
              </span>
            )}
          </div>
        </div>
      </div>

      {!isThankYou && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-[var(--primary)] !border-2 !border-[var(--background)]"
        />
      )}
    </div>
  );
}

export const FunnelNode = memo(FunnelNodeComponent);
