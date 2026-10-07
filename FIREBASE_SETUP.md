# Mise en service des commandes MAYKLAIT

## 1. Déployer la validation sécurisée

Les nouvelles règles interdisent au navigateur de créer directement une commande. Déployer les deux fonctions de commande et les règles ensemble :

```powershell
firebase deploy --only functions:createOrder,functions:validatePromotion,functions:updateOrderItemQuantity,firestore:rules --project mayk-lait
```

La création de commande recalcule alors côté serveur les prix des produits, les options, la livraison et la remise.

## 2. Configurer l’email lorsque le domaine sera disponible

Préparer un objet JSON à partir de `functions/SMTP_CONFIG.example.json`, avec les paramètres transmis par l’hébergeur email. Ne jamais enregistrer le mot de passe SMTP dans Git.

Créer le secret de production :

```powershell
firebase functions:secrets:set SMTP_CONFIG --project mayk-lait
```

Coller le JSON complet lorsque la CLI le demande, puis déployer uniquement la fonction email :

```powershell
firebase deploy --only functions:sendOrderConfirmationEmail --project mayk-lait
```

L’adresse du destinataire provient automatiquement de la commande. Les informations à fournir plus tard concernent l’expéditeur : hôte SMTP, port, mode sécurisé, utilisateur, mot de passe, adresse `from` et éventuellement `replyTo`.

## 3. Vérifications locales

```powershell
npm run build
npm run test -- --watch=false
npm run build:functions
```

## Préparation du lancement

- La livraison est limitée aux codes postaux d’Île-de-France (75, 77, 78, 91–95), vérifiés côté serveur.
- Les nouvelles commandes sont reçues en attente de validation, avec paiement à la livraison et statut impayé.
- Le client réutilise la même référence lorsqu’une tentative échoue sans réponse certaine, afin de ne pas créer deux commandes. Cette référence couvre les nouvelles tentatives dans le même écran, pas un rechargement complet.
- Déployer `createOrder` et `sendOrderConfirmationEmail` pour activer les corrections serveur.
- Compléter et valider les mentions légales, les conditions de vente, le contact, les durées de conservation et la politique de confidentialité avant l’ouverture commerciale. Les pages actuelles sont préparatoires.
- Vérifier le SMTP, une vraie commande test, son apparition dans l’administration et la réception de l’email. Aucun test de production n’a été effectué dans cette modification.
- Le stock reste géré par disponibilité, sans réservation quantitative.

Tests des règles de livraison et de référence de commande :

```powershell
npm run build:functions
node --test functions/test/commerce-policy.test.cjs
```
