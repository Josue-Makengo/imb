# IMB — Intelligence Mobile pour l'École

## Structure du projet

```
imb/
├── index.html                    ← Site de présentation ✅
├── pages/
│   ├── login.html                ← Connexion
│   ├── admin.html                ← Dashboard administrateur
│   ├── teacher.html              ← Interface enseignant
│   └── parent.html               ← Tableau de bord parent
│
├── assets/
│   ├── css/
│   │   ├── variables.css         ← Tokens partagés ✅
│   │   ├── components.css        ← Composants partagés ✅
│   │   ├── style.css             ← Landing page ✅
│   │   ├── login.css
│   │   ├── admin.css
│   │   ├── teacher.css
│   │   └── parent.css
│   │
│   └── js/
│       ├── main.js               ← Landing page ✅
│       ├── login.js
│       ├── admin.js
│       ├── teacher.js
│       ├── parent.js
│       │
│       ├── modules/
│       │   ├── Toast.js          ✅
│       │   ├── Modal.js          ✅
│       │   └── ScrollReveal.js   ✅
│       │
│       ├── services/
│       │   └── firebase.js       ✅
│       │
│       └── patterns/
│           └── UserFactory.js    ✅
└── README.md
```

## Démarrer

```bash
# Lancer avec Live Server dans VS Code
# Ouvrir index.html → clic droit → Open with Live Server
```

## Firebase
Remplacer les valeurs dans `assets/js/services/firebase.js`

## EmailJS (formulaire contact)
Remplacer les IDs dans `assets/js/main.js`
