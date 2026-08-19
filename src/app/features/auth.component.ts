import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-intro">
        <a routerLink="/" class="brand">MAYKLAIT</a>
        <div>
          <p class="eyebrow">{{ mode() === 'verify' ? 'SÉCURITÉ' : 'BON RETOUR' }}</p>
          <h1>{{ title() }}</h1>
          <p>{{ mode() === 'verify' ? 'Un clic, puis tu peux commander.' : 'Quelques secondes, puis ton dêguê.' }}</p>
        </div>
      </div>

      <div class="auth-form">
        @if (mode() === 'verify') {
          <section class="email-verification" aria-live="polite">
            <div class="email-verification-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M3 6.5 12 13l9-6.5M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
            </div>
            <p class="eyebrow">VÉRIFICATION EMAIL</p>
            <h2>Consulte ta boîte mail.</h2>
            <p>Nous avons envoyé un lien à <strong>{{ auth.user()?.email }}</strong>. Tu devras vérifier cette adresse avant de confirmer une commande.</p>
            @if (success()) { <p class="success">Un nouveau lien vient d’être envoyé.</p> }
            @if (error()) { <p class="form-error">{{ error() }}</p> }
            <div class="verification-actions">
              <button type="button" class="button full" (click)="checkVerification()" [disabled]="busy()">{{ busy() ? 'Vérification…' : 'J’ai vérifié mon email' }}</button>
              <button type="button" class="text-button" (click)="resendVerification()" [disabled]="busy()">Renvoyer le lien</button>
              <button type="button" class="text-button muted" (click)="continueToAccount()">Compléter mon profil maintenant</button>
            </div>
          </section>
        } @else {
          <div class="auth-switch">
            <button (click)="setMode('login')" [class.active]="mode() === 'login'">Connexion</button>
            <button (click)="setMode('register')" [class.active]="mode() === 'register'">Inscription</button>
          </div>

          @if (mode() === 'forgot') {
            <form [formGroup]="form" (ngSubmit)="reset()">
              <label>Email<input type="email" formControlName="email" autocomplete="email"></label>
              @if (error()) { <p class="form-error">{{ error() }}</p> }
              <button class="button full" [disabled]="busy() || form.controls.email.invalid">{{ busy() ? 'Envoi…' : 'Recevoir le lien' }}</button>
              @if (success()) { <p class="success">Le lien de réinitialisation a été envoyé. Pense à vérifier tes courriers indésirables.</p> }
              <button type="button" class="text-button" (click)="setMode('login')">Retour à la connexion</button>
            </form>
          } @else {
            <button type="button" class="google-button" (click)="google()" [disabled]="busy()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>
              <span>Continuer avec Google</span>
            </button>
            <div class="auth-divider"><span>ou</span></div>
            <form [formGroup]="form" (ngSubmit)="submit()">
              @if (mode() === 'register') {
                <div class="form-row"><label>Prénom *<input formControlName="firstName" autocomplete="given-name"></label><label>Nom *<input formControlName="lastName" autocomplete="family-name"></label></div>
                <label>Téléphone *<input type="tel" formControlName="phone" autocomplete="tel"></label>
              }
              <label>Email *<input type="email" formControlName="email" autocomplete="email"></label>
              <label>Mot de passe *<input type="password" formControlName="password" [attr.autocomplete]="mode() === 'register' ? 'new-password' : 'current-password'"></label>
              @if (mode() === 'register') {
                <label>Confirmation *<input type="password" formControlName="confirm" autocomplete="new-password"></label>
                <label>Date de naissance <input type="date" formControlName="birthDate"></label>
                <label class="checkbox"><input type="checkbox" formControlName="terms"> J’accepte les conditions générales.</label>
              }
              @if (error()) { <p class="form-error">{{ error() }}</p> }
              <button class="button full" [disabled]="form.controls.email.invalid || form.controls.password.invalid || busy()">{{ busy() ? 'Patiente…' : mode() === 'register' ? 'Créer mon compte' : 'Se connecter' }}</button>
              @if (mode() === 'login') { <button type="button" class="text-button" (click)="setMode('forgot')">Mot de passe oublié ?</button> }
            </form>
          }
        }
      </div>
    </section>
  `
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly mode = signal<AuthMode>(this.route.snapshot.url[0]?.path === 'inscription' ? 'register' : 'login');
  readonly success = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    firstName: [''], lastName: [''], phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: [''], birthDate: [''], terms: [false]
  });

  title() {
    return this.mode() === 'register' ? 'Crée ton compte.' : this.mode() === 'forgot' ? 'Retrouve ton accès.' : this.mode() === 'verify' ? 'Vérifie ton email.' : 'Content de te revoir.';
  }

  setMode(mode: AuthMode) { this.mode.set(mode); this.error.set(''); this.success.set(false); }
  private destination() { return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/compte'; }

  async google() {
    this.busy.set(true); this.error.set('');
    try { await this.auth.signInWithGoogle(); await this.router.navigateByUrl(this.destination()); }
    catch (error: any) { if (error?.code !== 'auth/popup-closed-by-user') this.error.set('Connexion Google impossible. Réessaie dans un instant.'); }
    finally { this.busy.set(false); }
  }

  async submit() {
    if (this.form.controls.email.invalid || this.form.controls.password.invalid) return;
    this.error.set('');
    const value = this.form.getRawValue();
    if (this.mode() === 'register') {
      if (!value.firstName?.trim() || !value.lastName?.trim() || !value.phone?.trim()) { this.error.set('Renseigne ton prénom, ton nom et ton téléphone.'); return; }
      if (value.password !== value.confirm) { this.error.set('Les mots de passe ne correspondent pas.'); return; }
      if (!value.terms) { this.error.set('Tu dois accepter les conditions générales.'); return; }
    }
    this.busy.set(true);
    try {
      if (this.mode() === 'register') {
        await this.auth.signUp({ firstName: value.firstName ?? '', lastName: value.lastName ?? '', phone: value.phone ?? '', email: value.email ?? '', birthDate: value.birthDate ?? undefined, password: value.password ?? '' });
      } else {
        await this.auth.signIn(value.email ?? '', value.password ?? '');
      }
      if (this.auth.emailVerificationRequired()) this.setMode('verify');
      else await this.router.navigateByUrl(this.destination());
    } catch (error: any) {
      this.error.set(this.authError(error?.code));
    } finally { this.busy.set(false); }
  }

  async reset() {
    if (this.form.controls.email.invalid) return;
    this.busy.set(true); this.error.set(''); this.success.set(false);
    try { await this.auth.resetPassword(this.form.value.email ?? ''); this.success.set(true); }
    catch (error: any) { this.error.set(this.authError(error?.code)); }
    finally { this.busy.set(false); }
  }

  async resendVerification() {
    this.busy.set(true); this.error.set(''); this.success.set(false);
    try { await this.auth.sendVerificationEmail(); this.success.set(true); }
    catch (error: any) { this.error.set(error?.code === 'auth/too-many-requests' ? 'Trop de demandes. Attends quelques minutes avant de réessayer.' : 'Impossible de renvoyer le lien pour le moment.'); }
    finally { this.busy.set(false); }
  }

  async checkVerification() {
    this.busy.set(true); this.error.set('');
    try {
      if (await this.auth.refreshEmailVerification()) await this.router.navigateByUrl(this.destination());
      else this.error.set('L’adresse n’est pas encore vérifiée. Clique d’abord sur le lien reçu par email.');
    } catch { this.error.set('Impossible de vérifier le statut pour le moment.'); }
    finally { this.busy.set(false); }
  }

  continueToAccount() { void this.router.navigateByUrl('/compte'); }

  private authError(code?: string) {
    if (code === 'auth/email-already-in-use') return 'Cette adresse email possède déjà un compte.';
    if (code === 'auth/invalid-credential') return 'Email ou mot de passe incorrect.';
    if (code === 'auth/too-many-requests') return 'Trop de tentatives. Réessaie dans quelques minutes.';
    if (code === 'auth/weak-password') return 'Choisis un mot de passe d’au moins 6 caractères.';
    return 'Une erreur est survenue. Vérifie tes informations et réessaie.';
  }
}
