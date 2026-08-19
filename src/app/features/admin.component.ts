import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { CatalogService, ProductInput } from '../core/catalog.service';
import { OrderStatus, Product } from '../core/models';
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<div class="admin-layout">
    <aside class="admin-sidebar">
      <a routerLink="/admin" class="brand brand-light">MAYKLAIT<span>ADMIN</span></a>
      <nav>
        <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active"
          >Dashboard</a
        ><a routerLink="/admin/orders" routerLinkActive="active">Commandes</a
        ><a routerLink="/admin/products" routerLinkActive="active">Produits</a
        ><a routerLink="/admin/clients" routerLinkActive="active">Clients</a
        ><a routerLink="/admin/promotions" routerLinkActive="active">Codes promo</a
        ><a routerLink="/admin/settings" routerLinkActive="active">Paramètres</a>
      </nav>
      <button (click)="logout()">Déconnexion</button>
    </aside>
    <main class="admin-main">
      <div class="admin-mobile-head">
        <a routerLink="/admin" class="brand">MAYKLAIT</a><span>ADMIN</span>
      </div>
      <router-outlet />
    </main>
  </div>`,
})
export class AdminShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  logout() {
    this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe],
  template: `<section class="admin-page">
    <div class="admin-title">
      <div>
        <p class="eyebrow">MARDI 18 AOÛT</p>
        <h1>Bonjour Yves.</h1>
      </div>
      <span>La cuisine est ouverte</span>
    </div>
    <div class="metrics">
      <article>
        <small>COMMANDES AUJOURD'HUI</small><strong>24</strong><span>+12% cette semaine</span>
      </article>
      <article>
        <small>CA AUJOURD'HUI</small
        ><strong>{{ 384.5 | currency: 'EUR' : 'symbol' : '1.0-0' : 'fr' }}</strong
        ><span>Objectif 500 €</span>
      </article>
      <article>
        <small>EN PRÉPARATION</small><strong>7</strong><span>À traiter maintenant</span>
      </article>
      <article><small>TERMINÉES</small><strong>15</strong><span>2 en livraison</span></article>
    </div>
    <div class="admin-section-head">
      <h2>Commandes récentes</h2>
      <a routerLink="/admin/orders">Tout voir →</a>
    </div>
    <div class="admin-table">
      <div class="table-row table-head">
        <span>Numéro</span><span>Client</span><span>Heure</span><span>Montant</span
        ><span>Statut</span>
      </div>
      @for (order of orders; track order.id) {
        <div class="table-row">
          <strong>#{{ order.id }}</strong
          ><span>{{ order.client }}</span
          ><span>{{ order.time }}</span
          ><strong>{{ order.total | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr' }}</strong
          ><span class="status" [class]="'status ' + order.status">{{ order.label }}</span>
        </div>
      }
    </div>
  </section>`,
})
export class AdminDashboardComponent {
  orders = [
    {
      id: 'MK1028',
      client: 'Mariame D.',
      time: '12:42',
      total: 18.5,
      status: 'preparing',
      label: 'En préparation',
    },
    {
      id: 'MK1027',
      client: 'Aïcha K.',
      time: '12:31',
      total: 12.9,
      status: 'confirmed',
      label: 'Confirmée',
    },
    { id: 'MK1026', client: 'Yves K.', time: '12:18', total: 24, status: 'ready', label: 'Prête' },
  ];
}
@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, CurrencyPipe],
  template: `<section class="admin-page">
    <div class="admin-title">
      <div>
        <p class="eyebrow">OPÉRATIONS</p>
        <h1>Commandes</h1>
      </div>
    </div>
    <div class="filter-tabs">
      @for (f of filters; track f) {
        <button [class.active]="filter() === f" (click)="filter.set(f)">{{ f }}</button>
      }
    </div>
    <div class="orders-mobile">
      @for (order of orders; track order.id) {
        <article>
          <div>
            <small>#{{ order.id }} · {{ order.time }}</small>
            <h2>{{ order.client }}</h2>
            <p>2 articles</p>
          </div>
          <div>
            <strong>{{ order.total | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr' }}</strong
            ><select [(ngModel)]="order.status" aria-label="Modifier le statut">
              <option value="pending">Nouvelle</option>
              <option value="confirmed">Confirmée</option>
              <option value="preparing">En préparation</option>
              <option value="ready">Prête</option>
              <option value="delivering">En livraison</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </article>
      }
    </div>
  </section>`,
})
export class AdminOrdersComponent {
  readonly filter = signal('Toutes');
  filters = [
    'Toutes',
    'Nouvelles',
    'Confirmées',
    'En préparation',
    'Prêtes',
    'En livraison',
    'Terminées',
    'Annulées',
  ];
  orders = [
    {
      id: 'MK1028',
      client: 'Mariame D.',
      time: '12:42',
      total: 18.5,
      status: 'preparing' as OrderStatus,
    },
    {
      id: 'MK1027',
      client: 'Aïcha K.',
      time: '12:31',
      total: 12.9,
      status: 'confirmed' as OrderStatus,
    },
    { id: 'MK1026', client: 'Yves K.', time: '12:18', total: 24, status: 'ready' as OrderStatus },
  ];
}
@Component({
  selector: 'app-admin-products',
  imports: [CurrencyPipe, FormsModule],
  template: `<section class="admin-page">
    <div class="admin-title">
      <div>
        <p class="eyebrow">CATALOGUE FIRESTORE</p>
        <h1>Produits</h1>
      </div>
      <button class="button" (click)="createNew()">Créer un produit</button>
    </div>
    @if (catalog.loading()) {
      <div class="empty-state"><p>Chargement du catalogue…</p></div>
    } @else if (!catalog.products().length) {
      <div class="admin-empty">
        <h2>Aucun produit.</h2>
        <p>Crée le premier produit : il apparaîtra immédiatement dans le mode utilisateur.</p>
        <button class="button" (click)="createNew()">Créer le premier produit</button>
      </div>
    } @else {
      <div class="admin-products">
        @for (product of catalog.products(); track product.id) {
          <article>
            <img
              [src]="product.images[0] || '/images/mayklait/degue-hero.svg'"
              [alt]="product.name"
            />
            <div>
              <span>{{ product.available ? 'EN VENTE' : 'MASQUÉ' }}</span>
              <h2>{{ product.name }}</h2>
              <p>
                {{ product.optionGroups.length }} groupes d’options ·
                {{ product.price | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr' }}
              </p>
            </div>
            <button class="button ghost" (click)="edit(product)">Modifier</button>
          </article>
        }
      </div>
    }
    @if (editorOpen()) {
      <div class="admin-editor-backdrop" (click)="close()"></div>
      <aside class="admin-editor">
        <div class="drawer-head">
          <div>
            <p class="eyebrow">{{ editingId() ? 'MODIFIER' : 'NOUVEAU PRODUIT' }}</p>
            <h2>{{ draft.name || 'Sans nom' }}</h2>
          </div>
          <button class="icon-button" (click)="close()" aria-label="Fermer">×</button>
        </div>
        <form (ngSubmit)="save()">
          <div class="editor-grid">
            <label
              >Nom *<input
                name="name"
                [(ngModel)]="draft.name"
                required
                (ngModelChange)="setSlug()" /></label
            ><label>Slug *<input name="slug" [(ngModel)]="draft.slug" required /></label>
          </div>
          <label
            >Description *<textarea
              name="description"
              [(ngModel)]="draft.description"
              rows="3"
              required
            ></textarea>
          </label>
          <div class="editor-grid">
            <label
              >Prix de base (€) *<input
                name="price"
                [(ngModel)]="draft.price"
                type="number"
                min="0"
                step="0.01"
                required /></label
            ><label
              >URL de la photo<input
                name="image"
                [(ngModel)]="draft.images[0]"
                placeholder="https://..."
            /></label>
          </div>
          <div class="editor-checks">
            <label class="checkbox"
              ><input name="available" [(ngModel)]="draft.available" type="checkbox" /> Visible et
              disponible</label
            ><label class="checkbox"
              ><input name="featured" [(ngModel)]="draft.featured" type="checkbox" /> Produit
              phare</label
            >
          </div>
          <div class="editor-grid">
            <label
              >Ingrédients <small>Un par ligne</small
              ><textarea name="ingredients" [(ngModel)]="ingredientText" rows="4"></textarea></label
            ><label
              >Allergènes <small>Un par ligne</small
              ><textarea name="allergens" [(ngModel)]="allergenText" rows="4"></textarea>
            </label>
          </div>
          <div class="option-editor-head">
            <div>
              <h3>Groupes de personnalisation</h3>
              <p>Taille, sucre, parfum, toppings…</p>
            </div>
            <button type="button" class="button ghost" (click)="addGroup()">
              Ajouter un groupe
            </button>
          </div>
          @for (group of draft.optionGroups; track group.id; let gi = $index) {
            <fieldset class="admin-option-group">
              <div class="group-head">
                <input
                  [name]="'group-name-' + gi"
                  [(ngModel)]="group.name"
                  placeholder="Nom du groupe"
                  required
                /><button type="button" class="text-button danger" (click)="removeGroup(gi)">
                  Supprimer le groupe
                </button>
              </div>
              <div class="editor-checks">
                <label class="checkbox"
                  ><input [name]="'required-' + gi" [(ngModel)]="group.required" type="checkbox" />
                  Choix requis</label
                ><label class="checkbox"
                  ><input [name]="'multiple-' + gi" [(ngModel)]="group.multiple" type="checkbox" />
                  Choix multiple</label
                >
              </div>
              <div class="admin-options">
                @for (option of group.options; track option.id; let oi = $index) {
                  <div class="admin-option-row">
                    <input
                      [name]="'option-name-' + gi + '-' + oi"
                      [(ngModel)]="option.name"
                      placeholder="Nom du choix"
                      required
                    /><input
                      [name]="'option-price-' + gi + '-' + oi"
                      [(ngModel)]="option.priceModifier"
                      type="number"
                      step="0.01"
                      aria-label="Supplément"
                    /><label class="checkbox"
                      ><input
                        [name]="'option-available-' + gi + '-' + oi"
                        [(ngModel)]="option.available"
                        type="checkbox"
                      />
                      Actif</label
                    ><button
                      type="button"
                      class="icon-button"
                      (click)="removeOption(gi, oi)"
                      aria-label="Supprimer l’option"
                    >
                      ×
                    </button>
                  </div>
                }
              </div>
              <button type="button" class="text-button" (click)="addOption(gi)">
                + Ajouter un choix
              </button>
            </fieldset>
          }
          <div class="editor-actions">
            @if (editingId()) {
              <button type="button" class="text-button danger" (click)="remove()">
                Supprimer le produit
              </button>
            }
            <button class="button" [disabled]="saving()">
              {{ saving() ? 'Enregistrement…' : 'Enregistrer le produit' }}
            </button>
          </div>
          @if (message()) {
            <p class="form-error">{{ message() }}</p>
          }
        </form>
      </aside>
    }
  </section>`,
})
export class AdminProductsComponent {
  readonly catalog = inject(CatalogService);
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly message = signal('');
  ingredientText = '';
  allergenText = '';
  draft = this.empty();
  private empty(): ProductInput {
    return {
      name: '',
      slug: '',
      description: '',
      price: 0,
      images: [''],
      ingredients: [],
      allergens: [],
      available: true,
      featured: false,
      optionGroups: [],
    };
  }
  createNew() {
    this.editingId.set(null);
    this.draft = this.empty();
    this.ingredientText = '';
    this.allergenText = '';
    this.editorOpen.set(true);
  }
  edit(product: Product) {
    this.editingId.set(product.id);
    this.draft = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      images: [...product.images],
      ingredients: [...product.ingredients],
      allergens: [...product.allergens],
      available: product.available,
      featured: product.featured,
      optionGroups: structuredClone(product.optionGroups),
    };
    if (!this.draft.images.length) this.draft.images = [''];
    this.ingredientText = product.ingredients.join('\n');
    this.allergenText = product.allergens.join('\n');
    this.editorOpen.set(true);
  }
  close() {
    this.editorOpen.set(false);
    this.message.set('');
  }
  setSlug() {
    if (!this.editingId())
      this.draft.slug = this.draft.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
  }
  addGroup() {
    this.draft.optionGroups.push({
      id: crypto.randomUUID(),
      name: '',
      required: true,
      multiple: false,
      position: this.draft.optionGroups.length + 1,
      options: [],
    });
  }
  removeGroup(index: number) {
    this.draft.optionGroups.splice(index, 1);
  }
  addOption(group: number) {
    this.draft.optionGroups[group].options.push({
      id: crypto.randomUUID(),
      name: '',
      priceModifier: 0,
      available: true,
      position: this.draft.optionGroups[group].options.length + 1,
    });
  }
  removeOption(group: number, option: number) {
    this.draft.optionGroups[group].options.splice(option, 1);
  }
  async save() {
    if (!this.draft.name || !this.draft.slug) return;
    this.saving.set(true);
    this.message.set('');
    this.draft.ingredients = this.lines(this.ingredientText);
    this.draft.allergens = this.lines(this.allergenText);
    this.draft.images = this.draft.images.filter(Boolean);
    try {
      const id = this.editingId();
      id ? await this.catalog.update(id, this.draft) : await this.catalog.create(this.draft);
      this.close();
    } catch {
      this.message.set('Enregistrement refusé. Vérifie ton rôle admin et les règles Firestore.');
    } finally {
      this.saving.set(false);
    }
  }
  async remove() {
    const id = this.editingId();
    if (!id || !confirm('Supprimer définitivement ce produit ?')) return;
    try {
      await this.catalog.remove(id);
      this.close();
    } catch {
      this.message.set('Suppression refusée par Firestore.');
    }
  }
  private lines(value: string) {
    return value
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
  }
}
@Component({
  selector: 'app-admin-placeholder',
  template: `<section class="admin-page">
    <p class="eyebrow">MAYKLAIT</p>
    <h1>Cette section est prête.</h1>
    <p class="lead">Elle sera connectée aux collections Firebase correspondantes.</p>
  </section>`,
})
export class AdminPlaceholderComponent {}
