import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseError } from 'firebase/app';
import { CatalogService, ProductInput } from '../core/catalog.service';
import { ImageUploadService } from '../core/image-upload.service';
import { OptionGroup, Product } from '../core/models';

interface VolumeChoice {
  id: string;
  name: string;
  available: boolean;
  priceModifier: number;
}

@Component({
  selector: 'app-admin-products-live',
  imports: [CurrencyPipe, FormsModule],
  template: ` <section class="admin-page">
    <div class="admin-title">
      <div>
        <p class="eyebrow">CATALOGUE FIRESTORE</p>
        <h1>Produits</h1>
      </div>
      <button
        class="admin-add-button"
        type="button"
        (click)="createNew()"
        aria-label="Créer un produit"
        title="Créer un produit"
      >
        +
      </button>
    </div>
    @if (catalog.loading()) {
      <div class="admin-empty"><p>Chargement du catalogue…</p></div>
    } @else if (!catalog.products().length) {
      <div class="admin-empty">
        <h2>Aucun produit.</h2>
        <p>Crée le premier produit : il apparaîtra immédiatement dans la boutique.</p>
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
                @if (product.volume) {
                  {{ product.volume }} ·
                }
                {{ product.optionGroups.length }} groupes d’options ·
                {{ product.price | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr' }}
              </p>
            </div>
            <button
              class="product-edit-button"
              type="button"
              (click)="edit(product)"
              [attr.aria-label]="'Modifier ' + product.name"
              [attr.title]="'Modifier ' + product.name"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M17.5 3.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 8.5-8.5Z"
                />
              </svg>
            </button>
          </article>
        }
      </div>
    }
    @if (editorOpen()) {
      <div class="admin-editor-backdrop" (click)="close()"></div>
      <aside class="admin-editor product-editor">
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
          <fieldset class="product-image-field">
            <legend>Photographie du produit *</legend>
            <input
              #imageInput
              id="product-image-input"
              class="sr-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="pickFile($event)"
            />
            @if (imagePreview()) {
              <div class="product-image-preview">
                <img [src]="imagePreview()" alt="Aperçu de la photographie du produit" />
                <div class="image-overlay">
                  <label
                    for="product-image-input"
                    class="image-action"
                    aria-label="Remplacer la photo"
                    title="Remplacer la photo"
                    ><svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M17.5 3.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 8.5-8.5Z"
                      /></svg></label
                  ><button
                    type="button"
                    class="image-action danger"
                    (click)="removeImage()"
                    aria-label="Supprimer la photo"
                    title="Supprimer la photo"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />
                    </svg>
                  </button>
                </div>
                @if (uploadProgress() > 0 && uploadProgress() < 100) {
                  <div class="upload-progress">
                    <span [style.width.%]="uploadProgress()"></span>
                  </div>
                }
              </div>
            } @else {
              <label
                for="product-image-input"
                class="image-dropzone"
                [class.dragging]="dragging()"
                (dragover)="onDragOver($event)"
                (dragleave)="dragging.set(false)"
                (drop)="onDrop($event)"
                ><svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 16V4m0 0L7 9m5-5 5 5M5 14v5h14v-5" /></svg
                ><strong>Dépose ta photo ici</strong><span>ou clique pour parcourir</span
                ><small>JPG, PNG ou WebP · 8 Mo maximum</small></label
              >
            }
            @if (imageError()) {
              <p class="form-error">{{ imageError() }}</p>
            }
          </fieldset>
          <label
            >Description *<textarea
              name="description"
              [(ngModel)]="draft.description"
              rows="3"
              required
            ></textarea>
          </label>
          <label
            >Prix de base (€) *
            <small>Prix du premier volume, avant les suppléments</small>
            <input
              name="price"
              [(ngModel)]="draft.price"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </label>
          <fieldset class="volume-selector">
            <legend>Volumes disponibles *</legend>
            <p>
              Coche les formats proposés. Ajoute un supplément lorsque le format coûte plus cher.
            </p>
            <div class="volume-choice-list">
              @for (volume of volumeChoices; track volume.id; let vi = $index) {
                <div class="volume-choice" [class.selected]="volume.available">
                  <label class="volume-toggle">
                    <input
                      [name]="'volume-active-' + vi"
                      [(ngModel)]="volume.available"
                      type="checkbox"
                    />
                    <span aria-hidden="true"></span>
                    <strong>{{ volume.name }}</strong>
                  </label>
                  <label class="volume-extra">
                    Supplément
                    <span
                      ><input
                        [name]="'volume-price-' + vi"
                        [(ngModel)]="volume.priceModifier"
                        type="number"
                        min="0"
                        step="0.01"
                        [disabled]="!volume.available"
                        aria-label="Supplément de prix"
                      />
                      €</span
                    >
                  </label>
                </div>
              }
              <div class="volume-choice custom" [class.selected]="customVolumeEnabled">
                <label class="volume-toggle">
                  <input
                    name="customVolumeEnabled"
                    [(ngModel)]="customVolumeEnabled"
                    type="checkbox"
                  />
                  <span aria-hidden="true"></span>
                  <strong>Autre</strong>
                </label>
                @if (customVolumeEnabled) {
                  <label class="custom-volume-name"
                    >Nom du volume *<input
                      name="customVolumeName"
                      [(ngModel)]="customVolumeName"
                      placeholder="Ex. 750 ml"
                      required
                  /></label>
                  <label class="volume-extra"
                    >Supplément
                    <span
                      ><input
                        name="customVolumePrice"
                        [(ngModel)]="customVolumePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label="Supplément du volume personnalisé"
                      />
                      €</span
                    ></label
                  >
                }
              </div>
            </div>
          </fieldset>
          <div class="editor-checks vertical">
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
              <h3>Personnalisation</h3>
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
                  Supprimer
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
                    ><button type="button" class="icon-button" (click)="removeOption(gi, oi)">
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
              <button type="button" class="text-button danger" (click)="removeProduct()">
                Supprimer le produit
              </button>
            }
            <button class="button" [disabled]="saving()">
              {{
                saving()
                  ? uploadProgress() > 0 && uploadProgress() < 100
                    ? 'Envoi ' + uploadProgress() + ' %'
                    : 'Enregistrement…'
                  : 'Enregistrer le produit'
              }}
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
export class AdminProductsLiveComponent {
  readonly catalog = inject(CatalogService);
  private uploader = inject(ImageUploadService);
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly imagePreview = signal('');
  readonly imageError = signal('');
  readonly uploadProgress = signal(0);
  readonly dragging = signal(false);
  ingredientText = '';
  allergenText = '';
  volumeChoices = this.defaultVolumes();
  customVolumeEnabled = false;
  customVolumeName = '';
  customVolumePrice = 0;
  private customVolumeId = 'volume-custom';
  private volumeGroupId = 'volume';
  private volumeGroupPosition = 0;
  draft = this.empty();
  private selectedFile: File | null = null;
  private originalImage = '';
  private empty(): ProductInput {
    return {
      name: '',
      slug: '',
      description: '',
      price: 0,
      volume: '',
      images: [],
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
    this.resetVolumes();
    this.resetImage();
    this.editorOpen.set(true);
  }
  edit(product: Product) {
    this.editingId.set(product.id);
    this.draft = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      volume: product.volume ?? '',
      images: [...product.images],
      ingredients: [...product.ingredients],
      allergens: [...product.allergens],
      available: product.available,
      featured: product.featured,
      optionGroups: structuredClone(
        product.optionGroups.filter((group) => !this.isVolumeGroup(group)),
      ),
    };
    this.ingredientText = product.ingredients.join('\n');
    this.allergenText = product.allergens.join('\n');
    this.resetVolumes(product);
    this.resetImage(product.images[0] ?? '');
    this.editorOpen.set(true);
  }
  private defaultVolumes(): VolumeChoice[] {
    return [
      { id: 'volume-240-ml', name: '240 ml', available: false, priceModifier: 0 },
      { id: 'volume-500-ml', name: '500 ml', available: false, priceModifier: 0 },
      { id: 'volume-1-l', name: '1 L', available: false, priceModifier: 0 },
    ];
  }
  private isVolumeGroup(group: OptionGroup) {
    return group.id === 'volume' || group.name.trim().toLocaleLowerCase('fr') === 'volume';
  }
  private resetVolumes(product?: Product) {
    const group = product?.optionGroups.find((candidate) => this.isVolumeGroup(candidate));
    this.volumeGroupId = group?.id ?? 'volume';
    this.volumeGroupPosition = group?.position ?? 0;
    this.volumeChoices = this.defaultVolumes().map((choice) => {
      const existing = group?.options.find(
        (option) =>
          option.name.trim().toLocaleLowerCase('fr') === choice.name.toLocaleLowerCase('fr'),
      );
      const legacySelected = !group && product?.volume === choice.name;
      return existing
        ? {
            id: existing.id,
            name: choice.name,
            available: existing.available,
            priceModifier: existing.priceModifier,
          }
        : { ...choice, available: legacySelected };
    });
    const custom = group?.options.find(
      (option) =>
        !this.volumeChoices.some(
          (choice) =>
            choice.name.toLocaleLowerCase('fr') === option.name.trim().toLocaleLowerCase('fr'),
        ),
    );
    const legacyCustom =
      !group &&
      product?.volume &&
      !this.volumeChoices.some((choice) => choice.name === product.volume) &&
      !product.volume.endsWith('formats')
        ? product.volume
        : '';
    this.customVolumeEnabled = custom?.available ?? !!legacyCustom;
    this.customVolumeName = custom?.name ?? legacyCustom;
    this.customVolumePrice = custom?.priceModifier ?? 0;
    this.customVolumeId = custom?.id ?? 'volume-custom';
  }
  close() {
    this.editorOpen.set(false);
    this.message.set('');
    this.revokePreview();
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
  pickFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.useFile(file);
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.useFile(file);
  }
  private useFile(file: File) {
    this.imageError.set('');
    try {
      this.uploader.validate(file);
      this.revokePreview();
      this.selectedFile = file;
      this.imagePreview.set(URL.createObjectURL(file));
    } catch (error: any) {
      this.imageError.set(
        error?.message === 'SIZE'
          ? 'La photo dépasse 8 Mo.'
          : 'Utilise une image JPG, PNG ou WebP.',
      );
    }
  }
  removeImage() {
    this.revokePreview();
    this.selectedFile = null;
    this.imagePreview.set('');
    this.draft.images = [];
  }
  private resetImage(url = '') {
    this.revokePreview();
    this.selectedFile = null;
    this.originalImage = url;
    this.imagePreview.set(url);
    this.imageError.set('');
    this.uploadProgress.set(0);
  }
  private revokePreview() {
    const preview = this.imagePreview();
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
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
    if (this.customVolumeEnabled && !this.customVolumeName.trim()) {
      this.message.set('Renseigne le volume personnalisé.');
      return;
    }
    const standardOptions = this.volumeChoices.map((volume, index) => ({
      ...volume,
      priceModifier: Math.max(0, Number(volume.priceModifier) || 0),
      position: index + 1,
    }));
    const customOption = this.customVolumeName.trim()
      ? [
          {
            id: this.customVolumeId,
            name: this.customVolumeName.trim(),
            available: this.customVolumeEnabled,
            priceModifier: Math.max(0, Number(this.customVolumePrice) || 0),
            position: standardOptions.length + 1,
          },
        ]
      : [];
    const volumeOptions = [...standardOptions, ...customOption];
    const availableVolumes = volumeOptions.filter((volume) => volume.available);
    if (!availableVolumes.length) {
      this.message.set('Coche au moins un volume disponible.');
      return;
    }
    const volumeGroup: OptionGroup = {
      id: this.volumeGroupId,
      name: 'Volume',
      required: true,
      multiple: false,
      position: this.volumeGroupPosition,
      options: volumeOptions,
    };
    this.draft.optionGroups = [
      volumeGroup,
      ...this.draft.optionGroups.filter((group) => !this.isVolumeGroup(group)),
    ].map((group, index) => ({ ...group, position: index }));
    this.draft.volume =
      availableVolumes.length === 1
        ? availableVolumes[0].name
        : `${availableVolumes.length} formats`;
    if (!this.selectedFile && !this.draft.images[0]) {
      this.imageError.set('Ajoute une photographie du produit.');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    let stage: 'upload' | 'firestore' = 'upload';
    let uploadedUrl = '';
    try {
      if (this.selectedFile) {
        uploadedUrl = await this.uploader.uploadProduct(
          this.selectedFile,
          this.draft.slug,
          (progress) => this.uploadProgress.set(progress),
        );
        this.draft.images = [uploadedUrl];
      }
      stage = 'firestore';
      this.draft.ingredients = this.lines(this.ingredientText);
      this.draft.allergens = this.lines(this.allergenText);
      const id = this.editingId();
      id ? await this.catalog.update(id, this.draft) : await this.catalog.create(this.draft);
      if (this.originalImage && this.originalImage !== this.draft.images[0])
        await this.uploader.remove(this.originalImage).catch(() => undefined);
      this.close();
    } catch (error) {
      console.error('Création du produit impossible', error);
      if (stage === 'firestore' && uploadedUrl)
        await this.uploader.remove(uploadedUrl).catch(() => undefined);
      this.message.set(this.saveError(error, stage));
    } finally {
      this.saving.set(false);
      this.uploadProgress.set(0);
    }
  }
  private saveError(error: unknown, stage: 'upload' | 'firestore') {
    const code = error instanceof FirebaseError ? error.code : (error as { code?: string })?.code;
    if (code === 'storage/unauthorized')
      return 'Firebase Storage refuse cet envoi : reconnecte-toi avec ton compte administrateur, puis réessaie. (storage/unauthorized)';
    if (code === 'storage/retry-limit-exceeded')
      return 'L’envoi a expiré. Vérifie ta connexion puis réessaie. (storage/retry-limit-exceeded)';
    if (code === 'storage/canceled') return 'L’envoi de la photo a été annulé.';
    if (code === 'storage/unknown')
      return 'Firebase Storage a rencontré une erreur serveur. Réessaie dans quelques instants. (storage/unknown)';
    if (code === 'permission-denied' || code === 'firestore/permission-denied')
      return 'Firestore refuse la création du produit. Vérifie que ton compte possède toujours le rôle administrateur. (permission-denied)';
    return `${stage === 'upload' ? 'Envoi de la photo' : 'Enregistrement du produit'} impossible${code ? ` (${code})` : ''}. Réessaie ou consulte la console du navigateur.`;
  }
  async removeProduct() {
    const id = this.editingId();
    if (!id || !confirm('Supprimer définitivement ce produit ?')) return;
    try {
      await this.catalog.remove(id);
      if (this.originalImage) await this.uploader.remove(this.originalImage).catch(() => undefined);
      this.close();
    } catch {
      this.message.set('Suppression refusée par Firebase.');
    }
  }
  private lines(value: string) {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
