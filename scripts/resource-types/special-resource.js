import { BaseResource } from './base-resource.js';

/**
 * Ressource de type special avec getter custom.
 * Delegue le calcul a une methode specifique enregistree dans le getterMap.
 */
export class SpecialResource extends BaseResource {

  constructor(getterMap = {}) {
    super();
    this._getterMap = getterMap;
  }

  /**
   * Enregistre des getters custom (appele par ResourceTracker si besoin)
   */
  registerGetters(getterMap) {
    Object.assign(this._getterMap, getterMap);
  }

  compute(actor, key, condition, stats, level) {
    const getter = this._getterMap[condition.getter];
    return getter ? getter(actor, level, stats) : null;
  }

  async adjust(actor, key, condition, delta) {
    // Les ressources speciales ont leur propre logique.
  }

  toDisplayData(key, computedData, condition) {
    return { category: 'none', data: null };
  }
}
