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
