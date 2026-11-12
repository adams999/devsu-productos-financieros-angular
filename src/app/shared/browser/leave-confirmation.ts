import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

export const LEAVE_CONFIRMATION = new InjectionToken<(message: string) => boolean>(
  'LeaveConfirmation',
  {
    providedIn: 'root',
    factory: () => {
      const view = inject(DOCUMENT).defaultView;
      return (message) => view?.confirm(message) ?? true;
    },
  },
);
