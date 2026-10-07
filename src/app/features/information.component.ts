import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-information',
  imports: [RouterLink],
  template: `
    <section class="page-container information-page">
      <a routerLink="/boutique" class="back-link">← Retour à la boutique</a>
      <p class="eyebrow">MAYKLAIT · INFORMATIONS</p>
      @switch (page) {
        @case ('delivery') {
          <h1>Du frais.<br>Près de chez toi.</h1>
          <div class="information-grid">
            <article><span class="information-number">01</span><h2>En Île-de-France</h2><p>Nous livrons dans les départements 75, 77, 78, 91, 92, 93, 94 et 95. Ton code postal est vérifié au moment de la commande.</p></article>
            <article><span class="information-number">02</span><h2>Un passage convenu ensemble</h2><p>Une fois ta commande reçue, nous te contacterons pour confirmer sa préparation et convenir de la livraison. L’enregistrement ne garantit pas encore un créneau.</p></article>
            <article><span class="information-number">03</span><h2>Paiement à la livraison</h2><p>Tu ne renseignes aucune carte bancaire sur ce site. Les moyens de règlement acceptés seront précisés lors de la confirmation.</p></article>
            <article><span class="information-number">04</span><h2>Un total visible avant l’envoi</h2><p>Les frais de livraison et les éventuelles réductions apparaissent dans le récapitulatif. Le serveur vérifie les prix lors de l’enregistrement.</p></article>
          </div>
          <a routerLink="/boutique" class="button">Découvrir la boutique</a>
        }
        @case ('privacy') {
          <h1>Tes données.<br>En toute clarté.</h1>
          <div class="information-copy"><p class="information-notice">Version préparatoire : l’identité du responsable, les durées de conservation et les modalités d’exercice des droits doivent être complétées avant l’ouverture commerciale.</p><h2>Les informations utilisées</h2><p>Le compte, les coordonnées, les adresses et les commandes servent à gérer ton accès, préparer tes achats et organiser la livraison. Les préférences d’allergies ou d’intolérances et la photo de profil sont facultatives.</p><h2>Les services techniques</h2><p>Le site utilise Firebase pour l’authentification, les données et les fichiers. Les confirmations de commande utilisent un service d’email lorsque celui-ci est configuré.</p><h2>Le panier sur ton appareil</h2><p>Le panier est conservé dans le stockage local du navigateur pour retrouver les articles après un rechargement. Aucune donnée de carte bancaire n’est demandée.</p><h2>Nous contacter</h2><p>Pour toute question, utilise l’adresse de contact du site. Les coordonnées définitives doivent être validées par l’exploitant.</p></div>
        }
        @default {
          <h1>Mentions<br>légales.</h1>
          <div class="information-copy"><p class="information-notice">Page en préparation — à compléter avant l’ouverture commerciale.</p><h2>Identité de l’exploitant</h2><p>La raison sociale ou le nom de l’entrepreneur, la forme juridique, l’adresse professionnelle, le numéro d’immatriculation et les coordonnées de contact doivent être renseignés.</p><h2>Publication et hébergement</h2><p>Le responsable de publication et les coordonnées de l’hébergeur doivent être précisés après validation de l’hébergement de production.</p><h2>Conditions de vente</h2><p>Les conditions de commande, de livraison, de règlement et de réclamation doivent être validées et publiées avant l’ouverture commerciale.</p><a routerLink="/livraison" class="text-link">Consulter les informations de livraison →</a></div>
        }
      }
    </section>
  `
})
export class InformationComponent {
  readonly page = inject(ActivatedRoute).snapshot.data['page'];
}
