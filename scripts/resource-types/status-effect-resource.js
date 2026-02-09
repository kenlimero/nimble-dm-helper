import { BaseResource } from './base-resource.js';

/**
 * Ressource de type status effect (read-only).
 * Verifie si un effet est actif sur l'acteur.
 */
export class StatusEffectResource extends BaseResource {

  compute(actor, key, condition, stats, level) {
    if (!actor.effects) return false;
    return actor.effects.some(e =>
      (e.name || e.label || '').toLowerCase().includes(condition.effectName) && !e.disabled
    );
  }

  async adjust(actor, key, condition, delta) {
    // Read-only : les status effects ne sont pas modifiables via le tracker.
  }

  toDisplayData(key, computedData, condition) {
    return { category: 'none', data: null };
  }
}
