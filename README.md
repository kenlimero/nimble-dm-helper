# Nimble DM Helper

A Foundry VTT module for the **Nimble RPG** system. Provides a floating GM window to track player character resources (HP, wounds, mana, class-specific resources) during play.

---

**[Français](#français)** | **[English](#english)**

---

## English

### Features

#### Core Features
- **Floating Window** - Track all PC resources at a glance without switching between character sheets
- **Real-time Updates** - Auto-refresh when actors, effects, or items change (debounced for performance)
- **Keyboard Shortcut** - Toggle the window with `Ctrl+Shift+H`
- **Saved Position** - Window position is remembered between sessions
- **Bilingual** - Full English and French localization

#### Resource Tracking
- **HP with Dynamic Colors** - Health bar changes color based on percentage (green > orange > red)
- **Wounds Display** - Visual wound boxes with heart icons
- **Mana with Gradient** - Mana bar with dynamic color gradient (blue > purple > dark purple)
- **Class Resources** - Tracks all class-specific resources (Fury Dice, Judgment Dice, Inspiration, etc.)

#### Dice Pools
- **Visual Dice Slots** - Each die displayed with its individual value in a styled slot
- **Dice Shapes** - Different visual shapes based on die type (d4, d6, d8, d10, d12)
- **Roll Button** - Roll a die and automatically add it to the pool
- **Clear Button** - Clear all dice from a pool at once
- **Individual Edit** - Click any die value to change it
- **Individual Delete** - Remove specific dice from a pool

#### Single Value Resources
- **Roll & Store** - Roll dice and store the total value
- **Manual Edit** - Double-click to manually set values
- **Clear Function** - Reset values to zero

#### Abilities
- **Feature Display** - Shows all character features filtered by level
- **Rich Tooltips** - Hover over abilities to see HTML-formatted descriptions
- **Delete Ability** - Optional button to remove features from characters (GM only)

#### Rest & Combat Integration
- **Safe Rest Reset** - Automatically resets appropriate resources on safe rest
- **Field Rest Reset** - Handles field rest resource recovery
- **Combat End Reset** - Resets per-combat resources when combat ends
- **Encounter Start** - Resets per-encounter abilities at combat start
- **Round Reset** - Handles per-round ability tracking

#### Display Options
- **Compact Mode** - Smaller elements for a condensed view
- **Merged Bars** - Combine label and value onto the resource bar
- **Wounds at Zero HP** - Only show wounds when character is at 0 HP
- **Filter by Presence** - Show only characters of connected players
- **Show/Hide Abilities** - Toggle ability section visibility
- **Show/Hide Dice Pool Max** - Toggle maximum count display

#### Player Access
- **Player Mode** - Players can view their own character's resources
- **GM Controls** - Additional settings visible only to GM
- **Toolbar Button** - Optional button in token controls toolbar

### Supported Classes

| Class | Resources |
|-------|-----------|
| Berserker | Fury Dice |
| Mage | Mana |
| Oathsworn | Judgment Dice, Lay on Hands, Blinding Aura, Courage, Explosive Judgment |
| Commander | Combat Dice, Hold the Line, I Can Do This All Day, Coordinated Strike |
| Hunter | Sneak Attack, Grease Trap, Snare Trap, Primal Predator |
| Zephyr | Burst of Speed, Ethereal Projection, Blur |
| Stormshifter | Beastshift, Stormborn, Attuned to Nature, Master of Storm, Unleash the Beast, Storm Wake, Venomous Gaze |
| Songweaver | Inspiration, Song of Rest, Inspiring Anthem, Not My Face, Chord of Chaos, Chorus of Champions |
| Shadowmancer | Pilfered Power, Shadow Minions, Blood Sight, Whispers of the Grave |
| Shepherd | Glacial Resilience, Searing Light, Veilwalker's Blessing |
| Cheat | Cheat!, Quick Read (Enemy/Day), That's Not What Happened, Ha I Am Over There, Nullify, Steel Will, Chaos Lash |

### Compatibility

- **Foundry VTT:** v13+
- **System:** Nimble RPG

### Installation

#### Via Foundry VTT Interface (Recommended)
1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Search for "**Nimble DM Helper**" in the package browser
4. Click **Install**
5. Enable the module in your Nimble world

#### Via Manifest URL
1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. At the bottom, paste this manifest URL:
   ```
   https://github.com/kenlimero/nimble-dm-helper/releases/latest/download/module.json
   ```
4. Click **Install**
5. Enable the module in your Nimble world

### Usage

- **Toggle Window:** Press `Ctrl+Shift+H` or click the helper button in the token controls toolbar
- **Quick Adjustments:** Use the `+5`, `+1`, `-1`, `-5` buttons to quickly modify HP, Mana, Wounds and other resources
- **Direct Edit:** Double-click any resource value (HP, Mana, etc.) to open a dialog and set the exact value
- **Dice Pools:** Click on individual dice to edit their value, or use the roll button to add a new die
- **Clear Dice:** Use the trash button to clear all dice from a pool, or the X on individual dice to remove them
- **Open Character Sheet:** Click on a character's portrait to open their full character sheet
- **Refresh:** Click the refresh button in the window title bar to manually update

### Settings

| Setting | Description | Scope |
|---------|-------------|-------|
| Player Access | Allow players to use the helper window | World |
| Show Toolbar Button | Display button in token controls | Client (GM) |
| Compact Mode | Use smaller, condensed display | Client |
| Show Abilities | Display class abilities section | Client |
| Delete Ability Button | Show delete button on abilities | Client (GM) |
| Show Roll Button | Display dice roll button on pools | Client (GM) |
| Show Clear Button | Display clear button on pools | Client (GM) |
| Show Dice Pool Max | Display maximum count for dice pools | Client |
| Merged Bars | Combine label and value on bars | Client |
| Wounds at Zero HP | Only show wounds at 0 HP | Client |
| Filter by Presence | Show only connected players' characters | Client (GM) |

### License

MIT License

---

## Français

### Fonctionnalites

#### Fonctionnalites principales
- **Fenetre flottante** - Suivez toutes les ressources des PJ d'un coup d'oeil sans basculer entre les fiches
- **Mises a jour en temps reel** - Rafraichissement automatique lors des changements (optimise pour les performances)
- **Raccourci clavier** - Basculez la fenetre avec `Ctrl+Shift+H`
- **Position sauvegardee** - La position de la fenetre est memorisee entre les sessions
- **Bilingue** - Localisation complete en anglais et francais

#### Suivi des ressources
- **PV avec couleurs dynamiques** - La barre de sante change de couleur selon le pourcentage (vert > orange > rouge)
- **Affichage des blessures** - Boites visuelles avec icones de coeur
- **Mana avec degrade** - Barre de mana avec couleur dynamique (bleu > violet > violet fonce)
- **Ressources de classe** - Suit toutes les ressources specifiques (Des de Fureur, Des de Jugement, Inspiration, etc.)

#### Pools de des
- **Emplacements visuels** - Chaque de affiche avec sa valeur individuelle dans un emplacement stylise
- **Formes de des** - Differentes formes visuelles selon le type (d4, d6, d8, d10, d12)
- **Bouton lancer** - Lance un de et l'ajoute automatiquement au pool
- **Bouton vider** - Vide tous les des d'un pool en un clic
- **Edition individuelle** - Cliquez sur la valeur d'un de pour la modifier
- **Suppression individuelle** - Retirez des des specifiques d'un pool

#### Ressources a valeur unique
- **Lancer et stocker** - Lance des des et stocke la valeur totale
- **Edition manuelle** - Double-cliquez pour definir manuellement les valeurs
- **Fonction remise a zero** - Reinitialise les valeurs a zero

#### Habiletes
- **Affichage des features** - Montre toutes les features du personnage filtrees par niveau
- **Tooltips riches** - Survolez les habiletes pour voir les descriptions formatees en HTML
- **Supprimer une habilete** - Bouton optionnel pour retirer des features (MJ uniquement)

#### Integration repos et combat
- **Reset au repos sur** - Reinitialise automatiquement les ressources appropriees au repos sur
- **Reset au repos de terrain** - Gere la recuperation des ressources au repos de terrain
- **Reset fin de combat** - Reinitialise les ressources par combat a la fin du combat
- **Debut de rencontre** - Reinitialise les habiletes par rencontre au debut du combat
- **Reset par round** - Gere le suivi des habiletes par round

#### Options d'affichage
- **Mode compact** - Elements plus petits pour une vue condensee
- **Barres fusionnees** - Combine le libelle et la valeur sur la barre de ressource
- **Blessures a 0 PV** - N'affiche les blessures que lorsque le personnage est a 0 PV
- **Filtrer par presence** - N'affiche que les personnages des joueurs connectes
- **Afficher/Masquer les habiletes** - Bascule la visibilite de la section habiletes
- **Afficher/Masquer le max des pools** - Bascule l'affichage du nombre maximum

#### Acces joueurs
- **Mode joueur** - Les joueurs peuvent voir les ressources de leur propre personnage
- **Controles MJ** - Parametres supplementaires visibles uniquement par le MJ
- **Bouton barre d'outils** - Bouton optionnel dans les controles de jetons

### Classes supportees

| Classe | Ressources |
|--------|------------|
| Berserker | Des de Fureur |
| Mage | Mana |
| Garde-serment | Des de Jugement, Imposition des mains, Aura Aveuglante, Courage!, Jugement Explosif |
| Commandeur | Des de Combat, Tenez la Ligne!, Toute la journee!, Frappe coordonnee |
| Chasseur | Attaque Sournoise, Trappe Glissante, Collet, Predateur Primal |
| Zephyr | Explosion de vitesse, Projection Etheree, Flou |
| Changevent | Forme bestiale, Fils de la Tempete, Lie a la Nature, Maitre de la Tempete, Dechainer la Bete, Sillage de Tempete, Regard Venimeux |
| Tisseur de chants | Inspiration, Chant du Repos, Hymne Inspirant, Pas Mon Visage!, Accord du Chaos, Choeur des Champions |
| Ombremancien | Pouvoir derobe, Serviteurs d'ombre, Vue Ensanglantee, Murmure de la Tombe |
| Berger | Resilience Glaciale, Lumiere ardente, Benediction du Somnambule |
| Tricheur | Triche!, Lecture Rapide, Ce n'est pas Arrive!, Ha! J'suis Ici!, Annulation, Volonte d'Acier, Retour Chaotique |

### Compatibilite

- **Foundry VTT :** v13+
- **Systeme :** Nimble RPG

### Installation

#### Via l'interface Foundry VTT (Recommande)
1. Dans Foundry VTT, allez dans **Modules complementaires**
2. Cliquez sur **Installer un module**
3. Recherchez "**Nimble DM Helper**" dans le navigateur de paquets
4. Cliquez sur **Installer**
5. Activez le module dans votre monde Nimble

#### Via URL de manifeste
1. Dans Foundry VTT, allez dans **Modules complementaires**
2. Cliquez sur **Installer un module**
3. En bas, collez cette URL de manifeste :
   ```
   https://github.com/kenlimero/nimble-dm-helper/releases/latest/download/module.json
   ```
4. Cliquez sur **Installer**
5. Activez le module dans votre monde Nimble

### Utilisation

- **Basculer la fenetre :** Appuyez sur `Ctrl+Shift+H` ou cliquez sur le bouton dans la barre d'outils des controles de jetons
- **Ajustements rapides :** Utilisez les boutons `+5`, `+1`, `-1`, `-5` pour modifier rapidement les PV, Mana, Blessures et autres ressources
- **Edition directe :** Double-cliquez sur n'importe quelle valeur (PV, Mana, etc.) pour ouvrir un dialogue et definir la valeur exacte
- **Pools de des :** Cliquez sur un de individuel pour modifier sa valeur, ou utilisez le bouton lancer pour ajouter un nouveau de
- **Vider les des :** Utilisez le bouton poubelle pour vider tous les des d'un pool, ou le X sur un de individuel pour le retirer
- **Ouvrir la fiche :** Cliquez sur le portrait d'un personnage pour ouvrir sa fiche complete
- **Rafraichir :** Cliquez sur le bouton de rafraichissement dans la barre de titre

### Parametres

| Parametre | Description | Portee |
|-----------|-------------|--------|
| Acces joueurs | Permet aux joueurs d'utiliser la fenetre | Monde |
| Afficher le bouton | Affiche le bouton dans les controles de jetons | Client (MJ) |
| Mode compact | Utilise un affichage plus compact | Client |
| Afficher les capacites | Affiche la section des capacites | Client |
| Bouton supprimer capacite | Affiche le bouton de suppression sur les capacites | Client (MJ) |
| Bouton lancer de de | Affiche le bouton de lancer sur les pools | Client (MJ) |
| Bouton vider les des | Affiche le bouton vider sur les pools | Client (MJ) |
| Afficher le max des pools | Affiche le nombre maximum des pools de des | Client |
| Barres fusionnees | Combine le libelle et la valeur sur les barres | Client |
| Blessures a 0 PV | N'affiche les blessures qu'a 0 PV | Client |
| Filtrer par presence | N'affiche que les personnages des joueurs connectes | Client (MJ) |

### Licence

Licence MIT
