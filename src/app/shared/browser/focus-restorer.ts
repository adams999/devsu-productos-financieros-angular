import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusRestorer {
  private readonly document = inject(DOCUMENT);

  capture(): HTMLElement | undefined {
    const active = this.document.activeElement;
    return active && 'focus' in active ? (active as HTMLElement) : undefined;
  }

  restore(trigger: HTMLElement | undefined, fallbackSelector: string): void {
    this.document.defaultView?.setTimeout(() => {
      if (trigger?.isConnected) trigger.focus();
      else this.document.querySelector<HTMLElement>(fallbackSelector)?.focus();
    }, 0);
  }
}
