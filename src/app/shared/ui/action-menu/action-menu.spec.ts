import { TestBed } from '@angular/core/testing';
import { ActionMenu } from './action-menu';

describe('ActionMenu', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ActionMenu] }));

  it('opens the available actions and restores focus before selecting one', async () => {
    const fixture = TestBed.createComponent(ActionMenu);
    fixture.componentRef.setInput('label', 'Acciones para tarjeta');
    fixture.componentRef.setInput('actions', [
      { id: 'edit', label: 'Editar' },
      { id: 'delete', label: 'Eliminar', destructive: true, disabled: true },
    ]);
    const selected = vi.fn();
    fixture.componentInstance.actionSelected.subscribe(selected);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector<HTMLButtonElement>('.action-menu-trigger')!;
    const panel = root.querySelector<HTMLDivElement>('.action-menu-panel')!;
    trigger.click();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(false);
    expect(document.activeElement?.textContent?.trim()).toBe('Editar');
    expect(panel.querySelector<HTMLButtonElement>('.danger-action')?.disabled).toBe(true);

    panel.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(selected).toHaveBeenCalledExactlyOnceWith('edit');
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape or outside interaction while keeping position on scroll', async () => {
    const fixture = TestBed.createComponent(ActionMenu);
    fixture.componentRef.setInput('label', 'Acciones');
    fixture.componentRef.setInput('actions', [{ id: 'edit', label: 'Editar' }]);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector<HTMLButtonElement>('.action-menu-trigger')!;
    const panel = root.querySelector<HTMLDivElement>('.action-menu-panel')!;
    trigger.click();
    window.dispatchEvent(new Event('scroll'));
    expect(panel.hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
