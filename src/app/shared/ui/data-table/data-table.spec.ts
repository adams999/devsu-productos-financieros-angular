import { TestBed } from '@angular/core/testing';
import { DataTable } from './data-table';

describe('DataTable', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [DataTable] }));

  it('shows loading before errors and exposes retry after loading ends', async () => {
    const fixture = TestBed.createComponent(DataTable);
    fixture.componentRef.setInput('ariaLabel', 'Listado de ejemplo');
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', 'Fallo temporal');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('table')).not.toBeNull();
    expect(root.querySelector('[role="region"]')?.getAttribute('aria-label')).toBe(
      'Listado de ejemplo',
    );
    expect(root.querySelector('[role="status"]')?.textContent).toContain('Cargando');
    expect(root.querySelector('[role="alert"]')).toBeNull();

    fixture.componentRef.setInput('loading', false);
    await fixture.whenStable();
    expect(root.querySelector('[role="status"]')).toBeNull();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Fallo temporal');
    root.querySelector<HTMLButtonElement>('.feedback button')!.click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
