import { TestBed } from '@angular/core/testing';
import { InfoTooltip } from './info-tooltip';

describe('InfoTooltip', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [InfoTooltip] }));

  it('exposes a labelled tooltip on focus and hides it with Escape', async () => {
    const fixture = TestBed.createComponent(InfoTooltip);
    fixture.componentRef.setInput('label', 'Fecha de liberación');
    fixture.componentRef.setInput('text', 'Fecha desde la que está disponible.');
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector<HTMLButtonElement>('button')!;
    const panel = root.querySelector<HTMLDivElement>('[role="tooltip"]')!;
    expect(trigger.getAttribute('aria-label')).toBe('Información sobre Fecha de liberación');
    expect(panel.hidden).toBe(true);

    trigger.focus();
    await fixture.whenStable();
    expect(panel.hidden).toBe(false);
    expect(trigger.getAttribute('aria-describedby')).toBe(panel.id);
    expect(panel.textContent).toContain('Fecha desde la que está disponible.');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    fixture.destroy();
  });
});
