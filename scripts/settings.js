import { MODULE_ID } from './constants.js';

/**
 * Definition des groupes de settings et le premier setting de chaque groupe.
 * L'ordre des groupes determine l'ordre d'affichage dans le panneau de settings.
 */
const SETTINGS_GROUPS = [
  { label: 'NIMBLE_DM_HELPER.settingsGroup.general', firstSetting: 'playerAccess' },
  { label: 'NIMBLE_DM_HELPER.settingsGroup.sections', firstSetting: 'compactMode' },
  { label: 'NIMBLE_DM_HELPER.settingsGroup.bars', firstSetting: 'mergedBars' },
  { label: 'NIMBLE_DM_HELPER.settingsGroup.dice', firstSetting: 'showRollButton' }
];

export function registerSettings() {
  // Determiner si le user courant est GM (game.user n'est pas dispo pendant init)
  const isGM = game.data.users.find(u => u._id === game.data.userId)?.role >= CONST.USER_ROLES.GAMEMASTER;

  // Keybinding pour toggle
  game.keybindings.register(MODULE_ID, 'toggle', {
    name: 'NIMBLE_DM_HELPER.keybinding.toggle',
    hint: 'NIMBLE_DM_HELPER.keybinding.toggleHint',
    editable: [{ key: 'KeyH', modifiers: ['Shift', 'Control'] }],
    onDown: () => {
      if (!game.user.isGM && !game.settings.get(MODULE_ID, 'playerAccess')) return false;
      game.nimbleDMHelper?.toggle();
      return true;
    },
    restricted: false
  });

  // Acces joueurs
  game.settings.register(MODULE_ID, 'playerAccess', {
    name: 'NIMBLE_DM_HELPER.settings.playerAccess',
    hint: 'NIMBLE_DM_HELPER.settings.playerAccessHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  // Determiner si le joueur a acces au module
  const hasAccess = isGM || game.settings.get(MODULE_ID, 'playerAccess');

  // ── Groupe: General ──────────────────────────────────

  // Afficher bouton toolbar (masque pour les joueurs, force a true)
  game.settings.register(MODULE_ID, 'showToolbarButton', {
    name: 'NIMBLE_DM_HELPER.settings.showToolbarButton',
    hint: 'NIMBLE_DM_HELPER.settings.showToolbarButtonHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  // Filtrer par presence des joueurs (GM uniquement)
  game.settings.register(MODULE_ID, 'filterByPresence', {
    name: 'NIMBLE_DM_HELPER.settings.filterByPresence',
    hint: 'NIMBLE_DM_HELPER.settings.filterByPresenceHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Sauvegarder les personnages epingles (drag and drop)
  game.settings.register(MODULE_ID, 'persistPinnedActors', {
    name: 'NIMBLE_DM_HELPER.settings.persistPinnedActors',
    hint: 'NIMBLE_DM_HELPER.settings.persistPinnedActorsHint',
    scope: 'world',
    config: isGM,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // ── Groupe: Sections visibles ────────────────────────

  // Mode compact
  game.settings.register(MODULE_ID, 'compactMode', {
    name: 'NIMBLE_DM_HELPER.settings.compactMode',
    hint: 'NIMBLE_DM_HELPER.settings.compactModeHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: false,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher les barres HP, Mana et Wounds
  game.settings.register(MODULE_ID, 'showHPMana', {
    name: 'NIMBLE_DM_HELPER.settings.showHPMana',
    hint: 'NIMBLE_DM_HELPER.settings.showHPManaHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher wounds uniquement a 0 HP
  game.settings.register(MODULE_ID, 'woundsOnlyAtZeroHP', {
    name: 'NIMBLE_DM_HELPER.settings.woundsOnlyAtZeroHP',
    hint: 'NIMBLE_DM_HELPER.settings.woundsOnlyAtZeroHPHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: false,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher les autres barres de ressources (Lay on Hands, etc.)
  game.settings.register(MODULE_ID, 'showOtherBars', {
    name: 'NIMBLE_DM_HELPER.settings.showOtherBars',
    hint: 'NIMBLE_DM_HELPER.settings.showOtherBarsHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher les pools de des et valeurs stockees (canStoreDice + canStoreValue)
  game.settings.register(MODULE_ID, 'showDiceResources', {
    name: 'NIMBLE_DM_HELPER.settings.showDiceResources',
    hint: 'NIMBLE_DM_HELPER.settings.showDiceResourcesHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher les ressources inline (compteurs simples)
  game.settings.register(MODULE_ID, 'showInlineResources', {
    name: 'NIMBLE_DM_HELPER.settings.showInlineResources',
    hint: 'NIMBLE_DM_HELPER.settings.showInlineResourcesHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher section abilites
  game.settings.register(MODULE_ID, 'showAbilities', {
    name: 'NIMBLE_DM_HELPER.settings.showAbilities',
    hint: 'NIMBLE_DM_HELPER.settings.showAbilitiesHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // ── Groupe: Barres de ressources ─────────────────────

  // Barres fusionnees (label + valeur sur la barre)
  game.settings.register(MODULE_ID, 'mergedBars', {
    name: 'NIMBLE_DM_HELPER.settings.mergedBars',
    hint: 'NIMBLE_DM_HELPER.settings.mergedBarsHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: false,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher les boutons +/- sur les barres de ressources
  game.settings.register(MODULE_ID, 'showBarControls', {
    name: 'NIMBLE_DM_HELPER.settings.showBarControls',
    hint: 'NIMBLE_DM_HELPER.settings.showBarControlsHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // ── Groupe: Des et habiletes ─────────────────────────

  // Afficher le bouton roll dans les dice pools
  game.settings.register(MODULE_ID, 'showRollButton', {
    name: 'NIMBLE_DM_HELPER.settings.showRollButton',
    hint: 'NIMBLE_DM_HELPER.settings.showRollButtonHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher le bouton clear dans les dice pools (GM uniquement)
  game.settings.register(MODULE_ID, 'showClearButton', {
    name: 'NIMBLE_DM_HELPER.settings.showClearButton',
    hint: 'NIMBLE_DM_HELPER.settings.showClearButtonHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Permettre l'edition des valeurs de des (clic pour modifier)
  game.settings.register(MODULE_ID, 'showDiceEdit', {
    name: 'NIMBLE_DM_HELPER.settings.showDiceEdit',
    hint: 'NIMBLE_DM_HELPER.settings.showDiceEditHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher le bouton de suppression (X) sur les des individuels
  game.settings.register(MODULE_ID, 'showDiceDelete', {
    name: 'NIMBLE_DM_HELPER.settings.showDiceDelete',
    hint: 'NIMBLE_DM_HELPER.settings.showDiceDeleteHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher bouton suppression des abilites (GM uniquement)
  game.settings.register(MODULE_ID, 'showDeleteAbility', {
    name: 'NIMBLE_DM_HELPER.settings.showDeleteAbility',
    hint: 'NIMBLE_DM_HELPER.settings.showDeleteAbilityHint',
    scope: 'client',
    config: isGM,
    type: Boolean,
    default: false,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // ── Stockage interne ─────────────────────────────────

  // Liste des acteurs epingles (stockage interne)
  game.settings.register(MODULE_ID, 'pinnedActors', {
    scope: 'world',
    config: false,
    type: Array,
    default: []
  });

  // Position sauvegardee
  game.settings.register(MODULE_ID, 'windowPosition', {
    scope: 'client',
    config: false,
    type: Object,
    default: { top: 100, left: 100 }
  });
}

/**
 * Injecte des headers de groupe dans le panneau de settings du module
 */
export function registerSettingsGrouping() {
  Hooks.on('renderSettingsConfig', (app, html) => {
    const root = html instanceof HTMLElement ? html : html[0];
    if (!root) return;

    for (const group of SETTINGS_GROUPS) {
      const input = root.querySelector(`[name="${MODULE_ID}.${group.firstSetting}"]`);
      if (!input) continue;

      const formGroup = input.closest('.form-group');
      if (!formGroup) continue;

      const header = document.createElement('div');
      header.classList.add('ndh-settings-group-header');
      header.textContent = game.i18n.localize(group.label);
      formGroup.parentElement.insertBefore(header, formGroup);
    }
  });
}
