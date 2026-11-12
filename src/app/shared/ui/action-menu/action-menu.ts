import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AnchoredPopoverController } from '@app/shared/utils/anchored-popover';
import type { ActionMenuItem } from './action-menu.models';

let nextMenuId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-action-menu',
  styleUrl: './action-menu.scss',
  templateUrl: './action-menu.html',
})
export class ActionMenu implements OnDestroy {
  readonly label = input.required<string>();
  readonly actions = input.required<readonly ActionMenuItem[]>();
  readonly actionSelected = output<string>();
  protected readonly open = signal(false);
  protected readonly panelId = `action-menu-${nextMenuId++}`;
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLDivElement>>('panel');
  private readonly popover = inject(AnchoredPopoverController);
  private stopWatching?: () => void;

  protected toggleMenu(): void {
    if (this.open()) {
      this.closeMenu();
      return;
    }

    const panel = this.panel().nativeElement;
    this.popover.show(panel);
    this.open.set(true);
    this.positionPanel();
    panel.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    this.stopWatching = this.popover.watch(
      this.onViewportChange,
      this.closeOnOutsidePointer,
      this.closeOnEscape,
    );
  }

  protected onSelect(id: string): void {
    this.closeMenu();
    this.trigger().nativeElement.focus({ preventScroll: true });
    this.actionSelected.emit(id);
  }

  protected onPopoverToggle(): void {
    const panel = this.panel().nativeElement;
    if (typeof panel.showPopover === 'function' && !panel.matches(':popover-open')) {
      this.finishClose();
      if (this.popover.isFocusInside(panel))
        this.trigger().nativeElement.focus({ preventScroll: true });
    }
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }

  private positionPanel(): void {
    this.popover.position(this.trigger().nativeElement, this.panel().nativeElement, {
      horizontal: 'end',
      gap: 4,
    });
  }

  private closeMenu(): void {
    if (!this.open()) return;
    this.popover.hide(this.panel().nativeElement);
    this.finishClose();
  }

  private finishClose(): void {
    this.open.set(false);
    this.panel().nativeElement.hidden = true;
    this.stopWatching?.();
    this.stopWatching = undefined;
  }

  private readonly onViewportChange = (): void => {
    if (!this.open()) return;
    if (this.popover.isOffscreen(this.trigger().nativeElement)) this.closeMenu();
    else this.positionPanel();
  };
  private readonly closeOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeMenu();
      this.trigger().nativeElement.focus({ preventScroll: true });
    }
  };
  private readonly closeOnOutsidePointer = (event: PointerEvent): void => {
    if (
      !this.trigger().nativeElement.contains(event.target as Node) &&
      !this.panel().nativeElement.contains(event.target as Node)
    )
      this.closeMenu();
  };
}
