
# Feature Specification: Authentification utilisateur

## Core Principles

### User-Centric Document Access
The system MUST provide a clear, accessible interface for users to search, view, and archive documents. All features MUST be designed for simplicity and clarity.

### Accessibility (RGAA Compliance)
All user-facing features MUST comply with RGAA accessibility standards. Accessibility is non-negotiable and must be validated for every release.

### Test-Driven Development & Quality Gates
All business logic MUST be covered by Jest tests. Every feature MUST be tested with MCP Chrome DevTools. Linting MUST pass with Biome before merge. No code is considered done until these gates are met.

### Modern Web Stack Discipline
The stack is Next.js (Vercel), S3, PostgreSQL, Tailwind CSS, Headless UI. All code MUST use these technologies unless a justified exception is approved in writing.

### Independent, Incremental Delivery
Each user story/feature MUST be independently testable and deliver value on its own. Features are delivered incrementally, with each increment validated before proceeding.

### Language and Style Discipline
All code MUST be written in English. All specifications (spec.md, user stories, requirements) MUST be written in French. No emoji are permitted in any code, documentation, or specifications.

**Feature Branch**: `001-user-auth`  
**Created**: 2025-12-23  
**Status**: Draft  
**Input**: User description: "on va commencer par mettre en place l'authent, c'est une authent classique, avec création de compte, username / email / mdp, en gardant à l'esprit que plus tard il pourrait y avoir la possibilité de se connecter avec des comptes tiers (google, microsoft...)"

## Clarifications

### Session 2025-12-23

- Q: Lorsque le système ne parvient pas à envoyer un email critique (ex: lien de réinitialisation de mot de passe, notification de verrouillage), comment doit-il réagir ? → A: Échec immédiat visible - L'utilisateur voit un message d'erreur indiquant que l'email n'a pas pu être envoyé et doit réessayer

- Q: Le système doit tracker les tentatives de connexion échouées pour implémenter le verrouillage après 5 échecs. Comment ce compteur doit-il être réinitialisé ? → A: Réinitialisation après connexion réussie - Le compteur se remet à zéro uniquement après une authentification réussie

- Q: Les sessions utilisent des tokens pour maintenir l'authentification. Quelle stratégie de tokens doit être utilisée ? → A: JWT (JSON Web Tokens) stateless - Tokens auto-contenus signés, validation sans DB sauf pour vérifier blacklist en cas de révocation

- Q: Le système doit valider que l'adresse email existe réellement et appartient à l'utilisateur. Quelle stratégie de vérification d'email doit être mise en place ? → A: Vérification obligatoire par email de confirmation - Compte créé mais accès limité/bloqué jusqu'à confirmation via lien email (24h)

- Q: De nombreux systèmes d'authentification offrent une option "Se souvenir de moi" pour prolonger la durée de session. Cette fonctionnalité doit-elle être incluse dans ce MVP ? → A: Oui, avec refresh tokens - Implémenter refresh tokens longue durée (7-30 jours) avec renouvellement automatique

## User Scenarios & Testing *(mandatory)*

**All user stories/features MUST:**
- Be independently testable and deliver value
- Be RGAA compliant (accessibility)
- Have all business logic tested with Jest
- Be validated with MCP Chrome DevTools
- Pass Biome linting

### User Story 1 - Création de compte utilisateur (Priority: P1)

Un nouvel utilisateur souhaite créer un compte pour accéder à l'application. Il fournit un nom d'utilisateur, une adresse email et un mot de passe. Le système valide ces informations et crée le compte.

**Why this priority**: Cette histoire est la plus critique car elle représente le point d'entrée principal pour tout nouveau utilisateur. Sans création de compte, aucune autre fonctionnalité d'authentification n'a de sens. C'est le MVP absolu du système d'authentification.

**Independent Test**: Peut être testé complètement en remplissant le formulaire de création de compte avec des données valides et en vérifiant que le compte est créé avec succès et que l'utilisateur peut se connecter immédiatement après.

**Acceptance Scenarios**:

1. **Given** un utilisateur non authentifié sur la page de création de compte, **When** il saisit un nom d'utilisateur valide (3-30 caractères), une adresse email valide et un mot de passe sécurisé (minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial), **Then** le compte est créé avec succès et l'utilisateur est redirigé vers l'application avec une session active.

2. **Given** un utilisateur non authentifié sur la page de création de compte, **When** il tente de créer un compte avec une adresse email déjà utilisée, **Then** le système affiche un message d'erreur clair indiquant que l'email existe déjà et propose de se connecter ou de réinitialiser le mot de passe.

3. **Given** un utilisateur en train de remplir le formulaire de création de compte, **When** il saisit un mot de passe ne respectant pas les critères de sécurité, **Then** le système affiche en temps réel les critères non respectés avec des indications visuelles claires (accessibles RGAA).

4. **Given** un utilisateur non authentifié sur la page de création de compte, **When** il tente de créer un compte avec un nom d'utilisateur déjà pris, **Then** le système affiche un message d'erreur et suggère des variantes disponibles.

5. **Given** un utilisateur venant de créer un compte, **When** la création est réussie, **Then** un email de vérification contenant un lien unique valide pour 24 heures est envoyé à l'adresse email fournie, et le compte est marqué comme "non vérifié".

6. **Given** un utilisateur avec un compte non vérifié, **When** il tente de se connecter ou d'accéder à l'application, **Then** l'accès est bloqué et un message indique qu'il doit vérifier son email avant de continuer, avec option de renvoyer l'email de vérification.

7. **Given** un utilisateur ayant reçu un email de vérification, **When** il clique sur le lien de vérification valide, **Then** son compte est marqué comme "vérifié" et il obtient immédiatement accès à l'application avec une session active.

8. **Given** un utilisateur tentant de vérifier son email, **When** le lien de vérification a expiré (plus de 24 heures), **Then** le système affiche un message d'erreur et propose de renvoyer un nouveau lien de vérification.

---

### User Story 2 - Connexion avec identifiants (Priority: P1)

Un utilisateur existant souhaite se connecter à son compte en utilisant son email (ou nom d'utilisateur) et son mot de passe. Le système vérifie les identifiants et établit une session sécurisée.

**Why this priority**: Cette histoire est aussi critique que la création de compte car elle permet aux utilisateurs existants d'accéder à l'application. Sans connexion fonctionnelle, les comptes créés seraient inutiles. C'est la deuxième partie du MVP d'authentification.

**Independent Test**: Peut être testé en créant un compte au préalable, puis en se déconnectant et en se reconnectant avec les mêmes identifiants. Vérifie que l'accès est accordé et qu'une session active est établie.

**Acceptance Scenarios**:

1. **Given** un utilisateur existant sur la page de connexion, **When** il saisit son email (ou nom d'utilisateur) et son mot de passe corrects, **Then** il est authentifié avec succès et redirigé vers l'application avec une session active.

2. **Given** un utilisateur sur la page de connexion, **When** il saisit des identifiants incorrects, **Then** le système affiche un message d'erreur générique (pour des raisons de sécurité) sans révéler si c'est l'email ou le mot de passe qui est incorrect.

3. **Given** un utilisateur qui tente de se connecter, **When** il échoue 5 fois consécutivement, **Then** le compte est temporairement verrouillé pour 15 minutes et un email de notification est envoyé à l'utilisateur.

4. **Given** un utilisateur connecté, **When** il reste inactif pendant 30 minutes, **Then** sa session expire automatiquement et il doit se reconnecter pour continuer.

5. **Given** un utilisateur ayant eu des tentatives de connexion échouées, **When** il se connecte avec succès avec les bons identifiants, **Then** le compteur de tentatives échouées est remis à zéro.

6. **Given** un utilisateur dont le compte est verrouillé (5 échecs), **When** il tente de se connecter avec les bons identifiants pendant la période de verrouillage de 15 minutes, **Then** l'accès reste refusé jusqu'à la fin du délai de verrouillage.

7. **Given** un utilisateur sur la page de connexion, **When** il coche l'option "Se souvenir de moi" et se connecte avec succès, **Then** le système génère un refresh token valide pour 30 jours en plus du token de session standard de 30 minutes.

8. **Given** un utilisateur avec un refresh token valide, **When** son token de session expire après 30 minutes d'inactivité, **Then** le système renouvelle automatiquement le token de session en utilisant le refresh token sans demander de nouvelle connexion.

9. **Given** un utilisateur avec un refresh token, **When** il change son mot de passe ou se déconnecte explicitement, **Then** le refresh token est immédiatement révoqué et ajouté à la blacklist.

---

### User Story 3 - Réinitialisation de mot de passe (Priority: P2)

Un utilisateur ayant oublié son mot de passe peut demander une réinitialisation. Le système envoie un lien sécurisé par email permettant de définir un nouveau mot de passe.

**Why this priority**: Bien que moins critique que la création de compte et la connexion, cette fonctionnalité est essentielle pour éviter que des utilisateurs se retrouvent bloqués hors de leur compte. Elle améliore considérablement l'expérience utilisateur et réduit la charge du support.

**Independent Test**: Peut être testé en créant un compte, en se déconnectant, puis en utilisant la fonction "Mot de passe oublié". Vérifie que l'email est reçu, que le lien fonctionne et qu'un nouveau mot de passe peut être défini.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la page de connexion, **When** il clique sur "Mot de passe oublié" et saisit son adresse email, **Then** un email contenant un lien de réinitialisation valide pour 1 heure est envoyé.

2. **Given** un utilisateur ayant reçu un lien de réinitialisation, **When** il clique sur le lien et définit un nouveau mot de passe conforme aux critères de sécurité, **Then** son mot de passe est mis à jour et il peut se connecter avec ce nouveau mot de passe.

3. **Given** un utilisateur avec un lien de réinitialisation, **When** il tente d'utiliser le lien après l'expiration du délai de 1 heure, **Then** le système affiche un message d'erreur et propose de renvoyer un nouveau lien.

4. **Given** un utilisateur demandant une réinitialisation, **When** l'adresse email fournie n'existe pas dans le système, **Then** le système affiche le même message de confirmation que pour une adresse valide (pour des raisons de sécurité, ne pas révéler l'existence ou non d'un compte).

5. **Given** un utilisateur demandant une réinitialisation de mot de passe, **When** le service d'envoi d'email est indisponible ou échoue, **Then** le système affiche un message d'erreur clair indiquant que l'email n'a pas pu être envoyé et invite l'utilisateur à réessayer ultérieurement.

---

### User Story 4 - Déconnexion (Priority: P2)

Un utilisateur connecté peut se déconnecter à tout moment, ce qui termine sa session et le redirige vers la page de connexion.

**Why this priority**: Fonctionnalité importante pour la sécurité et la vie privée, notamment sur les appareils partagés. Moins critique que les stories P1 mais nécessaire pour une application complète.

**Independent Test**: Peut être testé en se connectant puis en cliquant sur le bouton de déconnexion. Vérifie que la session est terminée et qu'on ne peut plus accéder aux pages protégées sans se reconnecter.

**Acceptance Scenarios**:

1. **Given** un utilisateur authentifié, **When** il clique sur le bouton de déconnexion, **Then** sa session est terminée, tous les tokens sont invalidés et il est redirigé vers la page de connexion.

2. **Given** un utilisateur qui s'est déconnecté, **When** il tente d'accéder à une page protégée via l'historique du navigateur ou un lien direct, **Then** il est automatiquement redirigé vers la page de connexion.

3. **Given** un utilisateur qui se déconnecte, **When** il tente immédiatement de réutiliser son token JWT de session (via une requête API directe), **Then** le token est détecté comme révoqué via la blacklist et l'accès est refusé.

---

### User Story 5 - Modification des informations de compte (Priority: P3)

Un utilisateur connecté peut modifier son nom d'utilisateur, son adresse email et son mot de passe depuis les paramètres de son compte.

**Why this priority**: Fonctionnalité de confort pour les utilisateurs, mais non critique pour le fonctionnement de base du système d'authentification. Peut être implémentée après que les fonctionnalités principales sont stables.

**Independent Test**: Peut être testé en se connectant, en accédant aux paramètres du compte et en modifiant chaque information. Vérifie que les changements sont sauvegardés et appliqués immédiatement.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté dans les paramètres de son compte, **When** il modifie son nom d'utilisateur en un nom disponible et valide, **Then** le changement est enregistré immédiatement et visible dans l'interface.

2. **Given** un utilisateur connecté dans les paramètres de son compte, **When** il modifie son adresse email, **Then** un email de vérification est envoyé à la nouvelle adresse et le changement n'est effectif qu'après confirmation via le lien dans l'email.

3. **Given** un utilisateur connecté souhaitant changer son mot de passe, **When** il saisit son mot de passe actuel et un nouveau mot de passe conforme aux critères de sécurité, **Then** le mot de passe est mis à jour et l'utilisateur reçoit un email de confirmation du changement.

4. **Given** un utilisateur tentant de modifier son email, **When** il saisit une adresse déjà utilisée par un autre compte, **Then** le système refuse la modification et affiche un message d'erreur approprié.

---

### Edge Cases

- **Que se passe-t-il si un utilisateur tente de créer plusieurs comptes rapidement depuis la même adresse IP?** Le système doit implémenter un rate limiting pour prévenir les abus (maximum 3 tentatives de création de compte par IP par heure).

- **Comment le système gère-t-il les emails avec des caractères spéciaux ou internationaux (IDN)?** Le système doit accepter les emails conformes à la norme RFC 5322 et supporter les domaines internationalisés.

- **Que se passe-t-il si un utilisateur clique plusieurs fois sur le lien de réinitialisation de mot de passe?** Le lien reste valide jusqu'à son expiration ou jusqu'à ce qu'un nouveau mot de passe soit défini. Une fois utilisé, il est invalidé.

- **Comment le système gère-t-il la concurrence si un utilisateur modifie son email depuis deux appareils différents simultanément?** Le système utilise un système de vérification par email : seule la dernière demande de changement génère un lien de vérification valide, les précédents sont invalidés.

- **Que se passe-t-il si un utilisateur est connecté sur plusieurs appareils et change son mot de passe?** Toutes les sessions actives sur les autres appareils sont invalidées immédiatement, forçant une nouvelle connexion avec le nouveau mot de passe.

- **Comment gérer les noms d'utilisateur avec des espaces, caractères spéciaux ou différentes casses?** Les noms d'utilisateur sont insensibles à la casse pour la connexion, mais la casse d'origine est préservée pour l'affichage. Seuls les caractères alphanumériques, tirets et underscores sont autorisés.

- **Que se passe-t-il si la base de données est indisponible lors d'une tentative de connexion?** Le système affiche un message d'erreur générique indiquant une indisponibilité temporaire et enregistre l'incident dans les logs pour investigation.

- **Que se passe-t-il si le service d'envoi d'emails est temporairement indisponible?** Le système détecte l'échec d'envoi et affiche immédiatement un message d'erreur explicite à l'utilisateur, l'invitant à réessayer ultérieurement. L'échec est loggé comme événement de sécurité critique pour permettre le monitoring et l'intervention rapide.

- **Comment le compteur de tentatives échouées est-il géré dans le temps?** Le compteur d'échecs de connexion est remis à zéro uniquement après une connexion réussie. Il n'y a pas de réinitialisation automatique basée sur le temps. Si un compte est verrouillé, le délai de 15 minutes doit être respecté intégralement, même si l'utilisateur entre les bons identifiants pendant ce délai.

- **Comment sont gérés les tokens de session pour permettre la révocation immédiate (FR-019) avec une stratégie JWT stateless?** Les tokens de session utilisent JWT signés pour permettre la validation sans requête DB systématique. Pour la révocation immédiate (changement de mot de passe, déconnexion), une blacklist légère de tokens révoqués est maintenue en base de données et consultée lors de la validation du token. Les tokens blacklistés expirent naturellement après 30 minutes.

- **Que se passe-t-il si un utilisateur demande plusieurs fois le renvoi de l'email de vérification?** Le système invalide tous les liens de vérification précédents et génère un nouveau lien unique valide pour 24 heures. Un rate limiting de 3 demandes par heure par compte est appliqué pour prévenir les abus.

- **Un utilisateur peut-il utiliser des fonctionnalités limitées avec un compte non vérifié?** Non, l'accès à l'application est complètement bloqué tant que l'email n'est pas vérifié. Seule la page de vérification d'email avec l'option de renvoyer le lien est accessible.

- **Que se passe-t-il si un refresh token est utilisé pour renouveler une session alors qu'il a été révoqué?** Le système vérifie la blacklist lors de l'utilisation du refresh token. Si le token est révoqué, la demande est refusée et l'utilisateur doit se reconnecter complètement.

- **Comment gérer les refresh tokens sur plusieurs appareils?** Chaque appareil reçoit son propre refresh token lors de la connexion avec "Se souvenir de moi". Le changement de mot de passe révoque tous les refresh tokens de tous les appareils. La déconnexion explicite ne révoque que le refresh token de l'appareil concerné.

- **Quelle est la durée de vie exacte d'un refresh token?** 30 jours à partir de sa création. Le refresh token n'est pas renouvelé automatiquement - après 30 jours, l'utilisateur doit se reconnecter même s'il a utilisé l'application récemment.



## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un utilisateur de créer un compte avec un nom d'utilisateur, une adresse email et un mot de passe.

- **FR-002**: Le système DOIT valider que l'adresse email respecte le format standard (RFC 5322) et supporter les domaines internationalisés.

- **FR-003**: Le système DOIT imposer des critères de sécurité pour les mots de passe : minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre et un caractère spécial.

- **FR-004**: Le système DOIT vérifier l'unicité de l'adresse email et du nom d'utilisateur lors de la création de compte.

- **FR-005**: Le système DOIT afficher des messages d'erreur clairs et accessibles (RGAA) lorsque les critères de validation ne sont pas respectés.

- **FR-006**: Le système DOIT permettre à un utilisateur de se connecter avec son adresse email OU son nom d'utilisateur, associé à son mot de passe.

- **FR-007**: Le système DOIT implémenter une protection contre les attaques par force brute : verrouillage temporaire du compte après 5 tentatives de connexion échouées consécutives (durée : 15 minutes).

- **FR-008**: Le système DOIT envoyer un email de notification à l'utilisateur lorsque son compte est temporairement verrouillé.

- **FR-009**: Le système DOIT permettre à un utilisateur d'initier une réinitialisation de mot de passe en fournissant son adresse email.

- **FR-010**: Le système DOIT générer un lien de réinitialisation unique et sécurisé, valide pour une durée limitée (1 heure).

- **FR-011**: Le système DOIT envoyer le lien de réinitialisation par email et invalider tout lien précédent non utilisé.

- **FR-012**: Le système DOIT afficher un message de confirmation identique que l'adresse email existe ou non dans le système (pour ne pas révéler l'existence d'un compte).

- **FR-013**: Le système DOIT permettre à un utilisateur connecté de se déconnecter, ce qui invalide immédiatement sa session et tous les tokens associés.

- **FR-014**: Le système DOIT rediriger automatiquement les utilisateurs non authentifiés vers la page de connexion lorsqu'ils tentent d'accéder à une ressource protégée.

- **FR-015**: Le système DOIT implémenter une expiration automatique des sessions après 30 minutes d'inactivité.

- **FR-016**: Le système DOIT permettre à un utilisateur connecté de modifier son nom d'utilisateur, à condition que le nouveau nom soit disponible et respecte les critères de validation.

- **FR-017**: Le système DOIT permettre à un utilisateur connecté de modifier son adresse email avec un processus de vérification : un email de confirmation est envoyé à la nouvelle adresse et le changement n'est effectif qu'après validation.

- **FR-018**: Le système DOIT permettre à un utilisateur connecté de modifier son mot de passe après vérification de son mot de passe actuel.

- **FR-019**: Le système DOIT invalider toutes les sessions actives de l'utilisateur sur tous les appareils lorsque son mot de passe est modifié.

- **FR-020**: Le système DOIT envoyer un email de notification à l'utilisateur lorsque son mot de passe est modifié.

- **FR-021**: Le système DOIT implémenter un rate limiting sur la création de comptes : maximum 3 tentatives par adresse IP par heure.

- **FR-022**: Le système DOIT logger tous les événements de sécurité critiques (création de compte, connexion, échecs de connexion, modification de mot de passe, verrouillage de compte).

- **FR-023**: Le système DOIT stocker les mots de passe de manière sécurisée en utilisant un algorithme de hachage moderne avec salt (bcrypt, scrypt ou Argon2).

- **FR-024**: Le système DOIT gérer les noms d'utilisateur de manière insensible à la casse pour la connexion, tout en préservant la casse d'origine pour l'affichage.

- **FR-025**: Le système DOIT restreindre les caractères autorisés dans les noms d'utilisateur : uniquement alphanumériques, tirets (-) et underscores (_), longueur entre 3 et 30 caractères.

- **FR-026**: L'architecture du système d'authentification DOIT être conçue pour faciliter l'ajout futur de méthodes d'authentification tierces (OAuth2 avec Google, Microsoft, etc.) sans nécessiter une refonte majeure.

- **FR-027**: Le système DOIT détecter les échecs d'envoi d'emails critiques (réinitialisation de mot de passe, notifications de sécurité) et afficher un message d'erreur explicite à l'utilisateur, l'invitant à réessayer ultérieurement.

- **FR-028**: Le système DOIT logger tous les échecs d'envoi d'emails comme événements de sécurité critiques pour permettre le monitoring et l'intervention rapide des administrateurs.

- **FR-029**: Le système DOIT réinitialiser le compteur de tentatives de connexion échouées uniquement après une authentification réussie. Aucune réinitialisation automatique basée sur le temps n'est permise.

- **FR-030**: Le système DOIT maintenir le verrouillage du compte pendant toute la durée de 15 minutes, même si l'utilisateur fournit les bons identifiants pendant cette période. Le verrouillage ne peut être levé qu'après l'expiration complète du délai.

- **FR-031**: Le système DOIT utiliser des tokens JWT (JSON Web Tokens) signés pour les sessions, contenant les informations nécessaires à la validation stateless (identifiant utilisateur, date d'expiration, rôles si applicable).

- **FR-032**: Le système DOIT maintenir une blacklist de tokens révoqués en base de données pour permettre la révocation immédiate lors d'événements de sécurité (changement de mot de passe, déconnexion explicite).

- **FR-033**: Le système DOIT vérifier la blacklist lors de la validation de chaque token JWT pour s'assurer qu'il n'a pas été révoqué. Les entrées de blacklist doivent expirer automatiquement après la durée de vie maximale d'un token (30 minutes).

- **FR-034**: Le système DOIT envoyer un email de vérification contenant un lien unique après chaque création de compte. Le lien doit être valide pour 24 heures.

- **FR-035**: Le système DOIT marquer chaque nouveau compte comme "non vérifié" jusqu'à ce que l'utilisateur clique sur le lien de vérification d'email.

- **FR-036**: Le système DOIT bloquer complètement l'accès à l'application pour les comptes non vérifiés, à l'exception de la page de vérification d'email et de la fonction de renvoi du lien.

- **FR-037**: Le système DOIT permettre à un utilisateur de demander le renvoi de l'email de vérification. Chaque nouvelle demande invalide tous les liens précédents et génère un nouveau lien unique.

- **FR-038**: Le système DOIT implémenter un rate limiting sur le renvoi des emails de vérification : maximum 3 demandes par compte par heure.

- **FR-039**: Le système DOIT marquer le compte comme "vérifié" dès que l'utilisateur clique sur un lien de vérification valide, et établir immédiatement une session active.

- **FR-040**: Le système DOIT afficher un message d'erreur approprié et proposer de renvoyer un nouveau lien lorsqu'un utilisateur tente d'utiliser un lien de vérification expiré.

- **FR-041**: Le système DOIT offrir une option "Se souvenir de moi" sur la page de connexion, permettant à l'utilisateur de choisir une session prolongée.

- **FR-042**: Le système DOIT générer un refresh token JWT sécurisé avec une durée de vie de 30 jours lorsque l'utilisateur coche "Se souvenir de moi" et se connecte avec succès.

- **FR-043**: Le système DOIT stocker les refresh tokens en base de données avec référence à l'utilisateur, date de création, date d'expiration, et identifiant d'appareil/navigateur.

- **FR-044**: Le système DOIT permettre le renouvellement automatique du token de session (30 minutes) en utilisant un refresh token valide, sans demander de nouvelle authentification.

- **FR-045**: Le système DOIT vérifier la validité du refresh token (non expiré, non révoqué, appartient à l'utilisateur) avant de générer un nouveau token de session.

- **FR-046**: Le système DOIT révoquer tous les refresh tokens de l'utilisateur sur tous les appareils lorsque le mot de passe est modifié.

- **FR-047**: Le système DOIT révoquer uniquement le refresh token de l'appareil concerné lors d'une déconnexion explicite, en le marquant comme révoqué en base de données.

- **FR-048**: Le système DOIT nettoyer automatiquement les refresh tokens expirés (plus de 30 jours) de la base de données pour éviter l'accumulation de données obsolètes.

### Key Entities

- **Utilisateur** : Représente une personne ayant un compte dans le système. Attributs clés : identifiant unique, nom d'utilisateur (unique, 3-30 caractères), adresse email (unique, validée), mot de passe (haché), date de création du compte, date de dernière connexion, statut du compte (actif, verrouillé temporairement), statut de vérification email (vérifié, non vérifié), compteur de tentatives de connexion échouées, timestamp de verrouillage.

- **Session** : Représente une période d'authentification active pour un utilisateur via un token JWT stateless. Attributs clés JWT : identifiant unique (jti), référence à l'utilisateur (sub), date de création (iat), date d'expiration (exp - 30 minutes après dernière activité). Métadonnées complémentaires stockées si nécessaire : adresse IP, user agent.

- **Token révoqué (Blacklist)** : Représente un token JWT explicitement révoqué avant son expiration naturelle. Attributs clés : identifiant du token JWT (jti), référence à l'utilisateur, date de révocation, date d'expiration du token (pour nettoyage automatique après 30 minutes pour les sessions, 30 jours pour les refresh tokens), raison de révocation (déconnexion explicite, changement de mot de passe, etc.).

- **Refresh Token** : Représente un token longue durée permettant le renouvellement automatique des sessions pour les utilisateurs ayant choisi "Se souvenir de moi". Attributs clés : identifiant unique (jti), référence à l'utilisateur, token JWT signé, date de création, date d'expiration (30 jours), identifiant d'appareil/navigateur (user agent), adresse IP de création, statut (actif, révoqué, expiré), date de dernière utilisation.

- **Token de vérification d'email** : Représente une demande de vérification d'adresse email pour un nouveau compte. Attributs clés : identifiant unique, référence à l'utilisateur, token (unique, sécurisé), date de création, date d'expiration (24 heures), statut (actif, utilisé, expiré).

- **Token de réinitialisation** : Représente une demande de réinitialisation de mot de passe. Attributs clés : identifiant unique, référence à l'utilisateur, token (unique, sécurisé), date de création, date d'expiration (1 heure), statut (actif, utilisé, expiré).

- **Événement de sécurité** : Représente une action liée à la sécurité dans le système. Attributs clés : identifiant unique, type d'événement (création de compte, connexion réussie, échec de connexion, modification de mot de passe, verrouillage de compte, etc.), référence à l'utilisateur (si applicable), adresse IP, user agent, timestamp, détails additionnels (en JSON).

- **Demande de changement d'email** : Représente une demande de modification d'adresse email en attente de validation. Attributs clés : identifiant unique, référence à l'utilisateur, nouvelle adresse email, token de vérification (unique, sécurisé), date de création, date d'expiration (24 heures), statut (en attente, validé, expiré).



## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur peut créer un compte et se connecter pour la première fois en moins de 3 minutes.

- **SC-002**: Le taux de réussite de la création de compte doit être supérieur à 95% pour les utilisateurs fournissant des informations valides.

- **SC-003**: Le système doit supporter au moins 1000 utilisateurs connectés simultanément sans dégradation des performances de connexion (temps de réponse < 2 secondes).

- **SC-004**: 90% des utilisateurs doivent réussir à se connecter dès la première tentative avec des identifiants corrects.

- **SC-005**: Le processus de réinitialisation de mot de passe doit être complété en moins de 5 minutes (de la demande à la connexion avec le nouveau mot de passe).

- **SC-006**: Le taux de réussite de la réinitialisation de mot de passe doit être supérieur à 95%.

- **SC-007**: Toutes les interfaces d'authentification doivent être conformes RGAA (niveau AA minimum) avec un score de 100% aux tests d'accessibilité automatisés.

- **SC-008**: Le système doit bloquer 100% des tentatives de connexion après 5 échecs consécutifs, sans faux négatifs.

- **SC-009**: Les sessions doivent expirer automatiquement après exactement 30 minutes d'inactivité, avec une marge d'erreur de maximum 30 secondes.

- **SC-010**: Le taux d'abandon du processus de création de compte doit être inférieur à 20%.

- **SC-011**: Les emails de réinitialisation de mot de passe et de notification doivent être délivrés en moins de 60 secondes dans 99% des cas.

- **SC-012**: Les tickets de support liés aux problèmes d'authentification doivent diminuer de 60% après le déploiement de cette fonctionnalité (mesure sur 3 mois).

