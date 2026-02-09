import { BaseResource } from './base-resource.js';

/**
 * Ressource systeme Wounds.
 * Les wound boxes ont un comportement toggle specifique gere par _onClickWound.
 */
export class WoundsResource extends BaseResource {

  compute(actor, key, condition, stats, level) {
    const system = actor.system;
    const wounds = system.attributes?.wounds || system.wounds || { value: 0, max: 6 };
    return {
      value: wounds.value ?? 0,
      max: wounds.max ?? 6
    };
  }

  async adjust(actor, key, condition, delta) {
    const system = actor.system;
    const wounds = system.attributes?.wounds || system.wounds || { value: 0, max: 6 };
    const newValue = Math.clamp(wounds.value + delta, 0, wounds.max);
    const updatePath = system.attributes?.wounds ? 'system.attributes.wounds.value' : 'system.wounds.value';
    await actor.update({ [updatePath]: newValue });
  }

  /**
   * Reset specifique au safe rest : guerit 1 wound
   */
  async resetOnSafeRest(actor) {
    const system = actor.system;
    const wounds = system.attributes?.wounds || system.wounds || { value: 0 };
    const woundPath = system.attributes?.wounds ? 'system.attributes.wounds.value' : 'system.wounds.value';
    if (wounds.value > 0) {
      await actor.update({ [woundPath]: wounds.value - 1 });
    }
  }

  toDisplayData(key, computedData, condition) {
    return { category: 'wounds', data: computedData };
  }
}
