import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { defineJsonSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import nodemailer from 'nodemailer';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

const db = getFirestore();
const DEFAULT_DELIVERY_FEE = 2.9;

interface CustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

interface RequestedItem {
  productId: string;
  quantity: number;
  selections?: Array<{ groupId: string; options?: Array<{ id: string }> }>;
}

interface CreateOrderData {
  customer: CustomerInput;
  address: AddressInput;
  items: RequestedItem[];
  promoCode?: string;
}

interface PromotionData {
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minimumAmount?: number;
  active?: boolean;
  startsAt?: Timestamp;
  endsAt?: Timestamp;
  maxUses?: number | null;
  usedCount?: number;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  replyTo?: string;
}

const smtpConfig = defineJsonSecret<SmtpConfig>('SMTP_CONFIG');

function cents(value: number) {
  return Math.round(value * 100);
}

function euros(valueInCents: number) {
  return Math.round(valueInCents) / 100;
}

function requiredText(value: unknown, label: string, maxLength = 180) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength) {
    throw new HttpsError('invalid-argument', `${label} est invalide.`);
  }
  return text;
}

function optionalText(value: unknown, maxLength = 500) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > maxLength) throw new HttpsError('invalid-argument', 'Une information est trop longue.');
  return text;
}

function normalizePromoCode(value: unknown) {
  const code = typeof value === 'string' ? value.trim().toUpperCase().replace(/\s+/g, '') : '';
  if (code && !/^[A-Z0-9_-]{3,30}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Le format du code promo est invalide.');
  }
  return code;
}

function promotionDiscount(promotion: PromotionData, subtotalCents: number, now = Date.now()) {
  if (!promotion.active) throw new HttpsError('failed-precondition', 'Ce code promo est inactif.');
  if (!promotion.type || !['percentage', 'fixed'].includes(promotion.type)) {
    throw new HttpsError('failed-precondition', 'Ce code promo est mal configuré.');
  }
  const value = Number(promotion.value);
  const minimumCents = cents(Number(promotion.minimumAmount ?? 0));
  if (!Number.isFinite(value) || value <= 0) throw new HttpsError('failed-precondition', 'Ce code promo est mal configuré.');
  if (subtotalCents < minimumCents) {
    throw new HttpsError('failed-precondition', `Commande minimum : ${euros(minimumCents).toFixed(2)} €.`);
  }
  if (promotion.startsAt && promotion.startsAt.toMillis() > now) {
    throw new HttpsError('failed-precondition', 'Ce code promo n’est pas encore disponible.');
  }
  if (promotion.endsAt && promotion.endsAt.toMillis() < now) {
    throw new HttpsError('failed-precondition', 'Ce code promo a expiré.');
  }
  const maxUses = Number(promotion.maxUses ?? 0);
  const usedCount = Number(promotion.usedCount ?? 0);
  if (maxUses > 0 && usedCount >= maxUses) {
    throw new HttpsError('failed-precondition', 'Ce code promo a atteint sa limite d’utilisation.');
  }
  const discount = promotion.type === 'percentage'
    ? Math.round(subtotalCents * Math.min(value, 100) / 100)
    : cents(value);
  return Math.min(subtotalCents, discount);
}

function initial(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || 'X';
}

function orderNumber(firstName: string, lastName: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).reduce<Record<string, string>>((all, part) => ({ ...all, [part.type]: part.value }), {});
  return `MK-${parts.year}${parts.month}${parts.day}-${initial(firstName)}${initial(lastName)}-${parts.hour}${parts.minute}`;
}

function validDate(value: unknown) {
  return value instanceof Timestamp ? value : undefined;
}

async function promotionForCode(code: string) {
  const snapshot = await db.collection('promotions').doc(code).get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Code promo introuvable.');
  return snapshot.data() as PromotionData;
}

export const validatePromotion = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connecte-toi pour utiliser un code promo.');
  const code = normalizePromoCode(request.data?.code);
  const subtotal = Number(request.data?.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) throw new HttpsError('invalid-argument', 'Code promo ou montant invalide.');
  const promotion = await promotionForCode(code);
  const discountCents = promotionDiscount(promotion, cents(subtotal));
  return { code, discount: euros(discountCents), type: promotion.type, value: promotion.value };
});

export const createOrder = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Tu dois être connecté pour commander.');
  const auth = request.auth;
  const data = request.data as CreateOrderData;
  const customer = {
    firstName: requiredText(data?.customer?.firstName, 'Le prénom', 80),
    lastName: requiredText(data?.customer?.lastName, 'Le nom', 80),
    phone: requiredText(data?.customer?.phone, 'Le téléphone', 40),
    email: requiredText(auth.token.email ?? data?.customer?.email, 'L’email', 180)
  };
  const address = {
    line1: requiredText(data?.address?.line1, 'L’adresse'),
    line2: optionalText(data?.address?.line2),
    city: requiredText(data?.address?.city, 'La ville', 100),
    postalCode: requiredText(data?.address?.postalCode, 'Le code postal', 20),
    instructions: optionalText(data?.address?.instructions)
  };
  if (!Array.isArray(data?.items) || !data.items.length || data.items.length > 30) {
    throw new HttpsError('invalid-argument', 'Le panier est invalide.');
  }
  const promoCode = normalizePromoCode(data.promoCode);
  const reference = db.collection('orders').doc();
  const publicNumber = orderNumber(customer.firstName, customer.lastName);

  return db.runTransaction(async transaction => {
    const productRefs = data.items.map(item => db.collection('products').doc(requiredText(item.productId, 'Le produit', 100)));
    const productSnapshots = await Promise.all(productRefs.map(productRef => transaction.get(productRef)));
    const settingsSnapshot = await transaction.get(db.collection('settings').doc('checkout'));
    const promotionRef = promoCode ? db.collection('promotions').doc(promoCode) : null;
    const promotionSnapshot = promotionRef ? await transaction.get(promotionRef) : null;
    let subtotalCents = 0;

    const items = data.items.map((requested, index) => {
      const quantity = Number(requested.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        throw new HttpsError('invalid-argument', 'Une quantité est invalide.');
      }
      const snapshot = productSnapshots[index];
      if (!snapshot.exists) throw new HttpsError('not-found', 'Un produit du panier n’existe plus.');
      const product = snapshot.data();
      if (!product) throw new HttpsError('not-found', 'Un produit du panier n’existe plus.');
      if (!product.available) throw new HttpsError('failed-precondition', `${product.name ?? 'Un produit'} n’est plus disponible.`);
      const basePriceCents = cents(Number(product.price));
      if (!Number.isFinite(basePriceCents) || basePriceCents < 0) throw new HttpsError('failed-precondition', 'Le prix d’un produit est invalide.');
      const requestedGroups = new Map((requested.selections ?? []).map(selection => [selection.groupId, selection.options ?? []]));
      let unitPriceCents = basePriceCents;
      const selections = (Array.isArray(product.optionGroups) ? product.optionGroups : []).map((group: any) => {
        const selectedIds = [...new Set((requestedGroups.get(group.id) ?? []).map(option => option.id))];
        if (group.required && !selectedIds.length) throw new HttpsError('failed-precondition', `Choisis une option pour ${group.name}.`);
        if (!group.multiple && selectedIds.length > 1) throw new HttpsError('failed-precondition', `Un seul choix est autorisé pour ${group.name}.`);
        const options = selectedIds.map(id => {
          const option = (Array.isArray(group.options) ? group.options : []).find((candidate: any) => candidate.id === id && candidate.available);
          if (!option) throw new HttpsError('failed-precondition', 'Une option sélectionnée n’est plus disponible.');
          unitPriceCents += cents(Number(option.priceModifier ?? 0));
          return { id: option.id, name: option.name, priceModifier: Number(option.priceModifier ?? 0), available: true, position: Number(option.position ?? 0) };
        });
        return options.length ? { groupId: group.id, groupName: group.name, options } : null;
      }).filter(Boolean);
      subtotalCents += unitPriceCents * quantity;
      return {
        id: `${reference.id}-${index + 1}`,
        productId: snapshot.id,
        name: product.name,
        slug: product.slug,
        image: Array.isArray(product.images) ? product.images[0] ?? '' : '',
        volume: product.volume ?? '',
        basePrice: euros(basePriceCents),
        quantity,
        selections,
        unitPrice: euros(unitPriceCents)
      };
    });

    const deliveryFeeCents = cents(Number(settingsSnapshot.data()?.deliveryFee ?? DEFAULT_DELIVERY_FEE));
    let discountCents = 0;
    let promotion = null;
    if (promoCode) {
      if (!promotionSnapshot?.exists || !promotionRef) throw new HttpsError('not-found', 'Code promo introuvable.');
      const promoData = promotionSnapshot.data() as PromotionData;
      discountCents = promotionDiscount({ ...promoData, startsAt: validDate(promoData.startsAt), endsAt: validDate(promoData.endsAt) }, subtotalCents);
      promotion = { code: promoCode, type: promoData.type, value: promoData.value, discount: euros(discountCents) };
      transaction.update(promotionRef, { usedCount: Number(promoData.usedCount ?? 0) + 1, updatedAt: FieldValue.serverTimestamp() });
    }
    const totalCents = Math.max(0, subtotalCents - discountCents) + Math.max(0, deliveryFeeCents);
    transaction.set(reference, {
      userId: auth.uid,
      orderNumber: publicNumber,
      customer,
      address,
      items,
      subtotal: euros(subtotalCents),
      discount: euros(discountCents),
      promotion,
      deliveryFee: euros(deliveryFeeCents),
      total: euros(totalCents),
      status: 'pending',
      deliveryMode: 'delivery',
      paymentMethod: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { id: reference.id, orderNumber: publicNumber, subtotal: euros(subtotalCents), discount: euros(discountCents), deliveryFee: euros(deliveryFeeCents), total: euros(totalCents) };
  });
});

export const updateOrderItemQuantity = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
  const adminId = request.auth.uid;
  const adminSnapshot = await db.collection('users').doc(adminId).get();
  if (adminSnapshot.data()?.role !== 'admin' || adminSnapshot.data()?.disabled) {
    throw new HttpsError('permission-denied', 'Accès administrateur requis.');
  }
  const orderId = requiredText(request.data?.orderId, 'La commande', 100);
  const itemIndex = Number(request.data?.itemIndex);
  const quantity = Number(request.data?.quantity);
  if (!Number.isInteger(itemIndex) || itemIndex < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new HttpsError('invalid-argument', 'La quantité est invalide.');
  }
  const orderRef = db.collection('orders').doc(orderId);

  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Commande introuvable.');
    const order = snapshot.data();
    const status = String(order?.status ?? 'pending');
    if (!['pending', 'confirmed', 'preparing'].includes(status)) {
      throw new HttpsError('failed-precondition', 'Cette commande ne peut plus être modifiée à ce stade.');
    }
    const items = Array.isArray(order?.items) ? structuredClone(order.items) : [];
    if (!items[itemIndex]) throw new HttpsError('not-found', 'Article introuvable dans cette commande.');
    const previousQuantity = Number(items[itemIndex].quantity ?? 1);
    items[itemIndex].quantity = quantity;
    const subtotalCents = items.reduce((total: number, item: any) => {
      const unitPrice = Number(item.unitPrice ?? 0);
      const itemQuantity = Number(item.quantity ?? 1);
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isInteger(itemQuantity) || itemQuantity < 1) {
        throw new HttpsError('failed-precondition', 'Les données de cette commande sont invalides.');
      }
      return total + cents(unitPrice) * itemQuantity;
    }, 0);
    const promotion = order?.promotion ? { ...order.promotion } : null;
    let discountCents = 0;
    if (promotion?.type === 'percentage') {
      discountCents = Math.round(subtotalCents * Math.min(Math.max(Number(promotion.value ?? 0), 0), 100) / 100);
    } else if (promotion?.type === 'fixed') {
      discountCents = Math.min(subtotalCents, cents(Math.max(Number(promotion.value ?? 0), 0)));
    }
    if (promotion) promotion.discount = euros(discountCents);
    const deliveryFeeCents = cents(Math.max(Number(order?.deliveryFee ?? DEFAULT_DELIVERY_FEE), 0));
    const totalCents = Math.max(0, subtotalCents - discountCents) + deliveryFeeCents;
    transaction.update(orderRef, {
      items,
      subtotal: euros(subtotalCents),
      discount: euros(discountCents),
      promotion,
      total: euros(totalCents),
      updatedAt: FieldValue.serverTimestamp(),
      auditLog: FieldValue.arrayUnion({
        action: 'quantity_updated',
        itemIndex,
        itemName: String(items[itemIndex].name ?? 'Article'),
        previousQuantity,
        newQuantity: quantity,
        adminId,
        createdAt: Timestamp.now()
      })
    });
    return { subtotal: euros(subtotalCents), discount: euros(discountCents), deliveryFee: euros(deliveryFeeCents), total: euros(totalCents) };
  });
});

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

export const sendOrderConfirmationEmail = onDocumentCreated(
  { document: 'orders/{orderId}', secrets: [smtpConfig], retry: true },
  async event => {
    const order = event.data?.data();
    if (!order?.customer?.email) return;
    const deliveryRef = db.collection('emailDeliveries').doc(event.params.orderId);
    const shouldSend = await db.runTransaction(async transaction => {
      const delivery = await transaction.get(deliveryRef);
      const deliveryData = delivery.data();
      if (deliveryData?.sentAt) return false;
      const processingAt = deliveryData?.processingAt instanceof Timestamp ? deliveryData.processingAt.toMillis() : 0;
      if (deliveryData?.status === 'processing' && Date.now() - processingAt < 10 * 60 * 1000) return false;
      transaction.set(deliveryRef, { orderId: event.params.orderId, status: 'processing', processingAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return true;
    });
    if (!shouldSend) return;

    const config = smtpConfig.value();
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port),
        secure: Boolean(config.secure),
        auth: { user: config.user, pass: config.password }
      });
      const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
      const items = (Array.isArray(order.items) ? order.items : []).map((item: any) => `<li style="margin-bottom:8px"><strong>${escapeHtml(item.quantity)} × ${escapeHtml(item.name)}</strong> — ${escapeHtml(currency.format(Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1)))}</li>`).join('');
      await transporter.sendMail({
        from: config.from,
        replyTo: config.replyTo || config.from,
        to: order.customer.email,
        subject: `Commande ${order.orderNumber} confirmée — MAYKLAIT`,
        text: `Merci ${order.customer.firstName}. Ta commande ${order.orderNumber} est confirmée. Total : ${currency.format(Number(order.total ?? 0))}. Livraison prévue pour le week-end prochain.`,
        html: `<div style="font-family:Arial,sans-serif;color:#111;max-width:600px;margin:auto;padding:32px"><p style="font-weight:800;letter-spacing:.08em">MAYKLAIT</p><h1 style="font-size:42px;line-height:1">Merci ${escapeHtml(order.customer.firstName)}.</h1><p>Ta commande <strong>${escapeHtml(order.orderNumber)}</strong> est confirmée.</p><ul style="padding-left:20px">${items}</ul>${Number(order.discount ?? 0) > 0 ? `<p>Réduction : −${escapeHtml(currency.format(Number(order.discount)))}</p>` : ''}<p style="font-size:22px"><strong>Total : ${escapeHtml(currency.format(Number(order.total ?? 0)))}</strong></p><p>Livraison prévue pour le week-end prochain.</p></div>`
      });
      await Promise.all([
        deliveryRef.set({ status: 'sent', sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
        event.data?.ref.update({ confirmationEmailSentAt: FieldValue.serverTimestamp() })
      ]);
    } catch (error) {
      await deliveryRef.set({ status: 'error', processingAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      throw error;
    }
  }
);
