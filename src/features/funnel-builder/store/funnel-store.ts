import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { nanoid } from 'nanoid';
import type {
  FunnelNode,
  FunnelEdge,
  FunnelNodeType,
  Position,
} from '../types';
import {
  getNodeTemplate,
  SINGLETON_NODES,
  isValidConnection,
} from '../constants';

interface NodeCounters {
  upsell: number;
  downsell: number;
}

export interface FunnelStore {
  nodes: FunnelNode[];
  edges: FunnelEdge[];
  counters: NodeCounters;

  addNode: (type: FunnelNodeType, position: Position) => boolean;
  updateNode: (id: string, updates: Partial<Omit<FunnelNode, 'id'>>) => void;
  updateNodePosition: (id: string, position: Position) => void;
  removeNode: (id: string) => void;
  canAddNode: (type: FunnelNodeType) => boolean;

  addEdge: (source: string, target: string) => boolean;
  removeEdge: (id: string) => void;
  canConnect: (sourceId: string, targetId: string) => boolean;
  hasInvalidEdge: (nodeId: string) => boolean;

  clearAll: () => void;
  importState: (nodes: FunnelNode[], edges: FunnelEdge[]) => void;
}

const COUNTABLE_TYPES: FunnelNodeType[] = ['upsell', 'downsell'];

const initialCounters: NodeCounters = {
  upsell: 0,
  downsell: 0,
};

const createFunnelStore: StateCreator<FunnelStore, [], [], FunnelStore> = (
  set,
  get
) => ({
  nodes: [],
  edges: [],
  counters: { ...initialCounters },

  canAddNode: (type) => {
    if (!SINGLETON_NODES.includes(type)) return true;
    const nodes = get().nodes;
    return !nodes.some((node) => node.type === type);
  },

  addNode: (type, position) => {
    if (!get().canAddNode(type)) return false;

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
    return true;
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  },

  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node
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

  canConnect: (sourceId, targetId) => {
    const { nodes, edges } = get();

    if (sourceId === targetId) return false;

    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);

    if (!sourceNode || !targetNode) return false;

    if (sourceNode.type === 'thankYou') return false;
    if (targetNode.type === 'salesPage') return false;

    const edgeExists = edges.some(
      (e) => e.source === sourceId && e.target === targetId
    );
    if (edgeExists) return false;

    return true;
  },

  hasInvalidEdge: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode) continue;
      if (!isValidConnection(node.type, targetNode.type)) {
        return true;
      }
    }

    const incomingEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) continue;
      if (!isValidConnection(sourceNode.type, node.type)) {
        return true;
      }
    }

    return false;
  },

  addEdge: (source, target) => {
    if (!get().canConnect(source, target)) {
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
        const match = (node.label || '').match(/\d+$/);
        const num = match ? parseInt(match[0], 10) : 1;
        if (num > counters[key]) {
          counters[key] = num;
        }
      }
    });

    set({ nodes, edges, counters });
  },
});

// zundo passes plain objects on undo; merge so actions aren't lost
const createStoreWithMergeSet: StateCreator<FunnelStore, [], [], FunnelStore> = (
  set,
  get,
  api
) => {
  const mergeSet: typeof set = (partial) => {
    if (partial == null) return;
    if (typeof partial === 'function') return set(partial);
    const current = get();
    const next = partial as Partial<FunnelStore>;
    const isDataOnly =
      next &&
      typeof next === 'object' &&
      !('addNode' in next && typeof (next as FunnelStore).addNode === 'function');
    if (isDataOnly) return set({ ...current, ...next });
    return set(partial as Partial<FunnelStore>);
  };
  return createFunnelStore(mergeSet, get, api);
};

const temporalStore = temporal(createStoreWithMergeSet, {
  partialize: (state) => ({ nodes: state.nodes, edges: state.edges, counters: state.counters }),
});

export const useFunnelStore = create<FunnelStore>()(
  persist(temporalStore, {
    name: 'funnel-builder-storage',
    partialize: (state) => ({
      nodes: state.nodes,
      edges: state.edges,
      counters: state.counters,
    }),
    merge: (persisted, current) => {
      const p = persisted as Partial<Pick<FunnelStore, 'nodes' | 'edges' | 'counters'>>;
      return {
        ...current,
        nodes: Array.isArray(p.nodes) ? p.nodes : current.nodes,
        edges: Array.isArray(p.edges) ? p.edges : current.edges,
        counters: p.counters && typeof p.counters === 'object' ? p.counters : current.counters,
      };
    },
  })
);

export const useTemporalStore = <T>(
  selector: (state: ReturnType<typeof useFunnelStore.temporal.getState>) => T
) => useStoreWithEqualityFn(useFunnelStore.temporal, selector);
