import { MODULE_ID } from './constants.js';

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

function hasAccess() {
  return game.user.isGM || game.settings.get(MODULE_ID, 'playerAccess');
}

export function registerHooks() {
  // Re-render quand un acteur est mis a jour
  Hooks.on('updateActor', (actor, changes, options, userId) => {
    if (!hasAccess()) return;
    if (actor.type !== 'character') return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  // Re-render quand un effect est ajoute/supprime
  Hooks.on('createActiveEffect', (effect, options, userId) => {
    if (!hasAccess()) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  Hooks.on('deleteActiveEffect', (effect, options, userId) => {
    if (!hasAccess()) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  // Re-render quand un item est modifie ou supprime
  Hooks.on('updateItem', (item, changes, options, userId) => {
    if (!hasAccess()) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  Hooks.on('deleteItem', (item, options, userId) => {
    if (!hasAccess()) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;
    debouncedRender();
  });

  // Re-render quand le statut d'un utilisateur change (connexion/déconnexion)
  Hooks.on('updateUser', (user, changes, options, userId) => {
    if (!hasAccess()) return;
    if (!game.nimbleDMHelper?.app?.rendered) return;

    // Rafraîchir si le statut actif change ou si le personnage principal change
    if ('active' in changes || 'character' in changes) {
      debouncedRender();
    }
  });

  // Detecter un rest via le chat message du systeme Nimble (safeRest, fieldRest)
  Hooks.on('createChatMessage', (message, options, userId) => {
    if (!game.user.isGM) return;

    const restType = message.type;
    if (restType !== 'safeRest' && restType !== 'fieldRest') return;

    const actorId = message.speaker?.actor;
    if (!actorId) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const resourceTracker = game.nimbleDMHelper?.app?.resourceTracker;
    if (!resourceTracker) return;

    resourceTracker.resetRestResources(actor, restType).then(() => {
      ui.notifications.info(
        game.i18n.format('NIMBLE_DM_HELPER.notifications.restReset', { name: actor.name })
      );
    });
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

  // Reset ressources a la fin du combat (resetOn: 'combatEnd')
  Hooks.on('deleteCombat', (combat, options, userId) => {
    if (!game.user.isGM) return;

    const resourceTracker = game.nimbleDMHelper?.app?.resourceTracker;
    if (!resourceTracker) return;

    game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner)
      .forEach(actor => {
        resourceTracker.resetRestResources(actor, 'combatEnd');
      });
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
