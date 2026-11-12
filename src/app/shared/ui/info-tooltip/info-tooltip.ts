import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { AnchoredPopoverController } from '@app/shared/utils/anchored-popover';

let nextTooltipId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-info-tooltip',
  styleUrl: './info-tooltip.scss',
  templateUrl: './info-tooltip.html',
})
export class InfoTooltip implements OnDestroy {
  readonly label = input.required<string>();
  readonly text = input.required<string>();
  protected readonly tooltipId = `info-tooltip-${nextTooltipId++}`;
  protected readonly open = signal(false);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLDivElement>>('panel');
  private readonly popover = inject(AnchoredPopoverController);
  private hovered = false;
  private stopWatching?: () => void;

  protected show(): void {
    if (this.open()) return;
    const panel = this.panel().nativeElement;
    this.popover.show(panel);
    this.open.set(true);
    this.positionPanel();
    this.stopWatching = this.popover.watch(
      this.positionOnViewportChange,
      this.closeOnOutsidePointer,
      this.closeOnEscape,
    );
  }

  protected onMouseEnter(): void {
    this.hovered = true;
    this.show();
  }

  protected onMouseLeave(): void {
    this.hovered = false;
    if (!this.popover.isFocused(this.trigger().nativeElement)) this.hide();
  }

  protected onBlur(): void {
    if (!this.hovered) this.hide();
  }

  protected hide(): void {
    if (!this.open()) return;
    this.popover.hide(this.panel().nativeElement);
    this.open.set(false);
    this.removeListeners();
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }

  private positionPanel(): void {
    this.popover.position(this.trigger().nativeElement, this.panel().nativeElement, {
      horizontal: 'center',
      gap: 6,
    });
  }

  private removeListeners(): void {
    this.stopWatching?.();
    this.stopWatching = undefined;
  }

  private readonly positionOnViewportChange = (): void => {
    if (this.open()) this.positionPanel();
  };
  private readonly closeOnOutsidePointer = (event: PointerEvent): void => {
    if (!this.trigger().nativeElement.contains(event.target as Node)) this.hide();
  };
  private readonly closeOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.hide();
  };
}
