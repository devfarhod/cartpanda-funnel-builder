'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MousePointerClick, ArrowRight } from 'lucide-react';

import { useFunnel } from '../../hooks';
import type {
  FunnelNodeType,
  FunnelNode as FunnelNodeT,
  FunnelEdge,
} from '../../types';
import { FunnelNode, FunnelNodeData } from '../nodes';

function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
          <MousePointerClick className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-lg font-medium mb-2">Empty Funnel</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Drag and drop components from the left panel to build your funnel.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="px-2 py-1 bg-[var(--muted)] rounded">
            Sales Page
          </span>
          <ArrowRight className="w-4 h-4" />
          <span className="px-2 py-1 bg-[var(--muted)] rounded">
            Order Page
          </span>
          <ArrowRight className="w-4 h-4" />
          <span className="px-2 py-1 bg-[var(--muted)] rounded">Thank You</span>
        </div>
      </div>
    </div>
  );
}

function FunnelCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo(() => ({ funnel: FunnelNode }), []);

  const {
    nodes: storeNodes,
    edges: storeEdges,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    updateNodePosition,
    canConnect,
    hasInvalidEdge,
  } = useFunnel();

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(
    new Set()
  );

  const nodes: Node<FunnelNodeData>[] = useMemo(() => {
    return storeNodes.map((node: FunnelNodeT) => ({
      id: node.id,
      type: 'funnel' as const,
      position: node.position,
      selected: selectedNodeIds.has(node.id),
      data: {
        label: node.label,
        nodeType: node.type,
        hasWarning: hasInvalidEdge(node.id),
      },
    }));
  }, [storeNodes, hasInvalidEdge, selectedNodeIds]);

  const edges: Edge[] = useMemo(() => {
    return storeEdges.map((edge: FunnelEdge) => {
      const isSelected = selectedEdgeIds.has(edge.id);
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: true,
        selected: isSelected,
        style: {
          stroke: isSelected ? 'var(--primary)' : 'var(--muted-foreground)',
          strokeWidth: isSelected ? 3 : 2,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: isSelected ? 'var(--primary)' : 'var(--muted-foreground)',
          width: 20,
          height: 20,
        },
      };
    });
  }, [storeEdges, selectedEdgeIds]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<FunnelNodeData>>[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.id) {
          updateNodePosition(change.id, change.position);
        }
        if (change.type === 'remove' && change.id) {
          removeNode(change.id);
          setSelectedNodeIds((prev) => {
            const next = new Set(prev);
            next.delete(change.id);
            return next;
          });
        }
        if (change.type === 'select' && change.id) {
          setSelectedNodeIds((prev) => {
            const next = new Set(prev);
            if (change.selected) {
              next.add(change.id);
            } else {
              next.delete(change.id);
            }
            return next;
          });
        }
      });
    },
    [updateNodePosition, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove' && change.id) {
          removeEdge(change.id);
          setSelectedEdgeIds((prev) => {
            const next = new Set(prev);
            next.delete(change.id);
            return next;
          });
        }
        if (change.type === 'select' && change.id) {
          setSelectedEdgeIds((prev) => {
            const next = new Set(prev);
            if (change.selected) {
              next.add(change.id);
            } else {
              next.delete(change.id);
            }
            return next;
          });
        }
      });
    },
    [removeEdge]
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (!connection.source || !connection.target) return false;
      return canConnect(connection.source, connection.target);
    },
    [canConnect]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target);
      }
    },
    [addEdge]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const type = e.dataTransfer.getData(
        'application/funnel-node'
      ) as FunnelNodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const isEmpty = storeNodes.length === 0;

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full relative"
      role="main"
      aria-label="Funnel canvas"
    >
      {isEmpty && <EmptyState />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'var(--primary)', strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 2 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--canvas-grid)"
        />
        <Controls />
        {!isEmpty && (
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{
              backgroundColor: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function FunnelCanvas() {
  return (
    <ReactFlowProvider>
      <FunnelCanvasInner />
    </ReactFlowProvider>
  );
}
