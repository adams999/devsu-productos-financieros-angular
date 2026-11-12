import { TestBed } from '@angular/core/testing';
import { SearchField } from './search-field';

describe('SearchField', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SearchField] }));
  afterEach(() => vi.useRealTimers());

  it('emits only the latest text after 500 ms while keeping typing visible', async () => {
    const fixture = TestBed.createComponent(SearchField);
    fixture.componentRef.setInput('controlId', 'search');
    fixture.componentRef.setInput('label', 'Buscar');
    fixture.componentRef.setInput('debounceMs', 500);
    await fixture.whenStable();

    const emitted = vi.fn();
    fixture.componentInstance.valueInput.subscribe(emitted);
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    vi.useFakeTimers();
    input.value = 'visa';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(250);
    input.value = 'visa signature';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('visa signature');
    vi.advanceTimersByTime(499);
    expect(emitted).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(emitted).toHaveBeenCalledExactlyOnceWith('visa signature');
    fixture.destroy();
  });

  it('cancels a pending search when the component is destroyed', async () => {
    const fixture = TestBed.createComponent(SearchField);
    fixture.componentRef.setInput('controlId', 'search');
    fixture.componentRef.setInput('label', 'Buscar');
    fixture.componentRef.setInput('debounceMs', 500);
    await fixture.whenStable();

    const emitted = vi.fn();
    fixture.componentInstance.valueInput.subscribe(emitted);
    vi.useFakeTimers();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    input.value = 'visa';
    input.dispatchEvent(new Event('input'));
    fixture.destroy();
    vi.advanceTimersByTime(500);
    expect(emitted).not.toHaveBeenCalled();
  });
});
