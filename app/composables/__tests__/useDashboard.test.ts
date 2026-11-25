// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { useDashboard } from '../dashboard/useDashboard';

describe('useDashboard edit session', () => {
  it('restores the board exactly on cancel', () => {
    const dashboard = useDashboard();
    const before = JSON.parse(
      JSON.stringify({
        items: dashboard.items.value,
        layout: dashboard.layout.value,
      }),
    );

    dashboard.startEdit();
    // The grid moves layout items in place while dragging
    dashboard.layout.value[0]!.y = 7;
    dashboard.removeWidget(dashboard.items.value[1]!.i);
    dashboard.cancelEdit();

    expect(dashboard.editing.value).toBe(false);
    expect({
      items: dashboard.items.value,
      layout: dashboard.layout.value,
    }).toEqual(before);
  });

  it('keeps the changes on done', () => {
    const dashboard = useDashboard();
    dashboard.startEdit();
    dashboard.layout.value[0]!.y = 7;
    dashboard.doneEdit();

    expect(dashboard.editing.value).toBe(false);
    expect(dashboard.layout.value[0]!.y).toBe(7);
  });

  it('removes a widget together with its layout entry', () => {
    const dashboard = useDashboard();
    const removed = dashboard.items.value[0]!.i;
    dashboard.startEdit();
    dashboard.removeWidget(removed);

    expect(dashboard.items.value.some((item) => item.i === removed)).toBe(
      false,
    );
    expect(dashboard.layout.value.some((l) => l.i === removed)).toBe(false);
  });

  it('ignores a second start, so cancel still goes back to the first copy', () => {
    const dashboard = useDashboard();
    const y = dashboard.layout.value[0]!.y;
    dashboard.startEdit();
    dashboard.layout.value[0]!.y = y + 3;
    dashboard.startEdit();
    dashboard.cancelEdit();

    expect(dashboard.layout.value[0]!.y).toBe(y);
  });
});
