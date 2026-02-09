import { CLASS_CONFIGS } from './class-configs/index.js';
import { getActorClass, getActorLevel, getStats, hasFeature } from './actor-utils.js';
import { ResourceRegistry } from './resource-types/resource-registry.js';

/**
 * Gestionnaire des ressources specifiques aux classes Nimble
 * Systeme data-driven : les ressources sont definies dans les class-configs
 * Delegue la logique aux handlers polymorphiques via ResourceRegistry
 */
export class ResourceTracker {

  constructor(app) {
    this.app = app;
    this.registry = new ResourceRegistry();
  }

  // ============================================================
  // API publique (signatures inchangees)
  // ============================================================

  /**
   * Recupere les ressources specifiques a une classe (data-driven)
   */
  async getClassResources(actor, classId, config, level) {
    const resources = {};
    const conditions = config.resourceConditions || {};
    const stats = getStats(actor);

    for (const [key, condition] of Object.entries(conditions)) {
      if (condition.requiresFeature && !hasFeature(actor, condition.requiresFeature)) {
        continue;
      }

      const handler = this.registry.getHandler(key, condition);
      const resource = handler.compute(actor, key, condition, stats, level);
      if (resource !== null && resource !== undefined) {
        resources[key] = resource;
      }
    }

    return resources;
  }

  /**
   * Modifie une ressource
   */
  async adjustResource(actor, resourcePath, delta) {
    const condition = this._getCondition(actor, resourcePath);
    const handler = this.registry.getHandler(resourcePath, condition);
    await handler.adjust(actor, resourcePath, condition, delta);
  }

  /**
   * Reinitialise les ressources pour un acteur selon le type de rest
   */
  async resetRestResources(actor, restType) {
    const classId = getActorClass(actor);
    const config = CLASS_CONFIGS[classId];
    if (!config?.resourceConditions) return;

    const level = getActorLevel(actor);

    for (const [key, condition] of Object.entries(config.resourceConditions)) {
      if (!condition.resetOn) continue;
      if (condition.resetOn !== 'rest' && condition.resetOn !== restType) continue;
      if (condition.requiresFeature && !hasFeature(actor, condition.requiresFeature)) continue;

      const handler = this.registry.getHandler(key, condition);
      await handler.reset(actor, key, condition, level);
    }
  }

  // ============================================================
  // Operations specifiques aux types (delegation, signatures inchangees)
  // ============================================================

  async rollAndAddDie(actor, resourceKey, dieSize) {
    const condition = this._getCondition(actor, resourceKey);
    await this.registry.dicePool.rollAndAddDie(actor, resourceKey, condition, dieSize);
  }

  async clearDice(actor, resourceKey) {
    const condition = this._getCondition(actor, resourceKey);
    await this.registry.dicePool.clearDice(actor, resourceKey, condition);
  }

  async setDieValue(actor, resourceKey, index, value) {
    const condition = this._getCondition(actor, resourceKey);
    await this.registry.dicePool.setDieValue(actor, resourceKey, condition, index, value);
  }

  async rollAndSetSingleValue(actor, resourceKey, dieSize, diceCount = 1) {
    const condition = this._getCondition(actor, resourceKey);
    await this.registry.singleValue.rollAndSetSingleValue(actor, resourceKey, condition, dieSize, diceCount);
  }

  async setSingleValue(actor, resourceKey, value) {
    const condition = this._getCondition(actor, resourceKey);
    await this.registry.singleValue.setSingleValue(actor, resourceKey, condition, value);
  }

  // ============================================================
  // Utilitaire interne
  // ============================================================

  /**
   * Recupere la condition d'une ressource depuis les configs de classe
   */
  _getCondition(actor, resourceKey) {
    const classId = getActorClass(actor);
    const config = CLASS_CONFIGS[classId];
    return config?.resourceConditions?.[resourceKey] || {};
  }
}
