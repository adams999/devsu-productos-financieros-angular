import { positionAnchoredPopover, watchAnchoredPopover } from './anchored-popover';

describe('anchored popover helpers', () => {
  it('positions a centered panel within the viewport and flips above when needed', () => {
    const anchor = document.createElement('button');
    const panel = document.createElement('div');
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 120,
      top: window.innerHeight - 40,
      bottom: window.innerHeight - 20,
      width: 20,
      height: 20,
      x: 100,
      y: window.innerHeight - 40,
      toJSON: () => ({}),
    });
    vi.spyOn(panel, 'offsetWidth', 'get').mockReturnValue(100);
    vi.spyOn(panel, 'offsetHeight', 'get').mockReturnValue(80);

    positionAnchoredPopover(anchor, panel, { horizontal: 'center', gap: 6 });

    expect(panel.style.left).toBe('60px');
    expect(panel.style.top).toBe(`${window.innerHeight - 126}px`);
    vi.restoreAllMocks();
  });

  it('stops forwarding viewport and dismissal events after cleanup', () => {
    const onViewport = vi.fn();
    const onPointer = vi.fn();
    const onEscape = vi.fn();
    const stop = watchAnchoredPopover(document, onViewport, onPointer, onEscape);

    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('pointerdown'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect([onViewport, onPointer, onEscape].map((callback) => callback.mock.calls.length)).toEqual(
      [1, 1, 1],
    );

    stop();
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('pointerdown'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect([onViewport, onPointer, onEscape].map((callback) => callback.mock.calls.length)).toEqual(
      [1, 1, 1],
    );
  });
});
