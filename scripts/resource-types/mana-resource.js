import { MODULE_ID } from '../constants.js';
import { getStats, getActorLevel } from '../actor-utils.js';
import { BaseResource, computeMax } from './base-resource.js';

/**
 * Ressource de type mana avec gestion duale (systeme Nimble ou module).
 * Utilisee par 6 classes : mage, oathsworn, shepherd, songweaver, stormshifter, commander.
 */
export class ManaResource extends BaseResource {

  _getManaValue(actor) {
    const mana = actor.system?.resources?.mana;
    if (mana) {
      return mana.value ?? mana.current ?? 0;
    }
    return 0;
  }

  _getManaMax(actor) {
    const mana = actor.system?.resources?.mana;
    return mana?.max ?? 0;
  }

  _getManaColor(mana) {
    if (!mana.max || mana.max === 0) return '#2196F3';
    const ratio = mana.value / mana.max;
    if (ratio > 0.5) return '#2196F3';      // Bleu
    if (ratio > 0.25) return '#7B1FA2';     // Violet
    return '#4A148C';                        // Violet fonce
  }

  compute(actor, key, condition, stats, level) {
    const systemMax = this._getManaMax(actor);
    if (systemMax > 0) {
      return {
        value: this._getManaValue(actor),
        max: systemMax,
        formula: condition.formula,
        color: condition.color
      };
    }
    // Fallback : calculer le max depuis la config
    const computedMax = computeMax(condition, stats, level);
    if (!computedMax) return null;
    return {
      value: actor.getFlag(MODULE_ID, 'manaValue') ?? computedMax,
      max: computedMax,
      formula: condition.formula,
      color: condition.color,
      moduleManaged: true
    };
  }

  async adjust(actor, key, condition, delta) {
    const systemMana = actor.system?.resources?.mana;
    if (systemMana && systemMana.max > 0) {
      // Mana geree par le systeme Nimble
      const maxMana = systemMana.max;
      const current = systemMana.value ?? systemMana.current ?? 0;
      const newValue = Math.clamp(current + delta, 0, maxMana);
      await actor.update({
        'system.resources.mana.value': newValue,
        'system.resources.mana.current': newValue
      });
    } else {
      // Mana geree par le module (fallback)
      const stats = getStats(actor);
      const level = getActorLevel(actor);
      const maxMana = computeMax(condition, stats, level) || 0;
      const current = actor.getFlag(MODULE_ID, 'manaValue') ?? maxMana;
      const newValue = Math.clamp(current + delta, 0, maxMana);
      await actor.setFlag(MODULE_ID, 'manaValue', newValue);
    }
  }

  async reset(actor, key, condition, level) {
    // Aucune config mana n'a de resetOn, donc ce n'est jamais appele
    // via resetRestResources. Le reset mana se fait via resetOnSafeRest.
  }

  /**
   * Reset specifique au safe rest (appele depuis _onResetAll)
   */
  async resetOnSafeRest(actor, condition) {
    const systemMana = actor.system?.resources?.mana;
    if (systemMana && systemMana.max > 0) {
      await actor.update({
        'system.resources.mana.value': systemMana.max,
        'system.resources.mana.current': systemMana.max
      });
    } else if (condition?.maxStat) {
      await actor.unsetFlag(MODULE_ID, 'manaValue');
    }
  }

  toDisplayData(key, computedData, condition) {
    if (!computedData || !computedData.max) return { category: 'none', data: null };

    // Appliquer le degrade de couleur dynamique
    const color = this._getManaColor(computedData);

    return {
      category: 'manaBar',
      data: {
        key: 'mana',
        labelKey: 'NIMBLE_DM_HELPER.resources.mana',
        value: computedData.value,
        max: computedData.max,
        formula: computedData.formula,
        color,
        supportsMergedBars: true,
        controls: [
          { delta: -1, label: '-1' },
          { delta: 1, label: '+1' },
          { delta: 5, label: '+5' }
        ]
      }
    };
  }
}
