import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '@app/core/notifications/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-outlet',
  styleUrl: './toast-outlet.scss',
  templateUrl: './toast-outlet.html',
})
export class ToastOutlet {
  protected readonly toast = inject(ToastService);
}
