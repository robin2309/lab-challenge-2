# La ligne scolaire – prototype prof

Prototype React + Vite + TypeScript des 2 écrans (création du cours, timeline éditable).

    npm install
    npm run dev      # http://localhost:5173
    npm run build

## Où brancher la vraie IA
`src/data/generate.ts` → `generateCourse(subject, classe)` : aujourd'hui un générateur mocké,
même signature à conserver pour un appel API (brief → séances + ressources).

## Structure
- `src/components/CreateScreen.tsx` : écran 1 (classe + sujet)
- `src/components/TimelineScreen.tsx` : écran 2 (vague, séances, ajout / modif / suppression)
- `src/components/SidePanel.tsx` : En bref (camembert dynamique) / Sommaire
- `src/components/Library.tsx` : onglets Textes et Images / Vidéos / Ludopédagogie / Rituels
- `src/data/catalog.ts` : ressources de démonstration
- Polices Sentient + General Sans (Fontshare, `public/fonts`), cadre 1920×1080 mis à l'échelle (`Stage.tsx`)
