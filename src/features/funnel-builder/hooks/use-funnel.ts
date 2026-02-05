'use client';

import { useShallow } from 'zustand/react/shallow';
import { useFunnelStore } from '../store';
import type { FunnelStore } from '../store';

export function useFunnel() {
  return useFunnelStore(
    useShallow((state: FunnelStore) => ({
      nodes: state.nodes,
      edges: state.edges,
      addNode: state.addNode,
      removeNode: state.removeNode,
      updateNodePosition: state.updateNodePosition,
      addEdge: state.addEdge,
      removeEdge: state.removeEdge,
      canConnect: state.canConnect,
      hasInvalidEdge: state.hasInvalidEdge,
      importState: state.importState,
    }))
  );
}

export function useFunnelData() {
  return useFunnelStore(
    useShallow((state: FunnelStore) => ({
      nodes: state.nodes,
      edges: state.edges,
    }))
  );
}
