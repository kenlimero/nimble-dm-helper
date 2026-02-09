import { MODULE_ID } from '../constants.js';
import {
  BaseResource, computeMax, getDieSizeFromProgression,
  getMaxFromProgression, getFlagInfo, getSingleValueFlagInfo, resolveModule
} from './base-resource.js';

/**
 * Ressource avec valeur unique stockee (canStoreValue).
 * Stocke a la fois un tableau de des ET une valeur totale.
 * Utilisee par : judgmentDice (oathsworn)
 */
export class SingleValueResource extends BaseResource {

  compute(actor, key, condition, stats, level) {
    const flagInfo = getFlagInfo(key, condition);
    const currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];
    const singleValueModule = condition.storageModule ? resolveModule(condition.storageModule) : MODULE_ID;
    const singleValueKey = condition.singleValueKey || `${key}Value`;
    const storedValue = actor.getFlag(singleValueModule, singleValueKey) ?? 0;
    const max = condition.maxProgression
      ? getMaxFromProgression(condition.maxProgression, level)
      : computeMax(condition, stats, level);
    const dieSize = condition.dieProgression
      ? getDieSizeFromProgression(condition.dieProgression, level)
      : 'd6';
    return {
      count: currentDice.length,
      max,
      dieSize,
      values: currentDice,
      storedValue,
      color: condition.color,
      canStoreValue: true
    };
  }

  async adjust(actor, key, condition, delta) {
    // Les single value resources ne sont pas modifiees par +/- ; on utilise roll/edit/clear.
  }

  async reset(actor, key, condition, level) {
    const flagInfo = getFlagInfo(key, condition);
    await actor.unsetFlag(flagInfo.module, flagInfo.key);
    const singleFlagInfo = getSingleValueFlagInfo(key, condition);
    await actor.unsetFlag(singleFlagInfo.module, singleFlagInfo.key);
  }

  // ============================================================
  // Operations specifiques aux single values
  // ============================================================

  async rollAndSetSingleValue(actor, key, condition, dieSize, diceCount = 1) {
    const roll = await new Roll(`${diceCount}${dieSize}`).evaluate();
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${game.i18n.localize(`NIMBLE_DM_HELPER.resources.${key}`)} - ${diceCount}${dieSize}`
    });
    await this.setSingleValue(actor, key, condition, roll.total);
  }

  async setSingleValue(actor, key, condition, value) {
    const flagInfo = getSingleValueFlagInfo(key, condition);
    await actor.setFlag(flagInfo.module, flagInfo.key, value);
  }

  toDisplayData(key, computedData, condition) {
    return {
      category: 'valueResource',
      data: {
        key,
        labelKey: `NIMBLE_DM_HELPER.resources.${key}`,
        ...computedData,
        diceImages: Array.from({ length: computedData.max || 0 }, () => computedData.dieSize)
      }
    };
  }
}
