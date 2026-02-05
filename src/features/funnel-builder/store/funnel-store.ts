import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  FunnelNode,
  FunnelEdge,
  FunnelNodeType,
  Position,
} from '../types';
import { getNodeTemplate } from '../constants';

interface NodeCounters {
  upsell: number;
  downsell: number;
}

interface FunnelStore {
  nodes: FunnelNode[];
  edges: FunnelEdge[];
  counters: NodeCounters;

  addNode: (type: FunnelNodeType, position: Position) => void;
  updateNode: (id: string, updates: Partial<Omit<FunnelNode, 'id'>>) => void;
  removeNode: (id: string) => void;

  addEdge: (source: string, target: string) => boolean;
  removeEdge: (id: string) => void;

  clearAll: () => void;
  importState: (nodes: FunnelNode[], edges: FunnelEdge[]) => void;
}

const COUNTABLE_TYPES: FunnelNodeType[] = ['upsell', 'downsell'];

const initialCounters: NodeCounters = {
  upsell: 0,
  downsell: 0,
};

export const useFunnelStore = create<FunnelStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      counters: { ...initialCounters },

      addNode: (type, position) => {
        const template = getNodeTemplate(type);
        let label = template.label;

        if (COUNTABLE_TYPES.includes(type)) {
          const counters = get().counters;
          const key = type as keyof NodeCounters;
          const newCount = counters[key] + 1;
          label = `${template.label} ${newCount}`;

          const newNode: FunnelNode = {
            id: nanoid(),
            type,
            label,
            position,
          };

          set((state) => ({
            nodes: [...state.nodes, newNode],
            counters: { ...state.counters, [key]: newCount },
          }));
        } else {
          const newNode: FunnelNode = {
            id: nanoid(),
            type,
            label,
            position,
          };

          set((state) => ({
            nodes: [...state.nodes, newNode],
          }));
        }
      },

      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, ...updates } : node
          ),
        }));
      },

      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
        }));
      },

      addEdge: (source, target) => {
        const { nodes, edges } = get();

        const sourceNode = nodes.find((n) => n.id === source);
        if (sourceNode?.type === 'thankYou') {
          return false;
        }

        const edgeExists = edges.some(
          (e) => e.source === source && e.target === target
        );
        if (edgeExists) {
          return false;
        }

        const newEdge: FunnelEdge = {
          id: nanoid(),
          source,
          target,
        };

        set((state) => ({
          edges: [...state.edges, newEdge],
        }));

        return true;
      },

      removeEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
        }));
      },

      clearAll: () => {
        set({
          nodes: [],
          edges: [],
          counters: { ...initialCounters },
        });
      },

      importState: (nodes, edges) => {
        const counters = { ...initialCounters };

        nodes.forEach((node) => {
          if (COUNTABLE_TYPES.includes(node.type)) {
            const key = node.type as keyof NodeCounters;
            const match = node.label.match(/\d+$/);
            const num = match ? parseInt(match[0], 10) : 1;
            if (num > counters[key]) {
              counters[key] = num;
            }
          }
        });

        set({ nodes, edges, counters });
      },
    }),
    {
      name: 'funnel-builder-storage',
    }
  )
);
