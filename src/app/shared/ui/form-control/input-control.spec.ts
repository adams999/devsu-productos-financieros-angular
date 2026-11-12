import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { InputControlField } from './input-control';

@Component({
  imports: [InputControlField],
  template: `<app-input-control
    controlId="test-value"
    label="Valor"
    [field]="fields.value"
    [type]="type()"
    autocomplete="off"
    inputMode="text"
    hint="Escribe un valor"
    [status]="status()"
    (valueInput)="inputs.push($event)"
  />`,
})
class InputHost {
  readonly model = signal({ value: '' });
  readonly fields = form(this.model, (path) => {
    required(path.value, { message: 'El valor es obligatorio.' });
  });
  readonly type = signal('text');
  readonly status = signal<string | undefined>(undefined);
  readonly inputs: string[] = [];
}

describe('InputControlField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InputHost] }).compileComponents();
  });

  it('binds native input changes and exposes validation to assistive technology', async () => {
    const fixture = TestBed.createComponent(InputHost);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('#test-value')!;

    expect(root.querySelector('label[for="test-value"]')?.textContent).toBe('Valor');
    expect(input.getAttribute('aria-describedby')).toBe('test-value-hint');
    expect(root.querySelector('#test-value-error')).toBeNull();

    input.value = 'Visa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.model().value).toBe('Visa');
    expect(fixture.componentInstance.inputs).toEqual(['Visa']);

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('test-value-hint test-value-error');
    expect(root.querySelector('#test-value-error')?.textContent).toContain('obligatorio');
  });

  it('supports a native date input and links its status message', async () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.componentInstance.type.set('date');
    fixture.componentInstance.status.set('Comprobando fecha');
    fixture.componentInstance.model.set({ value: '2027-01-01' });
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('#test-value')!;
    expect(input.type).toBe('date');
    expect(input.value).toBe('2027-01-01');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('aria-describedby')).toBe('test-value-hint test-value-status');
    expect(root.querySelector('[role="status"]')?.textContent).toBe('Comprobando fecha');
  });
});
