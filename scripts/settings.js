import { MODULE_ID } from './constants.js';

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

  // Afficher le bouton roll dans les dice pools (vu joueur, masque GM uniquement)
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

  // Afficher le max des dice pools
  game.settings.register(MODULE_ID, 'showDicePoolMax', {
    name: 'NIMBLE_DM_HELPER.settings.showDicePoolMax',
    hint: 'NIMBLE_DM_HELPER.settings.showDicePoolMaxHint',
    scope: 'client',
    config: hasAccess,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

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

  // Position sauvegardee
  game.settings.register(MODULE_ID, 'windowPosition', {
    scope: 'client',
    config: false,
    type: Object,
    default: { top: 100, left: 100 }
  });
}
