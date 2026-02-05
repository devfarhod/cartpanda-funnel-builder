export type FunnelNodeType =
  | 'salesPage'
  | 'orderPage'
  | 'upsell'
  | 'downsell'
  | 'thankYou';

export interface Position {
  x: number;
  y: number;
}

export interface FunnelNode {
  id: string;
  type: FunnelNodeType;
  label: string;
  position: Position;
}

export interface FunnelEdge {
  id: string;
  source: string;
  target: string;
}

export interface FunnelState {
  nodes: FunnelNode[];
  edges: FunnelEdge[];
}
