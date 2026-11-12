import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FormControlFieldBase } from './form-control-base';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  selector: 'app-select-control',
  styleUrl: './form-control.scss',
  templateUrl: './select-control.html',
})
export class SelectControlField extends FormControlFieldBase {
  readonly options = input<readonly SelectOption[]>([]);
}
