const MODULE_ID = 'nimble-dm-helper';

let debounceTimer = null;

function debounce(func, wait) {
  return function executedFunction(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), wait);
  };
}

const debouncedRender = debounce(() => {
  game.nimbleDMHelper?.app?.render();
}, 100);

export function registerHooks() {
  // Re-render quand un acteur est mis a jour
  Hooks.on('updateActor', (actor, changes, options, userId) => {
    if (!game.user.isGM) return;
    if (actor.type !== 'character') return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  // Re-render quand un effect est ajoute/supprime
  Hooks.on('createActiveEffect', (effect, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  Hooks.on('deleteActiveEffect', (effect, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  // Re-render quand un item est modifie
  Hooks.on('updateItem', (item, changes, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  // Re-render quand le statut d'un utilisateur change (connexion/déconnexion)
  Hooks.on('updateUser', (user, changes, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;

    // Rafraîchir si le statut actif change ou si le personnage principal change
    if ('active' in changes || 'character' in changes) {
      debouncedRender();
    }
  });

  // Reset ressources au debut du combat
  Hooks.on('combatStart', (combat, options) => {
    if (!game.user.isGM) return;
    resetEncounterResources();
  });

  // Reset ressources par round
  Hooks.on('combatRound', (combat, updateData, options) => {
    if (!game.user.isGM) return;
    resetRoundResources();
  });

}

function resetEncounterResources() {
  game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner)
    .forEach(actor => {
      // Reset Sneak Attack used
      actor.setFlag('nimble', 'sneakAttackUsed', false);
      // Reset per-encounter abilities
      actor.setFlag(MODULE_ID, 'encounterAbilitiesUsed', {});
    });
}

function resetRoundResources() {
  game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner)
    .forEach(actor => {
      // Reset Cheat move/hide
      actor.setFlag('nimble', 'cheatMoveUsed', false);
    });
}
