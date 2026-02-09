import { BaseResource } from './base-resource.js';

/**
 * Ressource systeme HP.
 * Gere l'absorption des degats par les temp HP avant les HP reels.
 */
export class HpResource extends BaseResource {

  _getHPColor(hp) {
    if (!hp.max || hp.max === 0) return '#4CAF50';
    const ratio = hp.value / hp.max;
    if (ratio > 0.5) return '#4CAF50';      // Vert
    if (ratio > 0.25) return '#FFC107';     // Orange
    return '#F44336';                        // Rouge
  }

  compute(actor, key, condition, stats, level) {
    const system = actor.system;
    const hp = system.attributes?.hp || system.hp || { value: 0, max: 0, temp: 0 };
    return {
      value: hp.value ?? 0,
      max: hp.max ?? 0,
      temp: hp.temp ?? 0,
      color: this._getHPColor(hp)
    };
  }

  async adjust(actor, key, condition, delta) {
    const system = actor.system;
    const hp = system.attributes?.hp || system.hp || { value: 0, max: 0, temp: 0 };
    const basePath = system.attributes?.hp ? 'system.attributes.hp' : 'system.hp';
    const currentHp = hp.value || 0;
    const currentTemp = hp.temp || 0;
    const maxHp = hp.max || 0;

    if (delta < 0) {
      const damage = Math.abs(delta);
      const tempDamage = Math.min(damage, currentTemp);
      const remainingDamage = damage - tempDamage;
      const newTemp = currentTemp - tempDamage;
      const newHp = Math.max(0, currentHp - remainingDamage);
      await actor.update({
        [`${basePath}.temp`]: newTemp,
        [`${basePath}.value`]: newHp
      });
    } else {
      const newHp = Math.min(maxHp, currentHp + delta);
      await actor.update({ [`${basePath}.value`]: newHp });
    }
  }

  /**
   * Reset specifique au safe rest
   */
  async resetOnSafeRest(actor) {
    const system = actor.system;
    const hp = system.attributes?.hp || system.hp || { value: 0, max: 0 };
    const basePath = system.attributes?.hp ? 'system.attributes.hp' : 'system.hp';
    await actor.update({
      [`${basePath}.value`]: hp.max || 0,
      [`${basePath}.temp`]: 0
    });
  }

  toDisplayData(key, computedData, condition) {
    const hpBars = [];

    hpBars.push({
      key: 'hp',
      label: 'HP',
      value: computedData.value,
      max: computedData.max,
      temp: computedData.temp,
      color: computedData.color,
      supportsMergedBars: true,
      controls: [
        { delta: -5, label: '-5' },
        { delta: -1, label: '-1' },
        { delta: 1, label: '+1' },
        { delta: 5, label: '+5' }
      ]
    });

    if (computedData.temp) {
      hpBars.push({
        key: 'tempHp',
        label: 'Temp HP',
        value: computedData.temp,
        max: computedData.temp,
        color: '#9C27B0',
        hideMax: true,
        supportsMergedBars: true,
        controls: [
          { delta: -5, label: '-5' },
          { delta: -1, label: '-1' },
          { delta: 1, label: '+1' },
          { delta: 5, label: '+5' }
        ]
      });
    }

    return { category: 'hpBar', data: hpBars };
  }
}
