import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  protected readonly sent = signal(false);

  protected submit(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.sent.set(true);
    form.resetForm();
  }
}
