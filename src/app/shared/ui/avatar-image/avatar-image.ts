import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { safeImageUrl } from '@app/shared/utils/safe-image-url';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-avatar-image',
  styleUrl: './avatar-image.scss',
  templateUrl: './avatar-image.html',
})
export class AvatarImage {
  readonly src = input<string>();
  readonly label = input.required<string>();
  readonly alt = input('');
  protected readonly imageUrl = computed(() => safeImageUrl(this.src() ?? ''));
  protected readonly initials = computed(() =>
    this.label()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join(''),
  );
  protected readonly failedUrl = signal<string | undefined>(undefined);

  protected onImageError(url: string): void {
    this.failedUrl.set(url);
  }
}
