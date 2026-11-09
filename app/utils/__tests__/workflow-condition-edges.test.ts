// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  conditionBranchLabels,
  edgeConnectionRouting,
  isUnroutedConditionEdge,
  resolveBranchLabelRename,
} from '../workflow-condition-edges';

const conditionData = {
  conditions: [
    { label: 'order exists', condition: 'input.order != null' },
    { label: '', condition: '' },
  ],
  defaultLabel: 'else',
};

describe('conditionBranchLabels', () => {
  it('lists non-empty branch labels, then the default', () => {
    expect(conditionBranchLabels(conditionData)).toEqual([
      'order exists',
      'else',
    ]);
  });

  it('returns nothing for a node without branches', () => {
    expect(conditionBranchLabels(undefined)).toEqual([]);
    expect(conditionBranchLabels({})).toEqual([]);
  });
});

describe('edgeConnectionRouting', () => {
  it('saves an edge drawn from a branch handle under that branch', () => {
    expect(edgeConnectionRouting({ sourceHandle: 'order exists' })).toEqual({
      type: 'conditional',
      label: 'order exists',
    });
  });

  it('prefers the edge label over the handle id', () => {
    expect(
      edgeConnectionRouting({
        label: 'order exists',
        sourceHandle: 'butik',
        data: { type: 'conditional' },
      }),
    ).toEqual({ type: 'conditional', label: 'order exists' });
  });

  it('saves a handle-less edge as sequential with no label', () => {
    expect(edgeConnectionRouting({})).toEqual({
      type: 'sequential',
      label: '',
    });
  });
});

describe('isUnroutedConditionEdge', () => {
  it('flags an unlabeled edge the engine never follows', () => {
    // The saved v19 shape from the incident: label '' + sequential.
    expect(
      isUnroutedConditionEdge(
        { label: '', data: { type: 'sequential' } },
        conditionData,
      ),
    ).toBe(true);
  });

  it('flags an edge still labeled with a renamed branch', () => {
    expect(
      isUnroutedConditionEdge(
        { label: 'butik', sourceHandle: 'butik' },
        conditionData,
      ),
    ).toBe(true);
  });

  it('accepts edges routed to a branch or the default', () => {
    expect(
      isUnroutedConditionEdge({ sourceHandle: 'order exists' }, conditionData),
    ).toBe(false);
    expect(
      isUnroutedConditionEdge(
        { label: 'else', sourceHandle: 'else' },
        conditionData,
      ),
    ).toBe(false);
  });

  it('flags every edge from a condition without branches', () => {
    expect(isUnroutedConditionEdge({}, { conditions: [] })).toBe(true);
  });
});

describe('resolveBranchLabelRename', () => {
  it('keeps edges on the old label while it is retyped through empty', () => {
    // Renaming `butik` → `order exists` by clearing the field first used to
    // rename the edge to '' and then lose track of it.
    const pending = new Map<number, string>();
    const keystrokes = ['butik', '', 'o', 'or', 'order exists'];
    const renames = keystrokes
      .slice(1)
      .map((next, i) =>
        resolveBranchLabelRename(pending, 0, keystrokes[i] ?? '', next),
      );

    expect(renames).toEqual([
      null,
      { from: 'butik', to: 'o' },
      { from: 'o', to: 'or' },
      { from: 'or', to: 'order exists' },
    ]);
    expect(pending.size).toBe(0);
  });

  it('never renames to an empty label', () => {
    const pending = new Map<number, string>();
    expect(resolveBranchLabelRename(pending, 1, 'yes', '')).toBeNull();
    expect(pending.get(1)).toBe('yes');
  });

  it('skips the rename when the same label is typed back', () => {
    const pending = new Map<number, string>([[0, 'yes']]);
    expect(resolveBranchLabelRename(pending, 0, '', 'yes')).toBeNull();
    expect(pending.has(0)).toBe(false);
  });

  it('has nothing to rename for a branch that never had a label', () => {
    const pending = new Map<number, string>();
    expect(resolveBranchLabelRename(pending, 0, '', 'yes')).toBeNull();
  });
});
