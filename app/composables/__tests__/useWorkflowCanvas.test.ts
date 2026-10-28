// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { WorkflowNode, WorkflowNodeConnection } from '#shared/types';
import { useWorkflowCanvas } from '../useWorkflowCanvas';

const { toCanvas, toApi } = useWorkflowCanvas();

const nodes: WorkflowNode[] = [
  {
    id: 'filter-shipping',
    name: 'Filter shipping',
    functionName: 'core.flow.condition',
    config: {
      conditions: [{ label: 'order exists', condition: 'input.order' }],
      defaultLabel: 'else',
    },
  },
  {
    id: 'build-rows',
    name: 'Build item lines',
    functionName: 'core.data.map',
    config: {},
  },
];

const load = (connections: WorkflowNodeConnection[]) =>
  toCanvas({ nodes, connections });

describe('useWorkflowCanvas', () => {
  it('does not attach an unlabeled condition edge to a branch', () => {
    const { edges } = load([
      {
        from: 'filter-shipping',
        to: 'build-rows',
        label: '',
        type: 'sequential',
      },
    ]);

    expect(edges[0]?.sourceHandle).toBeUndefined();
    expect(edges[0]?.label).toBeUndefined();
  });

  it('keeps an unlabeled condition edge unlabeled when saved again', () => {
    const { nodes: canvasNodes, edges } = load([
      {
        from: 'filter-shipping',
        to: 'build-rows',
        label: '',
        type: 'sequential',
      },
    ]);

    expect(toApi({ nodes: canvasNodes, edges }).connections[0]?.label).toBe('');
  });

  it('restores a labeled condition edge onto its branch handle', () => {
    const { nodes: canvasNodes, edges } = load([
      {
        from: 'filter-shipping',
        to: 'build-rows',
        label: 'order exists',
        type: 'conditional',
      },
    ]);

    expect(edges[0]?.sourceHandle).toBe('order exists');
    expect(toApi({ nodes: canvasNodes, edges }).connections[0]).toMatchObject({
      label: 'order exists',
      type: 'conditional',
    });
  });
});
