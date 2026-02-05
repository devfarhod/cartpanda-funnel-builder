import type { FunnelNodeType } from '../types';

export interface NodeTemplate {
  type: FunnelNodeType;
  label: string;
  icon: string;
  color: string;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'salesPage',
    label: 'Sales Page',
    icon: '📄',
    color: 'var(--node-sales)',
  },
  {
    type: 'orderPage',
    label: 'Order Page',
    icon: '🛒',
    color: 'var(--node-order)',
  },
  {
    type: 'upsell',
    label: 'Upsell',
    icon: '⬆️',
    color: 'var(--node-upsell)',
  },
  {
    type: 'downsell',
    label: 'Downsell',
    icon: '⬇️',
    color: 'var(--node-downsell)',
  },
  {
    type: 'thankYou',
    label: 'Thank You',
    icon: '✅',
    color: 'var(--node-thankyou)',
  },
];

export const getNodeTemplate = (type: FunnelNodeType): NodeTemplate => {
  const template = NODE_TEMPLATES.find((t) => t.type === type);
  if (!template) {
    throw new Error(`Unknown node type: ${type}`);
  }
  return template;
};

export const SINGLETON_NODES: FunnelNodeType[] = [
  'salesPage',
  'orderPage',
  'thankYou',
];

const VALID_CONNECTIONS: Record<FunnelNodeType, FunnelNodeType[]> = {
  salesPage: ['orderPage', 'upsell', 'downsell', 'thankYou'],
  orderPage: ['upsell', 'downsell', 'thankYou'],
  upsell: ['upsell', 'downsell', 'thankYou'],
  downsell: ['upsell', 'downsell', 'thankYou'],
  thankYou: [],
};

export const isValidConnection = (
  sourceType: FunnelNodeType,
  targetType: FunnelNodeType
): boolean => {
  return VALID_CONNECTIONS[sourceType]?.includes(targetType) ?? false;
};
