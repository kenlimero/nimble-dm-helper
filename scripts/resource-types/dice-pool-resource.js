import { MODULE_ID } from '../constants.js';
import { getStats, getActorLevel } from '../actor-utils.js';
import { BaseResource, computeMax, getDieSizeFromProgression, getFlagInfo } from './base-resource.js';

/**
 * Ressource de type dice pool (canStoreDice).
 * Stocke un tableau de valeurs de des : [3, 5, 0, 6, 2]
 * Utilisee par : fury (berserker), combatDice (commander)
 */
export class DicePoolResource extends BaseResource {

  compute(actor, key, condition, stats, level) {
    const flagInfo = getFlagInfo(key, condition);
    const currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];
    const max = computeMax(condition, stats, level);
    const dieSize = condition.dieProgression
      ? getDieSizeFromProgression(condition.dieProgression, level)
      : 'd6';
    return {
      count: currentDice.length,
      max,
      dieSize,
      values: currentDice,
      color: condition.color,
      canStoreDice: true
    };
  }

  async adjust(actor, key, condition, delta) {
    // Les dice pools ne sont pas modifies par +/- ; on utilise roll/clear/edit.
  }

  async reset(actor, key, condition, level) {
    const flagInfo = getFlagInfo(key, condition);
    await actor.unsetFlag(flagInfo.module, flagInfo.key);
  }

  // ============================================================
  // Operations specifiques aux dice pools
  // ============================================================

  async rollAndAddDie(actor, key, condition, dieSize) {
    const flagInfo = getFlagInfo(key, condition);
    let currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];

    const stats = getStats(actor);
    const level = getActorLevel(actor);
    const maxDice = computeMax(condition, stats, level) || 10;

    while (currentDice.length < maxDice) {
      currentDice.push(0);
    }

    const emptyIndex = currentDice.findIndex(v => v === 0);
    if (emptyIndex === -1) {
      ui.notifications.warn(game.i18n.localize('NIMBLE_DM_HELPER.notifications.dicePoolFull') || 'Pool de dés plein!');
      return;
    }

    const roll = await new Roll(`1${dieSize}`).evaluate();
    const result = roll.total;

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${game.i18n.localize(`NIMBLE_DM_HELPER.resources.${key}`)} - Dé ajouté au pool`
    });

    currentDice[emptyIndex] = result;
    await actor.setFlag(flagInfo.module, flagInfo.key, currentDice);
  }

  async clearDice(actor, key, condition) {
    const flagInfo = getFlagInfo(key, condition);
    await actor.unsetFlag(flagInfo.module, flagInfo.key);
  }

  async setDieValue(actor, key, condition, index, value) {
    const flagInfo = getFlagInfo(key, condition);
    const stats = getStats(actor);
    const level = getActorLevel(actor);
    const maxDice = computeMax(condition, stats, level) || 10;

    let currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];
    while (currentDice.length < maxDice) {
      currentDice.push(0);
    }

    if (index >= 0 && index < maxDice) {
      currentDice[index] = value;
    }

    await actor.setFlag(flagInfo.module, flagInfo.key, currentDice);
  }

  toDisplayData(key, computedData, condition) {
    return {
      category: 'dicePool',
      data: {
        key,
        labelKey: `NIMBLE_DM_HELPER.resources.${key}`,
        ...computedData
      }
    };
  }
}
