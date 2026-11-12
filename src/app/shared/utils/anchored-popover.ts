import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

export interface AnchoredPopoverOptions {
  readonly horizontal: 'start' | 'center' | 'end';
  readonly gap: number;
}

export function positionAnchoredPopover(
  anchor: HTMLElement,
  panel: HTMLElement,
  options: AnchoredPopoverOptions,
): void {
  const view = anchor.ownerDocument.defaultView;
  if (!view) return;
  const trigger = anchor.getBoundingClientRect();
  const margin = 8;
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const preferredLeft =
    options.horizontal === 'start'
      ? trigger.left
      : options.horizontal === 'end'
        ? trigger.right - width
        : trigger.left + (trigger.width - width) / 2;
  const below = view.innerHeight - trigger.bottom;
  const preferredTop =
    below >= height + options.gap + margin || below >= trigger.top
      ? trigger.bottom + options.gap
      : trigger.top - height - options.gap;

  panel.style.left = `${Math.max(margin, Math.min(preferredLeft, view.innerWidth - width - margin))}px`;
  panel.style.top = `${Math.max(margin, Math.min(preferredTop, view.innerHeight - height - margin))}px`;
}

export function watchAnchoredPopover(
  document: Document,
  onViewportChange: () => void,
  onOutsidePointer: (event: PointerEvent) => void,
  onEscape: (event: KeyboardEvent) => void,
): () => void {
  const view = document.defaultView;
  if (!view) return () => undefined;
  view.addEventListener('scroll', onViewportChange, true);
  view.addEventListener('resize', onViewportChange);
  document.addEventListener('pointerdown', onOutsidePointer, true);
  document.addEventListener('keydown', onEscape);

  return () => {
    view.removeEventListener('scroll', onViewportChange, true);
    view.removeEventListener('resize', onViewportChange);
    document.removeEventListener('pointerdown', onOutsidePointer, true);
    document.removeEventListener('keydown', onEscape);
  };
}
@Injectable({ providedIn: 'root' })
export class AnchoredPopoverController {
  private readonly document = inject(DOCUMENT);

  show(panel: HTMLElement): void {
    panel.hidden = false;
    if (typeof panel.showPopover === 'function') panel.showPopover();
    else panel.removeAttribute('popover');
  }

  hide(panel: HTMLElement): void {
    if (typeof panel.hidePopover === 'function' && panel.matches(':popover-open'))
      panel.hidePopover();
    panel.hidden = true;
  }

  position(anchor: HTMLElement, panel: HTMLElement, options: AnchoredPopoverOptions): void {
    positionAnchoredPopover(anchor, panel, options);
  }

  watch(
    onViewportChange: () => void,
    onOutsidePointer: (event: PointerEvent) => void,
    onEscape: (event: KeyboardEvent) => void,
  ): () => void {
    return watchAnchoredPopover(this.document, onViewportChange, onOutsidePointer, onEscape);
  }

  isFocusInside(panel: HTMLElement): boolean {
    return panel.contains(this.document.activeElement);
  }

  isFocused(element: HTMLElement): boolean {
    return this.document.activeElement === element;
  }

  isOffscreen(element: HTMLElement): boolean {
    const view = this.document.defaultView;
    if (!view) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.right < 0 ||
      rect.left > view.innerWidth ||
      rect.bottom < 0 ||
      rect.top > view.innerHeight
    );
  }
}
