import { MODULE_ID } from './constants.js';

export function registerSettings() {
  // Keybinding pour toggle
  game.keybindings.register(MODULE_ID, 'toggle', {
    name: 'NIMBLE_DM_HELPER.keybinding.toggle',
    hint: 'NIMBLE_DM_HELPER.keybinding.toggleHint',
    editable: [{ key: 'KeyH', modifiers: ['Shift', 'Control'] }],
    onDown: () => {
      game.nimbleDMHelper?.toggle();
      return true;
    },
    restricted: true
  });

  // Afficher bouton toolbar
  game.settings.register(MODULE_ID, 'showToolbarButton', {
    name: 'NIMBLE_DM_HELPER.settings.showToolbarButton',
    hint: 'NIMBLE_DM_HELPER.settings.showToolbarButtonHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  // Mode compact
  game.settings.register(MODULE_ID, 'compactMode', {
    name: 'NIMBLE_DM_HELPER.settings.compactMode',
    hint: 'NIMBLE_DM_HELPER.settings.compactModeHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher section abilites
  game.settings.register(MODULE_ID, 'showAbilities', {
    name: 'NIMBLE_DM_HELPER.settings.showAbilities',
    hint: 'NIMBLE_DM_HELPER.settings.showAbilitiesHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Afficher bouton suppression des abilites
  game.settings.register(MODULE_ID, 'showDeleteAbility', {
    name: 'NIMBLE_DM_HELPER.settings.showDeleteAbility',
    hint: 'NIMBLE_DM_HELPER.settings.showDeleteAbilityHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => game.nimbleDMHelper?.app?.render()
  });

  // Filtrer par presence des joueurs
  game.settings.register(MODULE_ID, 'filterByPresence', {
    name: 'NIMBLE_DM_HELPER.settings.filterByPresence',
    hint: 'NIMBLE_DM_HELPER.settings.filterByPresenceHint',
    scope: 'client',
    config: true,
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
