import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { SelectControlField } from './select-control';

@Component({
  imports: [SelectControlField],
  template: `<app-select-control
    controlId="choice"
    label="Producto"
    [field]="fields.choice"
    [options]="options"
  />`,
})
class SelectHost {
  readonly model = signal({ choice: 'first' });
  readonly fields = form(this.model);
  readonly options = [
    { value: 'first', label: 'Primero' },
    { value: 'second', label: 'Segundo' },
  ];
}

describe('SelectControlField', () => {
  it('keeps the native select bound to the signal form model', async () => {
    await TestBed.configureTestingModule({ imports: [SelectHost] }).compileComponents();
    const fixture = TestBed.createComponent(SelectHost);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector<HTMLSelectElement>('#choice')!;
    expect(select.value).toBe('first');
    expect(root.querySelector('label[for="choice"]')?.textContent).toBe('Producto');

    select.value = 'second';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.model().choice).toBe('second');
  });
});
