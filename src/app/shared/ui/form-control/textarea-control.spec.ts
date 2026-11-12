import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { TextareaControlField } from './textarea-control';

@Component({
  imports: [TextareaControlField],
  template: `<app-textarea-control
    controlId="test-description"
    label="Descripción"
    [field]="fields.description"
    [rows]="4"
    [allowResize]="true"
    (valueInput)="inputs.push($event)"
  />`,
})
class TextareaHost {
  readonly model = signal({ description: '' });
  readonly fields = form(this.model, (path) => {
    required(path.description, { message: 'La descripción es obligatoria.' });
  });
  readonly inputs: string[] = [];
}

describe('TextareaControlField', () => {
  it('binds multiline input and shows a linked error after an invalid edit', async () => {
    await TestBed.configureTestingModule({ imports: [TextareaHost] }).compileComponents();
    const fixture = TestBed.createComponent(TextareaHost);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const textarea = root.querySelector<HTMLTextAreaElement>('#test-description')!;

    expect(root.querySelector('label[for="test-description"]')?.textContent).toBe('Descripción');
    expect(textarea.rows).toBe(4);
    expect(textarea.classList.contains('resizable')).toBe(true);
    expect(root.querySelector('#test-description-error')).toBeNull();

    textarea.value = 'Primera línea\nSegunda línea';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.model().description).toBe('Primera línea\nSegunda línea');
    expect(fixture.componentInstance.inputs).toEqual(['Primera línea\nSegunda línea']);

    textarea.value = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe('test-description-error');
    expect(root.querySelector('#test-description-error')?.textContent).toContain('obligatoria');
  });
});
