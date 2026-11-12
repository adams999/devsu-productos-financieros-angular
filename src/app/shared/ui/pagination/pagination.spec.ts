import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Pagination] }));

  it('keeps page navigation within bounds and emits selected page size', async () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageCount', 2);
    fixture.componentRef.setInput('pageSize', 5);
    fixture.componentRef.setInput('pageSizes', [5, 10, 20]);
    const pageChange = vi.fn();
    const pageSizeChange = vi.fn();
    fixture.componentInstance.pageChange.subscribe(pageChange);
    fixture.componentInstance.pageSizeChange.subscribe(pageSizeChange);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const previous = root.querySelector<HTMLButtonElement>('button[aria-label="Página anterior"]')!;
    const next = root.querySelector<HTMLButtonElement>('button[aria-label="Página siguiente"]')!;
    const select = root.querySelector<HTMLSelectElement>('select')!;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    expect(root.querySelector(`label[for="${select.id}"]`)).not.toBeNull();

    next.click();
    expect(pageChange).toHaveBeenCalledWith(2);
    select.value = '10';
    select.dispatchEvent(new Event('change'));
    expect(pageSizeChange).toHaveBeenCalledWith(10);

    fixture.componentRef.setInput('page', 2);
    await fixture.whenStable();
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });
});
