import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { CustomerAdminService } from '../core/customer-admin.service';
import { AppUser, Role } from '../core/models';

@Component({
  selector: 'app-admin-customers',
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  template: ` <section class="admin-page customers-admin">
    <div class="admin-title">
      <div>
        <p class="eyebrow">BASE CLIENTS</p>
        <h1>Clients</h1>
        <p>{{ customers.customers().length }} compte(s) enregistré(s)</p>
      </div>
      <button class="button" (click)="openCreate()">Ajouter un client</button>
    </div>
    <div class="customer-toolbar">
      <label class="customer-search"
        ><svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" /></svg
        ><input
          type="search"
          placeholder="Rechercher un nom, email ou téléphone"
          [value]="search()"
          (input)="search.set($any($event.target).value)" /></label
      ><select
        [ngModel]="roleFilter()"
        (ngModelChange)="roleFilter.set($event)"
        aria-label="Filtrer par rôle"
      >
        <option value="all">Tous les rôles</option>
        <option value="customer">Clients</option>
        <option value="admin">Administrateurs</option></select
      ><select
        [ngModel]="statusFilter()"
        (ngModelChange)="statusFilter.set($event)"
        aria-label="Filtrer par statut"
      >
        <option value="all">Tous les statuts</option>
        <option value="active">Actifs</option>
        <option value="disabled">Désactivés</option>
      </select>
    </div>
    @if (customers.loading()) {
      <div class="admin-empty"><p>Chargement des clients…</p></div>
    } @else if (customers.error()) {
      <p class="form-error">{{ customers.error() }}</p>
    } @else if (!filtered().length) {
      <div class="admin-empty">
        <h2>Aucun client trouvé.</h2>
        <p>
          {{ search() ? 'Essaie une autre recherche.' : 'Les nouveaux comptes apparaîtront ici.' }}
        </p>
      </div>
    } @else {
      <div class="customer-table">
        <div class="customer-row customer-head">
          <span>Client</span><span>Contact</span><span>Statut</span><span>Rôle</span
          ><span>Inscription</span><span></span>
        </div>
        @for (customer of filtered(); track customer.uid) {
          <button class="customer-row" (click)="openEdit(customer)">
            <span class="customer-identity"
              >@if (customer.photoURL) {
                <img [src]="customer.photoURL" alt="" />
              } @else {
                <i>{{ initials(customer) }}</i>
              }<span
                ><strong>{{ fullName(customer) }}</strong
                ><small>{{ customer.uid }}</small></span
              ></span
            ><span class="customer-contact"
              ><strong>{{ customer.email }}</strong
              ><small>{{ customer.phone || 'Téléphone non renseigné' }}</small></span
            ><span
              ><b class="customer-status" [class.disabled]="customer.disabled">{{
                customer.disabled ? 'Désactivé' : 'Actif'
              }}</b></span
            ><span
              ><b class="role-badge" [class.admin]="customer.role === 'admin'">{{
                customer.role === 'admin' ? 'Admin' : 'Client'
              }}</b></span
            ><span>{{ createdDate(customer) | date: 'dd MMM yyyy' }}</span
            ><span class="row-arrow">→</span>
          </button>
        }
      </div>
    }
    @if (drawerOpen()) {
      <div class="customer-drawer-backdrop" (click)="closeDrawer()"></div>
      <aside class="customer-drawer" role="dialog" aria-modal="true">
        <div class="drawer-head">
          <div>
            <p class="eyebrow">{{ creating() ? 'NOUVEAU CLIENT' : 'FICHE CLIENT' }}</p>
            <h2>{{ creating() ? 'Créer un compte' : fullName(selected()) }}</h2>
          </div>
          <button class="icon-button" (click)="closeDrawer()" aria-label="Fermer">×</button>
        </div>
        @if (creating()) {
          <form [formGroup]="createForm" (ngSubmit)="createCustomer()">
            <p class="drawer-note">
              Un compte Firebase Authentication sera créé. Communique ensuite le mot de passe
              temporaire au client de manière sécurisée.
            </p>
            <div class="form-row">
              <label>Prénom *<input formControlName="firstName" /></label
              ><label>Nom *<input formControlName="lastName" /></label>
            </div>
            <label>Email *<input type="email" formControlName="email" /></label
            ><label>Téléphone *<input type="tel" formControlName="phone" /></label
            ><label
              >Mot de passe temporaire *<input
                type="password"
                formControlName="password"
                minlength="6" /></label
            ><label>Date de naissance<input type="date" formControlName="birthDate" /></label>
            @if (actionError()) {
              <p class="form-error">{{ actionError() }}</p>
            }
            <button class="button full" [disabled]="createForm.invalid || saving()">
              {{ saving() ? 'Création…' : 'Créer le client' }}
            </button>
          </form>
        } @else if (selected(); as customer) {
          <div class="customer-profile-head">
            <span
              >@if (customer.photoURL) {
                <img [src]="customer.photoURL" alt="Photo de profil" />
              } @else {
                {{ initials(customer) }}
              }</span
            >
            <div>
              <h3>{{ fullName(customer) }}</h3>
              <p>{{ customer.email }}</p>
            </div>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="saveCustomer()">
            <div class="form-row">
              <label>Prénom *<input formControlName="firstName" /></label
              ><label>Nom *<input formControlName="lastName" /></label>
            </div>
            <label>Email Firebase<input [value]="customer.email" disabled /></label
            ><label>Téléphone<input type="tel" formControlName="phone" /></label
            ><label>Date de naissance<input type="date" formControlName="birthDate" /></label
            ><label
              >Rôle<select
                formControlName="role"
                [attr.disabled]="customer.uid === auth.user()?.uid ? true : null"
              >
                <option value="customer">Client</option>
                <option value="admin">Administrateur</option>
              </select></label
            >
            <div class="form-row">
              <label>Allergies<textarea rows="3" formControlName="allergies"></textarea></label
              ><label
                >Intolérances<textarea rows="3" formControlName="intolerances"></textarea>
              </label>
            </div>
            @if (actionError()) {
              <p class="form-error">{{ actionError() }}</p>
            }
            <button class="button full" [disabled]="editForm.invalid || saving()">
              {{ saving() ? 'Enregistrement…' : 'Enregistrer les modifications' }}
            </button>
          </form>
          <div class="customer-danger">
            <div>
              <strong>{{
                customer.disabled ? 'Réactiver ce compte' : 'Désactiver ce compte'
              }}</strong>
              <p>
                {{
                  customer.disabled
                    ? 'Le client pourra de nouveau accéder à MAYKLAIT.'
                    : 'Le client sera bloqué lors de sa prochaine authentification.'
                }}
              </p>
            </div>
            <button
              class="button ghost"
              [disabled]="customer.uid === auth.user()?.uid || saving()"
              (click)="toggleDisabled(customer)"
            >
              {{ customer.disabled ? 'Réactiver' : 'Désactiver' }}
            </button>
          </div>
          <p class="auth-delete-note">
            La suppression définitive du compte Firebase Auth nécessite une fonction serveur
            utilisant Firebase Admin SDK.
          </p>
        }
      </aside>
    }
  </section>`,
})
export class AdminCustomersComponent {
  readonly customers = inject(CustomerAdminService);
  readonly auth = inject(AuthService);
  private fb = inject(FormBuilder);
  readonly search = signal('');
  readonly roleFilter = signal<'all' | Role>('all');
  readonly statusFilter = signal<'all' | 'active' | 'disabled'>('all');
  readonly drawerOpen = signal(false);
  readonly creating = signal(false);
  readonly selected = signal<AppUser | null>(null);
  readonly saving = signal(false);
  readonly actionError = signal('');
  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.customers
      .customers()
      .filter(
        (user) =>
          (this.roleFilter() === 'all' || user.role === this.roleFilter()) &&
          (this.statusFilter() === 'all' ||
            (this.statusFilter() === 'disabled') === !!user.disabled) &&
          (!term ||
            `${user.firstName} ${user.lastName} ${user.email} ${user.phone}`
              .toLowerCase()
              .includes(term)),
      );
  });
  readonly createForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    birthDate: [''],
  });
  readonly editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    birthDate: [''],
    role: ['customer' as Role, Validators.required],
    allergies: [''],
    intolerances: [''],
  });
  fullName(user: AppUser | null) {
    return user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Profil incomplet'
      : '';
  }
  initials(user: AppUser) {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  }
  createdDate(user: AppUser) {
    const value = user.createdAt as any;
    return value?.toDate?.() ?? null;
  }
  openCreate() {
    this.creating.set(true);
    this.selected.set(null);
    this.createForm.reset();
    this.actionError.set('');
    this.drawerOpen.set(true);
  }
  openEdit(user: AppUser) {
    this.creating.set(false);
    this.selected.set(user);
    this.editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      birthDate: user.birthDate ?? '',
      role: user.role,
      allergies: user.allergies?.join(', ') ?? '',
      intolerances: user.intolerances?.join(', ') ?? '',
    });
    this.actionError.set('');
    this.drawerOpen.set(true);
  }
  closeDrawer() {
    this.drawerOpen.set(false);
    this.actionError.set('');
  }
  async createCustomer() {
    if (this.createForm.invalid) return;
    this.saving.set(true);
    this.actionError.set('');
    const value = this.createForm.getRawValue();
    try {
      await this.customers.create({
        firstName: value.firstName ?? '',
        lastName: value.lastName ?? '',
        email: value.email ?? '',
        phone: value.phone ?? '',
        password: value.password ?? '',
        birthDate: value.birthDate ?? undefined,
      });
      this.closeDrawer();
    } catch (error: any) {
      this.actionError.set(
        error?.code === 'auth/email-already-in-use'
          ? 'Cette adresse email possède déjà un compte.'
          : 'Impossible de créer ce client.',
      );
    } finally {
      this.saving.set(false);
    }
  }
  async saveCustomer() {
    const user = this.selected();
    if (!user || this.editForm.invalid) return;
    this.saving.set(true);
    const value = this.editForm.getRawValue();
    try {
      await this.customers.update(user.uid, {
        firstName: value.firstName ?? '',
        lastName: value.lastName ?? '',
        phone: value.phone ?? '',
        birthDate: value.birthDate ?? undefined,
        role: value.role ?? 'customer',
        allergies: this.lines(value.allergies),
        intolerances: this.lines(value.intolerances),
      });
      this.closeDrawer();
    } catch {
      this.actionError.set('Impossible d’enregistrer les modifications.');
    } finally {
      this.saving.set(false);
    }
  }
  async toggleDisabled(user: AppUser) {
    if (user.uid === this.auth.user()?.uid) return;
    this.saving.set(true);
    try {
      await this.customers.setDisabled(user.uid, !user.disabled);
      this.closeDrawer();
    } catch {
      this.actionError.set('Impossible de modifier ce compte.');
    } finally {
      this.saving.set(false);
    }
  }
  private lines(value: string | null) {
    return (value ?? '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
