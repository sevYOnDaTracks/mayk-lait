import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

type AccountMode = 'login' | 'register';

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './account-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly mode = toSignal(
    this.route.data.pipe(map((data) => data['mode'] as AccountMode)),
    { initialValue: 'login' as AccountMode },
  );

  protected submitLogin(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    void this.router.navigateByUrl('/commande');
  }

  protected submitRegistration(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    void this.router.navigateByUrl('/connexion');
  }
}
