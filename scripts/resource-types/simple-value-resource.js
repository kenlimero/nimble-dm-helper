import { MODULE_ID } from '../constants.js';
import { getStats, getActorLevel } from '../actor-utils.js';
import { BaseResource, computeMax } from './base-resource.js';

/**
 * Ressource generique a valeur simple (inline et bar).
 * Couvre 33+ ressources : burstOfSpeed, layOnHands, coordinatedStrike, etc.
 * La difference inline/bar est purement visuelle (displayType dans la condition).
 */
export class SimpleValueResource extends BaseResource {

  compute(actor, key, condition, stats, level) {
    const max = computeMax(condition, stats, level);
    const defaultVal = condition.defaultToMax ? max : (condition.defaultValue ?? 0);
    return {
      value: actor.getFlag(MODULE_ID, key) ?? defaultVal,
      max: condition.noMax ? null : max,
      color: condition.color,
      displayType: condition.displayType || 'inline'
    };
  }

  async adjust(actor, key, condition, delta) {
    const stats = getStats(actor);
    const level = getActorLevel(actor);
    const max = computeMax(condition, stats, level) || 999;
    const currentValue = actor.getFlag(MODULE_ID, key) || 0;
    const newValue = Math.clamp(currentValue + delta, 0, max);
    await actor.setFlag(MODULE_ID, key, newValue);
  }

  async reset(actor, key, condition, level) {
    const stats = getStats(actor);
    const max = computeMax(condition, stats, level);
    if (max) {
      await actor.setFlag(MODULE_ID, key, max);
    }
  }

  toDisplayData(key, computedData, condition) {
    const entry = {
      key,
      labelKey: `NIMBLE_DM_HELPER.resources.${key}`,
      ...computedData
    };

    if (computedData.displayType === 'bar') {
      return {
        category: 'otherBar',
        data: {
          ...entry,
          supportsMergedBars: true,
          controls: [
            { delta: -5, label: '-5' },
            { delta: -1, label: '-1' },
            { delta: 1, label: '+1' }
          ]
        }
      };
    }

    return { category: 'inline', data: entry };
  }
}
