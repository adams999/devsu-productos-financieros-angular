import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FormControlFieldBase } from './form-control-base';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  selector: 'app-textarea-control',
  styleUrl: './form-control.scss',
  templateUrl: './textarea-control.html',
})
export class TextareaControlField extends FormControlFieldBase {
  readonly rows = input(1);
  readonly allowResize = input(false);
}
