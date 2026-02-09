import { BaseResource } from './base-resource.js';

/**
 * Ressource systeme Temp HP.
 * L'affichage est gere par HpResource.toDisplayData().
 * Cette classe existe uniquement pour le dispatch de adjustResource.
 */
export class TempHpResource extends BaseResource {

  compute(actor, key, condition, stats, level) {
    const system = actor.system;
    const hp = system.attributes?.hp || system.hp || { temp: 0 };
    return { value: hp.temp || 0 };
  }

  async adjust(actor, key, condition, delta) {
    const system = actor.system;
    const hp = system.attributes?.hp || system.hp || { temp: 0 };
    const newValue = Math.max(0, (hp.temp || 0) + delta);
    const updatePath = system.attributes?.hp ? 'system.attributes.hp.temp' : 'system.hp.temp';
    await actor.update({ [updatePath]: newValue });
  }

  toDisplayData(key, computedData, condition) {
    // L'affichage temp HP est integre dans HpResource.toDisplayData()
    return { category: 'none', data: null };
  }
}
