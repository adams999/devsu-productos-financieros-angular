import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FormControlFieldBase } from './form-control-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  selector: 'app-input-control',
  styleUrl: './form-control.scss',
  templateUrl: './input-control.html',
})
export class InputControlField extends FormControlFieldBase {
  readonly type = input('text');
  readonly autocomplete = input<string>();
  readonly inputMode = input<string>();
}
