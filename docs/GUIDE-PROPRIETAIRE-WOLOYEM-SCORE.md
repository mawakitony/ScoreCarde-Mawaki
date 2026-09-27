# Guide d’utilisation WOLOYEM Score — Propriétaire

Ce guide s’adresse au propriétaire d’une organisation. Il décrit l’application telle qu’elle se présente à l’écran, sans vocabulaire de développement.

Adresse de l’application : [https://scorapp-xp.vercel.app](https://scorapp-xp.vercel.app)

## Table des matières

1. [Introduction](#1-introduction)
2. [Première connexion](#2-première-connexion)
3. [Dashboard](#3-dashboard)
4. [Créer une scorecard](#4-créer-une-scorecard)
5. [Builder](#5-builder)
6. [Questions](#6-questions)
7. [Import Excel](#7-import-excel)
8. [Catégories](#8-catégories)
9. [Scoring](#9-scoring)
10. [Lead Capture](#10-lead-capture)
11. [Results](#11-results)
12. [Preview](#12-preview)
13. [Publication](#13-publication)
14. [Parcours du participant](#14-parcours-du-participant)
15. [Leads](#15-leads)
16. [Analytics](#16-analytics)
17. [Rapports](#17-rapports)
18. [Équipe](#18-équipe)
19. [Settings](#19-settings)
20. [Intégrations](#20-intégrations)
21. [Facturation](#21-facturation)
22. [Domaines](#22-domaines)
23. [Dépannage](#23-dépannage)
24. [Avant de publier une scorecard](#24-avant-de-publier-une-scorecard)
25. [Fonctionnalités non disponibles actuellement](#25-fonctionnalités-non-disponibles-actuellement)

---

## 1. Introduction

WOLOYEM Score sert à faire passer un diagnostic en ligne, à calculer un niveau, puis à recueillir les coordonnées de la personne et à lui montrer un résultat adapté.

Une **scorecard** est le questionnaire complet : page d’accueil, questions, points, formulaire, niveaux de résultat et bouton d’action.

| Mot | Sens simple |
| --- | --- |
| Questionnaire | Les questions auxquelles la personne répond. |
| Scorecard | L’ensemble publié : page, questions, score, formulaire et résultats. |
| Lead | La personne dont vous avez au moins une coordonnée (souvent l’email). |
| Résultat | Le niveau affiché après le score, par exemple « Préparation nécessaire ». |
| Rapport | Un document de synthèse, à l’écran ou en PDF, distinct de la page de résultat. |

En tant que **Propriétaire**, vous pouvez créer et publier les scorecards, inviter l’équipe, consulter les leads, les analyses et la facturation, et transférer la propriété. Les autres rôles sont décrits au chapitre Équipe.

[CAPTURE 01 — Dashboard]

Page : Dashboard, juste après la connexion. Montrez le menu de gauche (Dashboard, Scorecards, Leads, Analytics, Templates, Settings) et le titre « Dashboard ».

---

## 2. Première connexion

### Objectif

Entrer dans l’organisation et atteindre le tableau de bord.

### Chemin

Page publique → Connexion → Dashboard

### Étapes

1. Ouvrez [https://scorapp-xp.vercel.app/login](https://scorapp-xp.vercel.app/login).
2. Choisissez **Mot de passe**, puis **Se connecter**, ou **Lien magique** pour recevoir un email.
3. Si vous n’avez pas encore de compte, utilisez **Créer un accès**.
4. Si aucun espace n’existe pour ce compte, l’écran **Créer votre organisation** s’ouvre. Renseignez le nom, un identifiant en minuscules (le slug, par exemple `woloyem`) et, si vous voulez, l’usage principal. Cliquez sur **Continuer**. Vous devenez propriétaire.
5. Vous arrivez sur le Dashboard.

Le premier compte d’un espace devient propriétaire. Les personnes suivantes ont besoin d’une invitation. Le message « Ce compte n'est pas membre de WOLOYEM » signifie qu’il faut une invitation, pas un nouveau mot de passe.

[CAPTURE 02 — Connexion]

Page : Connexion. Montrez les onglets **Mot de passe** et **Lien magique**, et le lien **Créer un accès**.

[CAPTURE 03 — Créer votre organisation]

Page : onboarding, uniquement pour un compte sans organisation. Montrez Nom, slug, Usage principal et **Continuer**.

---

## 3. Dashboard

Le menu de gauche est fixe :

| Menu | À quoi ça sert |
| --- | --- |
| Dashboard | Vue d’ensemble de la période. |
| Scorecards | Liste et création des diagnostics. |
| Leads | Personnes qui ont laissé leurs coordonnées. |
| Analytics | Indicateurs plus détaillés, conversions et rapports. |
| Templates | Modèles prêts à copier. |
| Settings | Profil, organisation, équipe, facturation et le reste. |

En haut, le champ **Rechercher une scorecard** ouvre la liste filtrée. La cloche **Notifications** affiche les messages de l’espace. **Tout lire** les marque comme lus. S’il n’y en a pas : « Aucune notification pour le moment. » Le menu de votre nom mène à **Paramètres** et à la déconnexion.

La période se choisit avec **Aujourd'hui**, **7 jours**, **30 jours**, **90 jours** ou **Période**.

### Indicateurs

| Indicateur affiché | Comment le lire |
| --- | --- |
| Total Leads | Nombre de leads sur la période. |
| New Leads | Nouveaux leads. |
| Completed Assessments | Évaluations terminées. |
| Conversion Rate | Clics sur le bouton d’action, divisés par les évaluations terminées. |
| Average Score | Score moyen, en pourcentage. |
| Hot Leads | Leads chauds (score élevé ou clic sur le bouton d’action). |
| CTA Click Rate | Clics sur le bouton d’action, divisés par les résultats vus. |

En dessous : **Recent Hot Leads** (nom, score, scorecard, pays, CTA, date). Les graphiques : **Leads par jour**, **Taux de complétion**, **Score moyen**, **Répartition des résultats**, **Top scorecards**. Le bloc **Sources des leads** peut afficher « Sources à venir » : ne vous attendez pas à un détail complet des sources sur ce graphique.

S’il n’existe encore aucune scorecard, un encadré **Premiers pas** liste, en anglais : Create your first scorecard, Publish it, Receive first lead, Invite teammate, Connect integration.

[CAPTURE 04 — Indicateurs du Dashboard]

Page : Dashboard. Montrez les sept cartes et le filtre de période.

---

## 4. Créer une scorecard

Deux méthodes existent.

### Depuis zéro

### Objectif

Créer un brouillon vide.

### Chemin

Scorecards → Nouvelle scorecard → Créer la scorecard

### Étapes

1. Ouvrez **Scorecards**.
2. Cliquez sur **Nouvelle scorecard**.
3. Donnez un nom, un slug (minuscules et tirets) et une catégorie.
4. Cliquez sur **Créer la scorecard**.

### Résultat attendu

La scorecard apparaît dans la liste avec le statut **Brouillon**. Ouvrez-la, puis **Ouvrir le builder**.

### Depuis un modèle

### Objectif

Partir d’un diagnostic déjà nommé.

### Chemin

Templates → Créer à partir de ce modèle

### Étapes

1. Ouvrez **Templates**.
2. Choisissez un modèle. Ceux fournis sont : **Éligibilité PMP®**, **Préparation PMP®**, **Préparation CAPM®**, **ITIL® Foundation**, **PRINCE2®**, **Compétences en gestion de projet**, **Business Case**.
3. Cliquez sur **Créer à partir de ce modèle**.

### Résultat attendu

Un brouillon s’ouvre dans le builder, à l’étape Setup. Le modèle crée la fiche. Les questions et le scoring se complètent ensuite dans le builder. Le texte de la page Templates le précise : « Chaque modèle crée une scorecard brouillon. Les questions et le scoring seront ajoutés dans le builder. »

### Attention

Un même nom peut produire plusieurs brouillons si vous cliquez plusieurs fois. Vérifiez la liste avant d’en créer un nouveau.

[CAPTURE 05 — Liste des scorecards]

Page : Scorecards. Montrez **Nouvelle scorecard**, un statut **Brouillon** et le champ de recherche.

[CAPTURE 06 — Templates]

Page : Templates. Montrez au moins **Business Case** et **Éligibilité PMP®**, avec le bouton **Créer à partir de ce modèle**.

---

## 5. Builder

### Chemin

Scorecards → nom de la scorecard → Ouvrir le builder

Le builder a huit étapes, dans cet ordre, avec ces libellés exacts :

Setup · Landing Page · Questions · Categories · Scoring · Lead Capture · Results · Preview

L’enregistrement des champs est automatique. Vous voyez **Saving...**, puis **Saved**, puis **Last saved just now**. En cas d’échec : **Échec de l'enregistrement**. Le bouton **Publish** est traité au chapitre Publication. **Preview** dans l’en-tête ouvre l’étape Preview.

[CAPTURE 07 — Builder / Setup]

Page : builder, étape Setup. Montrez le menu des étapes et l’indicateur **Saved**.

### Setup

Objectif : identité de la scorecard.

Champs : nom, slug, description, description publique, langue (français ou anglais), catégorie (PMP, CAPM, PgMP, PMI-ACP, ITIL, PRINCE2, PMO, Gestion de projet, Project Management, Business Case, Autre, Other), statut (Brouillon, Publiée, En pause, Archivée), couleurs, logo, image de couverture, durée estimée en minutes.

Le slug devient l’adresse publique : `https://scorapp-xp.vercel.app/s/votre-slug`.

Exemple : nom « Éligibilité PMP® », slug `eligibilite-pmp`, catégorie PMP, statut Brouillon, 8 minutes.

À éviter : un slug avec des majuscules, des espaces ou des accents. Le message « Ce slug est déjà utilisé. » impose un autre slug dans la même organisation.

Impact public : le nom, les couleurs, le logo et la durée peuvent apparaître sur la page publique. Le statut **Publiée** rend la page accessible. Préférez le bouton **Publish**, qui vérifie la scorecard avant.

### Landing Page

Objectif : la page que le visiteur voit avant de commencer.

Champs : eyebrow (courte accroche), titre, sous-titre, description, image, texte du bouton (par défaut **Commencer**), mention de durée, cases pour afficher la durée, le nombre de questions et le texte de confidentialité, jusqu’à 8 bénéfices (titre, description, icône), un témoignage (citation, auteur, rôle), texte de confidentialité.

Exemple : titre « Êtes-vous prêt pour le PMP® ? », bouton « Commencer le diagnostic ».

À éviter : un titre public trop court. La publication exige au moins deux caractères, en pratique une vraie phrase.

Impact public : c’est la page `https://scorapp-xp.vercel.app/s/votre-slug`.

### Questions, Categories, Scoring, Lead Capture, Results

Ces étapes ont leur propre chapitre.

### Preview

Voir le chapitre Preview.

---

## 6. Questions

### Chemin

Builder → Questions

### Ajouter

1. Choisissez le type dans la liste **Type de question**.
2. Cliquez sur **Ajouter une question**.
3. La question « Nouvelle question » apparaît. Cliquez sur le crayon pour la modifier.

### Modifier

Renseignez le titre, la description, la **Catégorie**, la **Catégorie de scoring**, **Obligatoire** et **Scorée**. Les options ont un libellé et des points. Pour une échelle, le bouton **Répartir de 0 à 100** propose une répartition. Vous pouvez la changer : les points saisis sont ceux qui comptent.

### Supprimer et dupliquer

La corbeille demande **Supprimer cette question ?**. Les options partent avec la question. L’icône copier crée un double intitulé « (copie) ».

### Réordonner

Faites glisser les cartes. L’ordre est celui du questionnaire public.

### Types réellement disponibles

| Libellé | Usage |
| --- | --- |
| Choix unique | Une seule réponse, avec des points par option. |
| Choix multiple | Plusieurs réponses. Les points des options choisies s’additionnent. |
| Oui / Non | Deux réponses, par défaut Oui et Non. |
| Échelle 1–5 | Note de 1 à 5. |
| Échelle 1–10 | Note de 1 à 10. |
| Texte court | Réponse libre courte. Souvent non notée. |
| Texte long | Réponse libre longue. Souvent non notée. |
| Nombre | Une valeur numérique. |
| Email | Une adresse email. |
| Téléphone | Un numéro. |
| Pays | Un pays. |
| Liste déroulante | Un choix dans une liste, avec des points. |

### Exemple

Question : « Combien d'années d'expérience avez-vous en gestion de projet ? »

Type : Choix unique. Obligatoire. Scorée. Catégorie de scoring : Experience.

| Option | Points |
| --- | --- |
| Moins de 1 an | 0 |
| 1 à 2 ans | 25 |
| 3 à 5 ans | 60 |
| Plus de 5 ans | 100 |

### Attention

Une question notée sans catégorie de scoring bloque la publication dès qu’au moins une catégorie de scoring existe. Une question non scorée ne change pas le score. Les points ne sont pas montrés au participant.

[CAPTURE 08 — Questions]

Page : builder, Questions. Montrez **Ajouter une question**, une carte et le panneau d’édition avec Obligatoire et Scorée.

---

## 7. Import Excel

Le bouton **Importer des questions** est présent dans l’étape Questions de cette version de l’application.

**Non disponible actuellement** en production tant que la migration d’import n’a pas été appliquée sur la base et que cette version n’a pas été déployée. Tant que ce n’est pas le cas, le téléchargement du modèle peut répondre une erreur, et la confirmation n’enregistre rien. Le chapitre décrit le comportement une fois la fonction opérationnelle.

L’import depuis ScoreApp n’est pas documenté comme une procédure disponible. Voir le chapitre 25.

### Objectif

Créer beaucoup de questions d’un coup, après contrôle.

### Chemin

Builder → Questions → Importer des questions

### Étapes

1. Cliquez sur **Importer des questions**. La fenêtre s’intitule **Importer un questionnaire**.
2. Cliquez sur **Télécharger le modèle Excel**. Le fichier s’appelle `WOLOYEM-Score-Questionnaire-Template.xlsx`.
3. Remplissez-le sans renommer les colonnes ni les feuilles.
4. Déposez le fichier `.xlsx` (un `.csv` de la feuille Questions est aussi accepté).
5. Lisez l’aperçu : nombre de questions, catégories, options, questions notées et non notées, puis le tableau Ordre, Question, Type, Catégorie, Options, Notée.
6. Choisissez **Ajouter aux questions existantes** ou **Remplacer toutes les questions existantes**.
7. Le remplacement ouvre **Remplacer toutes les questions ?**. Confirmez avec **Remplacer et importer**, ou **Annuler**.
8. Cliquez sur **Importer N questions**.

### Résultat attendu

Un message du type « 42 questions importées. » Les questions apparaissent dans le builder et restent modifiables. Les points du fichier sont conservés tels quels.

### Feuilles du modèle

**Instructions**, en premier. Elle rappelle les règles.

**Questions**

`question_id`, `order`, `category`, `question_type`, `question`, `description`, `required`, `is_scored`, puis `option_1` à `option_6` et `option_1_score` à `option_6_score`.

`question_id` (Q001, Q002) est une référence dans le fichier. Ce n’est pas l’identifiant interne de l’application.

Types autorisés, à écrire exactement : `single_choice`, `multiple_choice`, `yes_no`, `scale_5`, `scale_10`, `short_text`, `long_text`, `number`, `email`, `phone`, `country`, `dropdown`.

Booléens : TRUE ou FALSE. Scores : nombres. Le nom de catégorie doit être identique à celui de la feuille Categories.

L’exemple du modèle est la question d’expérience en gestion de projet, scores 0, 25, 60 et 100.

**Categories**

`category_id`, `name`, `description`, `weight`, `order`, `high_message`, `medium_message`, `low_message`.

Exemple : CAT001, Experience, poids 40, messages « Solide expérience », « Bonne base », « Expérience à renforcer ».

**Result Ranges**

`min_score`, `max_score`, `label`, `title`, `description`, `badge`, `cta_label`, `cta_url`.

Les bornes sont des pourcentages de 0 à 100. Exemple : 0 à 39, `needs_preparation`, « Préparation nécessaire ».

### Erreurs courantes

Le message indique la ligne et la colonne. Exemples :

| Message | Quoi faire |
| --- | --- |
| Colonne attendue « … » | Remettez le nom exact de la colonne, sans accent ni espace en plus. |
| Type « … » invalide | Utilisez un type de la liste, en anglais technique, par exemple `single_choice`. |
| La valeur « fort » n'est pas un nombre valide | Mettez un nombre dans `option_2_score`. |
| Catégorie « Leadership » introuvable | Ajoutez Leadership sur la feuille Categories, avec la même orthographe. |
| Ordre N en double | Chaque `order` doit être unique. |
| Le fichier dépasse 5 Mo ou est vide | Allégez le fichier. Maximum 500 questions. |
| Seuls les fichiers .xlsx et .csv sont acceptés | N’envoyez pas un `.xls` ancien ni un PDF. |
| Les formules Excel ne sont pas acceptées | Remplacez `=`, `+` ou `@` par la valeur écrite en dur. |

### Attention

Rien n’est enregistré avant **Importer N questions**. **Remplacer toutes les questions existantes** supprime les questions actuelles de cette scorecard. Cette action n’est jamais faite seule.

[CAPTURE 09 — Import Excel]

Page : fenêtre **Importer un questionnaire**. Montrez **Télécharger le modèle Excel** et la zone de dépôt.

[CAPTURE 10 — Aperçu d’import]

Page : même fenêtre après un fichier valide. Montrez le décompte, le tableau et les deux choix Ajouter / Remplacer.

---

## 8. Catégories

L’étape **Categories** gère les catégories de questions (le regroupement affiché à côté de la question). L’étape **Scoring** gère les catégories qui portent le poids et les messages de niveau.

### Chemin

Builder → Categories, puis Builder → Scoring

### Catégorie de question

Créez une catégorie, donnez-lui un nom, une description, une icône et un poids. Rattachez-la dans Questions, champ **Catégorie**. Supprimer la catégorie ne supprime pas les questions : elles restent, sans cette catégorie.

### Catégorie de scoring

Dans Scoring, **Nouvelle catégorie** crée une ligne « Nouvelle catégorie ». Champs : nom, description, poids, score maximum, message haut, message moyen, message bas.

Exemple simple :

| Catégorie | Poids | Message haut | Message moyen | Message bas |
| --- | --- | --- | --- | --- |
| Experience | 40 | Solide expérience | Bonne base | Expérience à renforcer |
| Méthode | 60 | Pratique solide | Bases en place | Méthode à structurer |

Dans Questions, chaque question notée doit avoir une **Catégorie de scoring**.

[CAPTURE 11 — Categories et Scoring]

Deux vues : la liste Categories, puis Scoring avec les poids et le total 100 %.

---

## 9. Scoring

Le participant ne voit pas les points. Vous les définissez. L’application additionne les points des réponses, tient compte du poids de chaque catégorie de scoring, puis place le pourcentage dans une plage de Results.

- **Points** : valeur de chaque option, ou de la position sur une échelle.
- **Poids** : part de la catégorie dans le score final. La somme doit être **100 %**. L’écran l’indique : « La somme des poids est N %. Elle doit être égale à 100 %. »
- **Score final** : un pourcentage.
- **Seuils** : les plages de l’étape Results, de 0 à 100, sans trou et sans chevauchement.

S’il n’y a aucune catégorie de scoring, le contrôle des 100 % ne bloque pas. Dès qu’il y en a une, le total doit faire 100 et chaque question notée doit y être rattachée.

Il n’y a pas de simulateur séparé. Pour voir un résultat, utilisez Preview puis le questionnaire public de test avant publication, ou après publication sur l’adresse de la scorecard.

### Exemple de seuils

Ces chiffres sont un exemple, pas ceux d’une scorecard déjà créée.

| Score | Titre |
| --- | --- |
| 0–39 % | Préparation nécessaire |
| 40–74 % | Niveau intermédiaire |
| 75–100 % | Niveau avancé |

L’écran Results propose aussi, comme illustration vide : 0–39, 40–59, 60–79, 80–100.

[CAPTURE 12 — Scoring à 100 %]

Page : Scoring. Montrez la phrase sur la somme des poids lorsqu’elle n’est pas à 100, puis une somme correcte.

---

## 10. Lead Capture

Un **lead** est une personne identifiée par le formulaire : au minimum les champs que vous avez rendus obligatoires, souvent l’email.

### Chemin

Builder → Lead Capture

### Moment du formulaire

| Libellé | Moment |
| --- | --- |
| Avant le questionnaire | Avant la première question. |
| Pendant le questionnaire | Au milieu du parcours. |
| Avant les résultats | Après les questions, avant le niveau affiché. |
| Après les résultats | Une fois le niveau montré. |

### Champs disponibles

Pour chacun : affiché ou non, obligatoire ou non, libellé, texte d’aide.

Prénom, Nom, Email, Téléphone, WhatsApp, Entreprise, Fonction, Pays, Ville.

Le consentement peut être exigé. Le texte par défaut commence par « J'accepte que WOLOYEM utilise mes informations… ». Vous pouvez le modifier et indiquer l’adresse de la politique de confidentialité.

### Attention

Si le consentement est exigé, le texte doit contenir au moins huit caractères, sinon la publication affiche « Le texte de consentement est requis. »

[CAPTURE 13 — Lead Capture]

Page : Lead Capture. Montrez le moment du formulaire et les champs Prénom, Nom, Email.

---

## 11. Results

### Chemin

Builder → Results

Chaque plage a un minimum et un maximum en pourcentage, un libellé interne, un titre, une description, un badge, une recommandation (titre et texte), un libellé de bouton (CTA) et une URL.

Exemple, à adapter :

| Min | Max | Titre public | Badge | Bouton |
| --- | --- | --- | --- | --- |
| 0 | 39 | Préparation nécessaire | Needs Preparation | Découvrir nos formations |
| 40 | 74 | Niveau intermédiaire | Intermédiaire | Voir le parcours |
| 75 | 100 | Niveau avancé | Avancé | Échanger avec un conseiller |

### Résultat attendu

Toute personne qui termine tombe dans une seule plage. Les plages doivent commencer à 0, finir à 100, sans trou et sans chevauchement. Sinon la publication dit « Les plages ne commencent pas à 0. », « Les plages ne couvrent pas 100. » ou signale un chevauchement.

### Attention

Un bouton avec un texte mais sans adresse web valide bloque la publication : « Un CTA a un libellé sans URL valide. »

[CAPTURE 14 — Results]

Page : Results. Montrez au moins deux plages, avec titre, badge et CTA.

---

## 12. Preview

### Chemin

Builder → Preview, ou le bouton Preview de l’en-tête.

Vous voyez la scorecard telle qu’elle sera présentée, sans la publier. Parcourez-la comme un participant.

### Checklist

- Landing Page : titre, bouton, bénéfices
- Questions : ordre, textes, questions obligatoires
- Scores : points et catégories de scoring
- Lead form : moment, champs, consentement
- Results : une plage pour chaque score possible
- CTA : libellé et lien
- Mobile : réduisez la fenêtre ou utilisez le téléphone

[CAPTURE 15 — Preview]

Page : Preview. Montrez la page d’accueil du diagnostic et le bouton de démarrage.

[CAPTURE 16 — Preview mobile]

Même écran, largeur téléphone.

---

## 13. Publication

Une scorecard a quatre statuts : **Brouillon**, **Publiée**, **En pause**, **Archivée**. Seule une scorecard **Publiée** accepte de nouveaux participants. En pause, la page ne démarre pas de session.

### Objectif

Rendre le diagnostic accessible.

### Chemin

Builder → Publish → Publier

### Étapes

1. Cliquez sur **Publish**.
2. Lisez la liste. Le titre est **Ready to publish?** si tout est bon, sinon **Cannot publish**.
3. Corrigez chaque ligne marquée « – ».
4. Cliquez sur **Publier**. Le message « Scorecard publiée. » confirme.

Contrôles affichés :

| Ligne | Il faut |
| --- | --- |
| Nom | Au moins 2 caractères. |
| Slug | Minuscules, chiffres et tirets. |
| Landing page | Un titre public. |
| N questions | Au moins une question. |
| Question notée | Au moins une question scorée. |
| Scoring configured | Poids à 100 % s’il y a des catégories, et chaque question notée rattachée. |
| Result ranges configured | Plages de 0 à 100, continues. |
| CTA | Pas de libellé sans URL. |
| Lead capture configured | Formulaire valide. |
| Privacy consent configured | Texte de consentement si le consentement est exigé. |

### Résultat attendu

L’adresse publique est :

`https://scorapp-xp.vercel.app/s/votre-slug`

Elle est aussi indiquée sur la fiche scorecard. Le statut passe à **Publiée**.

### Attention

Changer le statut en **Publiée** dans Setup déclenche les mêmes contrôles. S’ils échouent, l’enregistrement refuse la publication.

[CAPTURE 17 — Publish]

Fenêtre Publish, de préférence avec la liste des contrôles et le bouton **Publier**.

---

## 14. Parcours du participant

Adresse : `https://scorapp-xp.vercel.app/s/votre-slug`

1. **Landing page.** Le visiteur lit le titre et clique sur le bouton, souvent **Commencer**.
2. **Informations.** Si le formulaire est « Avant le questionnaire », il saisit les champs demandés et le consentement.
3. **Questions.** Une à une, dans l’ordre du builder. Une question obligatoire sans réponse empêche d’avancer. Il peut reprendre plus tard là où il s’est arrêté, tant que la session n’est pas terminée.
4. **Terminer.** Le score est calculé. Les points restent invisibles.
5. **Résultat.** Le titre, le texte, le badge et le bouton de la plage correspondante. Selon le réglage, le formulaire peut encore apparaître avant ou après ce résultat.
6. **Rapport.** Si les rapports sont activés pour la scorecard, une page Rapport est proposée. Le PDF peut mettre un moment à être prêt.

Une scorecard en brouillon n’est pas publique. Une scorecard en pause n’ouvre pas de nouvelle session.

[CAPTURE 18 — Page publique]

Page `https://scorapp-xp.vercel.app/s/...` d’une scorecard publiée de test. Masquez les données personnelles.

[CAPTURE 19 — Résultat participant]

Page de résultat, avec le titre de la plage et le CTA. Pas de points visibles.

---

## 15. Leads

### Chemin

Leads

### Consulter

La liste montre le nom, la température, le statut, le score en pourcentage, le pays et la scorecard. Cliquez un nom pour la fiche.

### Rechercher et filtrer

Champ **Rechercher un lead** : nom, email, téléphone, entreprise.

Filtres : Scorecard, Statut, Température, Pays, Tag, Résultat, Source, Campagne, CTA (**CTA cliqué** ou **Sans clic**), score minimum, score maximum, dates Du et Au.

Tri : **Plus récents**, **Plus anciens**, **Score décroissant**, **Score croissant**, **Nom**, **Pays**.

### Température

Calculée automatiquement.

| Affiché | Règle |
| --- | --- |
| Chaud | Score d’au moins 75 %, ou clic sur le CTA. |
| Tiède | Score d’au moins 40 %, sans être chaud. |
| Froid | En dessous, ou sans score. |

### Statut

Vous le changez à la main : **Nouveau**, **Contacté**, **Qualifié**, **Nurturing**, **Converti**, **Perdu**. Nurturing reste le libellé anglais de l’écran.

### Tags, notes, conversion

Sur la fiche, menu **Ajouter un tag**, ou **Nouveau tag** avec une couleur. La note a pour indication « Visible uniquement par l'équipe. » Le bloc conversion demande un type, une valeur, une devise (par exemple XOF), une référence et un commentaire.

La fiche montre aussi l’historique des actions liées au lead (réponses, changements, clic CTA) lorsqu’ils ont été enregistrés.

### Export CSV

Liens **Exporter le filtre**, **Exporter tout**, **Exporter la sélection**, et **Exporter** sur la fiche. Réservé au propriétaire, à l’administrateur et à l’analyste. Un éditeur voit les leads mais ne les modifie pas et ne les exporte pas.

[CAPTURE 20 — Liste des leads]

Page : Leads. Montrez la recherche, Température, Statut et un lead chaud.

[CAPTURE 21 — Fiche lead]

Page : fiche. Montrez statut, tag, note et **Exporter**. Masquez l’email si la capture doit circuler.

---

## 16. Analytics

### Chemin

Analytics

Même filtre de période que le Dashboard. La page reprend le rapport commercial, puis un résumé de conversion (clics CTA, leads, conversions, valeurs, par scorecard et par campagne).

Le bloc **Rapports** compte : **Générés**, **Téléchargés**, **Partagés**, **Emails**.

Chaque scorecard a aussi **Analytics** sur sa fiche : volume, complétion et questions (où les gens s’arrêtent).

| Indicateur | En clair |
| --- | --- |
| Leads | Personnes identifiées. |
| Completed Assessments | Questionnaires terminés. |
| Taux de complétion | Part des sessions arrivées au bout. |
| Average Score | Moyenne des pourcentages. |
| Hot Leads | Leads chauds. |
| CTA Click Rate | Part des résultats vus qui ont cliqué le bouton. |
| Conversion | Clics CTA rapportés aux évaluations terminées, puis saisies de conversion sur la fiche lead. |
| Sources et campagnes | Filtres Leads et bloc conversion, quand l’adresse publique a été ouverte avec ces informations. |
| Pays | Filtre et colonne Leads. |
| Répartition des résultats | Graphique du Dashboard, selon les plages de chaque scorecard. |
| Top scorecards | Les diagnostics les plus actifs. |

[CAPTURE 22 — Analytics]

Page : Analytics. Montrez la période, un indicateur et le bloc Rapports.

---

## 17. Rapports

Les réglages d’organisation sont dans **Settings → Rapports** : marque, site, email de contact, pied de page, bouton **Enregistrer**.

Dans le builder, l’étape liée aux résultats permet d’activer le rapport de la scorecard (PDF, catégories, points forts, axes de progrès, CTA, mention). Le score officiel reste celui de l’évaluation. Un texte d’analyse ne le modifie pas.

| Document | Qui le voit |
| --- | --- |
| Page de résultat | Le participant : titre, texte, badge, bouton. Pas les points. |
| Rapport participant | Synthèse qu’il peut ouvrir ou télécharger. |
| Informations internes | Notes de lead, export, détails d’équipe. Elles ne sont pas sur la page publique. |

Génération : à la fin du questionnaire, si le rapport est activé. Le PDF peut rester « pas encore prêt » quelques instants. Le téléchargement se fait depuis la page Rapport. Un lien de partage peut expirer ou être révoqué depuis les actions de rapport de la fiche lead, lorsqu’elles sont proposées.

Les compteurs Générés, Téléchargés, Partagés et Emails sont dans Analytics.

Si l’envoi par email n’aboutit pas, voir le dépannage. Ne considérez pas un rapport « généré » comme un email reçu.

[CAPTURE 23 — Réglages Rapports]

Page : Settings → Rapports. Montrez Marque, Site, Email de contact, Pied de page.

[CAPTURE 24 — Rapport participant]

Page publique Rapport, sans donnée personnelle réelle.

---

## 18. Équipe

### Chemin

Settings → Équipe

Le propriétaire et l’administrateur voient la page. Les autres rôles voient « Permission refusée. »

| Rôle affiché | Peut | Ne peut pas |
| --- | --- | --- |
| Propriétaire (Owner) | Tout ce qui suit, plus la facturation (changement de plan et portail), le transfert de propriété. | Supprimer l’organisation : l’écran l’indique comme indisponible. |
| Administrateur (Admin) | Scorecards, publication, leads (lecture, modification, export), rapports, analytics, équipe, intégrations, voir la facturation. | Changer le plan, transférer la propriété, retirer un autre propriétaire, supprimer l’organisation. |
| Éditeur (Editor) | Modifier et publier les scorecards, lire les leads, les rapports et les analytics. | Exporter ou modifier les leads, inviter, facturer, intégrer. |
| Analyste (Analyst) | Lire et exporter les leads, lire rapports et analytics, voir la facturation. | Modifier une scorecard, inviter, changer un lead. |
| Lecteur (Viewer) | Lire leads, rapports et analytics. | Modifier, exporter, inviter, facturer. |
| Membre (Member) | Comme le lecteur. | Comme le lecteur. |

Sur Settings, les libellés sont : Propriétaire, Administrateur, Éditeur, Analyste, Lecteur, Membre. Sur la page Équipe, le rôle technique peut s’afficher en anglais (`owner`, `admin`, etc.).

### Inviter

### Chemin

Settings → Équipe → Inviter

### Étapes

1. Saisissez l’email et le rôle.
2. Cliquez sur **Inviter**.
3. Le message « Invitation envoyée. » confirme l’enregistrement de l’invitation.
4. La personne ouvre le lien reçu, crée son accès si besoin, et rejoint l’organisation.

### Transférer la propriété

Bouton **Transférer la propriété à …**, visible seulement pour le propriétaire. Vous devenez administrateur. L’autre personne devient propriétaire. On ne retire pas le dernier propriétaire.

[CAPTURE 25 — Équipe]

Page : Équipe. Montrez la liste des rôles et **Inviter**. Masquez les emails si la capture est partagée.

---

## 19. Settings

Menu **Settings**, puis les liens :

| Lien | Ce que vous y faites |
| --- | --- |
| Profil | Nom affiché. L’email de connexion est rappelé, il ne se change pas sur cet écran. Aussi présent sur la page Settings principale. |
| Organisation | Nom, slug, votre rôle. La page dédiée reprend les informations de l’organisation. |
| Équipe | Invitations et transfert. |
| Facturation | Plan et usage. |
| Domaines | Adresse propre, si le plan le permet. |
| Intégrations | Webhooks, Brevo, clés, règles. |
| Rapports | Marque et pied de page des rapports. |
| IA | Mode d’analyse. Voir le chapitre 25 si le message dit que l’analyse n’est pas configurée. |

Le menu du compte propose aussi **Paramètres**, qui ouvre Settings.

[CAPTURE 26 — Settings]

Page : Settings. Montrez les liens Profil, Organisation, Équipe, Facturation, Domaines, Intégrations, Rapports, IA.

---

## 20. Intégrations

### Chemin

Settings → Intégrations

Réservé à la modification par le propriétaire et l’administrateur. Les autres voient l’état sans les boutons d’écriture, ou un refus selon l’écran.

### Webhooks

Une adresse externe reçoit un événement (nouveau lead, résultat, etc.). Boutons : **Tester**, **Activer** ou **Désactiver**, **Supprimer**. Vous choisissez les événements. N’écrivez pas de secret dans une capture.

### Brevo

Champs : **Clé API Brevo** (laissez vide pour garder la clé déjà enregistrée), **ID de liste**, case de consentement pour les résultats. Bouton **Enregistrer Brevo**. L’écran dit « Brevo est actif. » ou « Brevo est inactif. »

L’invitation et les emails de rapport passent par l’envoi transactionnel de l’organisation. Si le fournisseur n’a pas activé l’envoi, l’email n’arrive pas. Voir le dépannage.

### Clés d’API

**Créer** une clé pour un outil externe. La clé complète n’est montrée qu’une fois. Ensuite, seul un préfixe reste visible. Vous pouvez la révoquer.

### Règles

**Créer la règle** relie un déclencheur à une action, par exemple **Synchroniser vers Brevo**.

[CAPTURE 27 — Intégrations]

Page : Intégrations. Montrez les titres Webhooks et Brevo. Masquez toute clé.

---

## 21. Facturation

### Chemin

Settings → Facturation

Le propriétaire gère le plan. L’administrateur et l’analyste peuvent consulter. Les autres voient « Permission refusée. »

L’écran affiche **Current plan**, le rythme Monthly ou Yearly, le statut, **Next billing** ou « Sans échéance Stripe », puis **Current usage** : Assessments, Leads, Scorecards, Team members, avec la limite du plan.

**Changer de plan** propose Starter, Pro et Business, au mois, et Pro à l’année. **Upgrade plan** apparaît aussi depuis Domaines si le plan ne permet pas un domaine.

Après paiement, le texte « Paiement reçu par Stripe. Le plan est activé après confirmation du webhook. » peut s’afficher. Le plan change quand la confirmation est arrivée, pas à la seconde du paiement.

Si l’usage dépasse le nouveau plan : « Your current usage exceeds your new plan limit. »

Le plan **internal** n’est pas une offre publique. S’il est actif, le bouton du portail de facturation et **Changer de plan** ne s’affichent pas. C’est le cas possible de l’organisation WOLOYEM. Ne le proposez pas à un client comme un abonnement à souscrire.

**Danger Zone** : « La suppression d'organisation n'est pas disponible tant que Stripe et le stockage ne sont pas audités. » Il n’y a pas de bouton de suppression.

Quand une limite est atteinte, la création correspondante (scorecard, lead, démarrage d’évaluation ou membre) est refusée. La facturation indique alors l’usage au plafond. Passez à un plan supérieur, ou attendez le mois suivant pour les compteurs mensuels (évaluations et leads).

[CAPTURE 28 — Facturation]

Page : Facturation. Montrez Current plan et Current usage. Si le plan est internal, montrez l’absence de **Changer de plan**.

---

## 22. Domaines

### Chemin

Settings → Domaines

Le propriétaire et l’administrateur y accèdent. Les adresses `https://scorapp-xp.vercel.app/s/votre-slug` restent valides.

Si le plan ne comprend pas l’option : « Les domaines personnalisés sont disponibles à partir du plan Business. » avec le lien **Upgrade plan**.

### Ce que vous faites

1. Saisissez le domaine, par exemple `score.client.com`, et le slug par défaut.
2. Cliquez sur **Ajouter**.
3. Chez l’hébergeur DNS du domaine (pas dans WOLOYEM Score), créez l’enregistrement indiqué : type, hôte et valeur.
4. Revenez et cliquez sur **Vérifier**.
5. Le statut passe à vérifié lorsque l’enregistrement est visible. **Retirer** enlève le domaine de l’organisation.

### Ce que vous ne faites pas dans l’application

La création DNS se fait chez l’hébergeur du nom de domaine. Le certificat de sécurité n’est pas un bouton de WOLOYEM Score.

**Non disponible actuellement** si l’écran affiche « Vercel domain automation is not configured. » Dans ce cas, l’activation SSL automatique n’est pas en place. N’annoncez pas un domaine client comme actif tant que le statut n’est pas vérifié et que l’adresse ne s’ouvre pas.

[CAPTURE 29 — Domaines]

Page : Domaines. Montrez le champ domaine, **Ajouter** et un statut. Masquez la valeur secrète de vérification si elle ne doit pas circuler. Vous pouvez montrer seulement le type d’enregistrement.

---

## 23. Dépannage

### La scorecard reste en brouillon

Symptôme : statut **Brouillon**, page publique indisponible.

Cause probable : **Publish** n’a pas été confirmé, ou un contrôle a échoué.

Solution : Builder → **Publish**. Corrigez chaque ligne « – », puis **Publier**.

### Publication impossible

Symptôme : titre **Cannot publish**.

Cause probable : question notée manquante, poids différents de 100 %, plage incomplète, titre de landing vide, consentement vide, CTA sans lien.

Solution : lisez le détail sous la ligne. Les messages utiles sont « Ajoutez au moins une question notée. », « La somme des poids doit être égale à 100 %. », « Chaque question notée doit avoir une catégorie de scoring. », « Aucune plage de résultat. », « Les plages ne commencent pas à 0. », « Les plages ne couvrent pas 100. »

### Une question ne change pas le score

Symptôme : la réponse n’influence pas le pourcentage.

Cause probable : la case Scorée est décochée, ou la question n’a pas de catégorie de scoring, ou les options ont toutes 0 point.

Solution : Questions → Scorée, catégorie de scoring, points des options. Les questions Texte court, Texte long, Email et Téléphone sont souvent non notées. C’est normal si vous voulez seulement recueillir une information.

### Les poids ne font pas 100 %

Symptôme : bandeau sur Scoring, publication refusée.

Cause probable : somme différente de 100, ou une catégorie oubliée.

Solution : ajustez les poids jusqu’à 100 %. S’il ne doit pas y avoir de catégories, supprimez-les.

### Le fichier Excel est refusé

Symptôme : liste Ligne / colonne / message, ou refus avant l’aperçu.

Cause probable : colonne renommée, type inventé, score en lettres, catégorie absente, fichier trop lourd, formule.

Solution : repartez du modèle téléchargé. Voir le tableau du chapitre Import Excel.

Si le bouton lui-même échoue sans ce détail : **Non disponible actuellement** tant que la version n’est pas déployée et la migration appliquée.

### L’adresse publique est incorrecte

Symptôme : page introuvable ou ancienne scorecard.

Cause probable : slug différent, scorecard non publiée, ou mauvaise organisation.

Solution : copiez l’adresse indiquée sur la fiche : `https://scorapp-xp.vercel.app/s/` suivi du slug. Vérifiez le statut **Publiée**.

### L’email n’arrive pas

Symptôme : « Invitation envoyée. » mais rien dans la boîte, ou rapport non reçu.

Cause probable : courrier indésirable, ou envoi non activé chez le fournisseur. Un statut d’envoi dans l’application ne prouve pas que la boîte a reçu le message.

Solution : vérifiez les indésirables. Settings → Intégrations → Brevo doit être actif, avec une clé valide. Si l’envoi transactionnel n’est pas activé chez le fournisseur, l’email ne part pas : **Non disponible actuellement** pour la réception garantie.

### Le PDF n’est pas encore disponible

Symptôme : la page Rapport existe, le téléchargement répond que le fichier n’est pas prêt.

Cause probable : la génération n’est pas terminée, ou les rapports sont désactivés sur la scorecard.

Solution : attendez et réessayez. Vérifiez le réglage de rapport de la scorecard et Settings → Rapports.

### Le domaine reste en attente

Symptôme : statut non vérifié.

Cause probable : l’enregistrement DNS n’est pas encore visible, ou l’automatisation SSL affiche « Vercel domain automation is not configured. »

Solution : contrôlez l’enregistrement chez l’hébergeur, attendez la propagation, cliquez sur **Vérifier**. Sans automatisation configurée, ne comptez pas sur l’activation SSL depuis cet écran.

### Le lien magique est refusé

Symptôme : « Le lien de connexion n'est plus valable. Demandez-en un nouveau. »

Cause probable : lien déjà utilisé ou trop ancien.

Solution : recommencez depuis **Lien magique**.

---

## 24. Avant de publier une scorecard

- [ ] Nom et slug vérifiés (slug en minuscules, unique)
- [ ] Landing Page : titre et bouton **Commencer** (ou le texte choisi)
- [ ] Questions relues, ordre vérifié par glisser-déposer
- [ ] Au moins une question scorée, points relus
- [ ] Chaque question notée a une catégorie de scoring
- [ ] Poids = 100 % s’il existe des catégories de scoring
- [ ] Lead Capture : moment, champs, consentement
- [ ] Result ranges de 0 à 100, sans trou ni chevauchement
- [ ] Chaque CTA a un libellé et une URL, ou aucun des deux
- [ ] Preview relue sur grand écran
- [ ] Preview relue en largeur mobile
- [ ] Questionnaire testé de bout en bout sur `https://scorapp-xp.vercel.app/s/votre-slug` après **Publier**
- [ ] Statut **Publiée** visible dans Scorecards

---

## 25. Fonctionnalités non disponibles actuellement

Ces éléments existent parfois à l’écran, mais ne doivent pas être présentés comme opérationnels.

| Sujet | Situation |
| --- | --- |
| Import ScoreApp | Le champ clé API et le bouton **Importer depuis ScoreApp** sont dans la fenêtre d’import. L’import n’a pas été validé de bout en bout en production. Ne le proposez pas comme une procédure fiable. |
| Confirmation d’import Excel en production | Le bouton **Importer des questions** est dans cette version du builder. Il n’est opérationnel en production qu’après déploiement et application de la migration d’import. |
| Connexion Google | La page Connexion indique que Google pourra être ajouté plus tard. Seuls le mot de passe et le lien magique fonctionnent. |
| Suppression d’organisation | Danger Zone : explicitement non disponible. |
| Analyse IA | La page IA permet Désactivée, Manuelle ou Automatique. Si le texte « L'analyse IA n'est pas configurée. » s’affiche, aucune analyse n’est produite. L’IA ne modifie jamais le score, même lorsqu’elle est branchée. |
| SSL automatique des domaines | Si « Vercel domain automation is not configured. » s’affiche, l’activation automatique n’est pas en place. |
| Graphique Sources des leads | Peut afficher « Sources à venir ». |
| Réception d’email | L’invitation peut être enregistrée sans que le message arrive, tant que l’envoi du fournisseur n’est pas activé. |
| Plan internal | Réglage interne. Ce n’est pas une offre commerciale à présenter. |
