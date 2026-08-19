import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Promotion, PromotionAdminService, PromotionInput, PromotionType } from '../core/promotion-admin.service';

@Component({
  selector: 'app-admin-promotions',
  imports: [CurrencyPipe, ReactiveFormsModule],
  template: `
    <section class="admin-page promotions-admin">
      <div class="admin-title">
        <div><p class="eyebrow">AVANTAGES CLIENTS</p><h1>Codes promo</h1></div>
        <button class="button" (click)="openNew()">+ Nouveau code</button>
      </div>

      @if (promotions.loading()) {
        <div class="admin-empty"><p>Chargement des codes…</p></div>
      } @else if (promotions.error()) {
        <p class="form-error">{{ promotions.error() }}</p>
      } @else if (!promotions.promotions().length) {
        <div class="admin-empty promo-empty"><h2>Aucun code promo.</h2><p>Crée ton premier avantage client.</p><button class="button" (click)="openNew()">Créer un code</button></div>
      } @else {
        <div class="promotion-list">
          @for (promotion of promotions.promotions(); track promotion.id) {
            <article>
              <div class="promotion-code"><small>CODE</small><strong>{{ promotion.code }}</strong></div>
              <div><small>RÉDUCTION</small><strong>{{ promotion.type === 'percentage' ? promotion.value + ' %' : (promotion.value | currency:'EUR':'symbol':'1.2-2':'fr') }}</strong></div>
              <div><small>COMMANDE MINIMUM</small><strong>{{ promotion.minimumAmount || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></div>
              <div><small>UTILISATIONS</small><strong>{{ promotion.usedCount || 0 }}{{ promotion.maxUses ? ' / ' + promotion.maxUses : '' }}</strong></div>
              <div><small>VALIDITÉ</small><strong>{{ validity(promotion) }}</strong></div>
              <span class="promotion-status" [class.inactive]="!promotion.active">{{ promotion.active ? 'ACTIF' : 'INACTIF' }}</span>
              <button class="icon-button promotion-edit" (click)="edit(promotion)" aria-label="Modifier le code promo">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></svg>
              </button>
            </article>
          }
        </div>
      }

      @if (editorOpen()) {
        <div class="customer-drawer-backdrop" (click)="close()"></div>
        <aside class="customer-drawer promo-editor" role="dialog" aria-modal="true" aria-labelledby="promo-editor-title">
          <div class="drawer-head">
            <div><p class="eyebrow">{{ editingId() ? 'MODIFICATION' : 'NOUVEL AVANTAGE' }}</p><h2 id="promo-editor-title">{{ editingId() || 'Créer un code promo' }}</h2></div>
            <button class="icon-button" (click)="close()" aria-label="Fermer">×</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <label>Code *<input formControlName="code" placeholder="BIENVENUE10" [attr.disabled]="editingId() ? true : null" class="promo-code-input"></label>
            <div class="form-row">
              <label>Type de réduction *<select formControlName="type"><option value="percentage">Pourcentage (%)</option><option value="fixed">Montant fixe (€)</option></select></label>
              <label>Valeur *<input formControlName="value" type="number" min="0.01" step="0.01"></label>
            </div>
            <div class="form-row">
              <label>Commande minimum (€)<input formControlName="minimumAmount" type="number" min="0" step="0.01"></label>
              <label>Nombre maximal d’utilisations<input formControlName="maxUses" type="number" min="1" step="1" placeholder="Illimité"></label>
            </div>
            <div class="form-row">
              <label>Valable à partir du<input formControlName="startsAt" type="date"></label>
              <label>Valable jusqu’au<input formControlName="endsAt" type="date"></label>
            </div>
            <label class="checkbox"><input formControlName="active" type="checkbox"> Code actif et utilisable</label>
            @if (message()) { <p class="form-error">{{ message() }}</p> }
            <div class="promo-editor-actions">
              @if (editingId()) { <button type="button" class="text-button danger" (click)="remove()">Supprimer</button> }
              <button class="button" [disabled]="form.invalid || saving()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
            </div>
          </form>
        </aside>
      }
    </section>
  `
})
export class AdminPromotionsComponent {
  readonly promotions = inject(PromotionAdminService);
  private fb = inject(FormBuilder);
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{3,30}$/)]],
    type: ['percentage' as PromotionType, Validators.required],
    value: [10, [Validators.required, Validators.min(0.01)]],
    minimumAmount: [0, Validators.min(0)],
    maxUses: [null as number | null, Validators.min(1)],
    startsAt: [''],
    endsAt: [''],
    active: [true]
  });

  openNew() {
    this.editingId.set(null);
    this.form.reset({ code: '', type: 'percentage', value: 10, minimumAmount: 0, maxUses: null, startsAt: '', endsAt: '', active: true });
    this.message.set('');
    this.editorOpen.set(true);
  }

  edit(promotion: Promotion) {
    this.editingId.set(promotion.id);
    this.form.reset({
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      minimumAmount: promotion.minimumAmount ?? 0,
      maxUses: promotion.maxUses ?? null,
      startsAt: this.dateInput(promotion.startsAt),
      endsAt: this.dateInput(promotion.endsAt),
      active: promotion.active
    });
    this.message.set('');
    this.editorOpen.set(true);
  }

  close() {
    this.editorOpen.set(false);
    this.message.set('');
  }

  async save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set('');
    const value = this.form.getRawValue();
    if (value.type === 'percentage' && Number(value.value) > 100) {
      this.message.set('Un pourcentage ne peut pas dépasser 100 %.');
      this.saving.set(false);
      return;
    }
    if (value.startsAt && value.endsAt && value.startsAt > value.endsAt) {
      this.message.set('La date de fin doit être postérieure à la date de début.');
      this.saving.set(false);
      return;
    }
    const input: PromotionInput = {
      code: value.code ?? '',
      type: value.type ?? 'percentage',
      value: Number(value.value ?? 0),
      minimumAmount: Number(value.minimumAmount ?? 0),
      maxUses: value.maxUses ? Number(value.maxUses) : null,
      startsAt: value.startsAt ? new Date(`${value.startsAt}T00:00:00`) : null,
      endsAt: value.endsAt ? new Date(`${value.endsAt}T23:59:59.999`) : null,
      active: Boolean(value.active)
    };
    try {
      const id = this.editingId();
      if (id) await this.promotions.update(id, input);
      else await this.promotions.create(input);
      this.close();
    } catch (error: any) {
      this.message.set(error?.message ?? 'Impossible d’enregistrer ce code promo.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove() {
    const id = this.editingId();
    if (!id || !confirm(`Supprimer définitivement le code ${id} ?`)) return;
    this.saving.set(true);
    try {
      await this.promotions.remove(id);
      this.close();
    } catch {
      this.message.set('Impossible de supprimer ce code promo.');
    } finally {
      this.saving.set(false);
    }
  }

  validity(promotion: Promotion) {
    const start = promotion.startsAt?.toDate();
    const end = promotion.endsAt?.toDate();
    if (!start && !end) return 'Sans limite';
    if (start && end) return `${start.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`;
    return start ? `Dès le ${start.toLocaleDateString('fr-FR')}` : `Jusqu’au ${end?.toLocaleDateString('fr-FR')}`;
  }

  private dateInput(value?: { toDate(): Date } | null) {
    if (!value) return '';
    const date = value.toDate();
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
