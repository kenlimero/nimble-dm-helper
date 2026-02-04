import { MODULE_ID, SYSTEM_MODULE_ID } from './constants.js';
import { CLASS_CONFIGS } from './class-configs/index.js';
import { getActorClass, getActorLevel, getStats, hasFeature } from './actor-utils.js';

/**
 * Gestionnaire des ressources specifiques aux classes Nimble
 * Systeme data-driven : les ressources sont definies dans les class-configs
 */
export class ResourceTracker {

  constructor(app) {
    this.app = app;
  }

  /**
   * Recupere les ressources specifiques a une classe (data-driven)
   */
  async getClassResources(actor, classId, config, level) {
    const resources = {};
    const conditions = config.resourceConditions || {};
    const stats = getStats(actor);

    for (const [key, condition] of Object.entries(conditions)) {
      // Verifier requiresFeature si defini
      if (condition.requiresFeature && !hasFeature(actor, condition.requiresFeature)) {
        continue;
      }

      const resource = this._computeResource(actor, key, condition, stats, level);
      if (resource !== null && resource !== undefined) {
        resources[key] = resource;
      }
    }

    return resources;
  }

  /**
   * Calcule une ressource individuelle selon sa condition/config
   */
  _computeResource(actor, key, condition, stats, level) {
    // Status effects (ex: rageActive)
    if (condition.type === 'statusEffect') {
      return this._hasActiveEffect(actor, condition.effectName);
    }

    // Ressources speciales avec getter custom (ex: sneakAttack, cheatUses, huntersMark)
    if (condition.type === 'special') {
      const getter = this[condition.getter];
      return getter ? getter.call(this, actor, level, stats) : null;
    }

    // Mana (stocke dans system.resources.mana)
    if (condition.type === 'mana') {
      return {
        value: this._getManaValue(actor),
        max: this._getManaMax(actor),
        formula: condition.formula,
        color: condition.color
      };
    }

    // Dice pools (canStoreDice)
    if (condition.canStoreDice) {
      const flagInfo = this._getFlagInfo(key, condition);
      const currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];
      const max = this._computeMax(condition, stats, level);
      const dieSize = condition.dieProgression
        ? this._getDieSizeFromProgression(condition.dieProgression, level)
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

    // Single stored value (canStoreValue, ex: judgmentDice)
    if (condition.canStoreValue) {
      const flagInfo = this._getFlagInfo(key, condition);
      const currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];
      const singleValueModule = condition.storageModule ? this._resolveModule(condition.storageModule) : MODULE_ID;
      const singleValueKey = condition.singleValueKey || `${key}Value`;
      const storedValue = actor.getFlag(singleValueModule, singleValueKey) ?? 0;
      const max = condition.maxProgression
        ? this._getMaxFromProgression(condition.maxProgression, level)
        : this._computeMax(condition, stats, level);
      const dieSize = condition.dieProgression
        ? this._getDieSizeFromProgression(condition.dieProgression, level)
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

    // Ressource generique (inline ou bar)
    const max = this._computeMax(condition, stats, level);
    const defaultVal = condition.defaultToMax ? max : (condition.defaultValue ?? 0);
    return {
      value: actor.getFlag(MODULE_ID, key) ?? defaultVal,
      max: condition.noMax ? null : max,
      color: condition.color,
      displayType: condition.displayType || 'inline'
    };
  }

  /**
   * Calcule le max d'une ressource selon sa config
   */
  _computeMax(condition, stats, level) {
    // Progression par niveau (ex: coordinatedStrike, judgmentDice)
    if (condition.maxProgression) {
      return this._getMaxFromProgression(condition.maxProgression, level);
    }

    // Multiplicateur de niveau (ex: layOnHands = level * 5)
    if (condition.maxLevelMultiplier) {
      return level * condition.maxLevelMultiplier;
    }

    // Base sur une stat
    if (condition.maxStat) {
      let max = stats[condition.maxStat] * (condition.maxMultiplier || 1);

      // Bonus conditionnel par niveau (ex: beastshift +1 a level 6)
      if (condition.maxLevelBonus) {
        for (const bonus of condition.maxLevelBonus) {
          if (level >= bonus.level) max += bonus.bonus;
        }
      }

      // Min = level (ex: shadowMinions max(int, level))
      if (condition.maxMinLevel) {
        max = Math.max(max, level);
      }

      return max;
    }

    return null;
  }

  /**
   * Calcule la taille de de selon la progression et le niveau
   */
  _getDieSizeFromProgression(progression, level) {
    if (!progression || !progression.length) return 'd6';
    const sorted = [...progression].sort((a, b) => b.level - a.level);
    const applicable = sorted.find(p => level >= p.level);
    return applicable?.dieSize || progression[0].dieSize;
  }

  /**
   * Calcule le max selon la progression et le niveau
   */
  _getMaxFromProgression(progression, level) {
    if (!progression || !progression.length) return null;
    const sorted = [...progression].sort((a, b) => b.level - a.level);
    const applicable = sorted.find(p => level >= p.level);
    return applicable?.max ?? progression[0].max;
  }

  /**
   * Recupere la condition d'une ressource depuis les configs de classe
   */
  _getCondition(actor, resourceKey) {
    const classId = getActorClass(actor);
    const config = CLASS_CONFIGS[classId];
    return config?.resourceConditions?.[resourceKey] || {};
  }

  // ============================================================
  // Modification de ressources
  // ============================================================

  /**
   * Modifie une ressource
   */
  async adjustResource(actor, resourcePath, delta) {
    const system = actor.system;

    // Ressources systeme standard
    if (resourcePath === 'hp') {
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
    else if (resourcePath === 'tempHp') {
      const hp = system.attributes?.hp || system.hp || { temp: 0 };
      const newValue = Math.max(0, (hp.temp || 0) + delta);
      const updatePath = system.attributes?.hp ? 'system.attributes.hp.temp' : 'system.hp.temp';
      await actor.update({ [updatePath]: newValue });
    }
    else if (resourcePath === 'wounds') {
      const wounds = system.attributes?.wounds || system.wounds || { value: 0, max: 6 };
      const newValue = Math.clamp(wounds.value + delta, 0, wounds.max);
      const updatePath = system.attributes?.wounds ? 'system.attributes.wounds.value' : 'system.wounds.value';
      await actor.update({ [updatePath]: newValue });
    }
    else if (resourcePath === 'mana') {
      const mana = actor.system?.resources?.mana;
      if (mana) {
        const maxMana = mana.max || 0;
        const current = mana.value ?? mana.current ?? 0;
        const newValue = Math.clamp(current + delta, 0, maxMana);
        await actor.update({
          'system.resources.mana.value': newValue,
          'system.resources.mana.current': newValue
        });
      }
    }
    // Ressources custom via flags
    else {
      const currentValue = actor.getFlag(MODULE_ID, resourcePath) || 0;
      const config = this._getResourceConfig(actor, resourcePath);
      const max = config?.max || 999;
      const newValue = Math.clamp(currentValue + delta, 0, max);
      await actor.setFlag(MODULE_ID, resourcePath, newValue);
    }
  }

  /**
   * Lance un de et l'ajoute au premier emplacement vide du pool
   */
  async rollAndAddDie(actor, resourceKey, dieSize) {
    const condition = this._getCondition(actor, resourceKey);
    const flagInfo = this._getFlagInfo(resourceKey, condition);
    let currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];

    const stats = getStats(actor);
    const level = getActorLevel(actor);
    const maxDice = this._computeMax(condition, stats, level) || 10;

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
      flavor: `${game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resourceKey}`)} - Dé ajouté au pool`
    });

    currentDice[emptyIndex] = result;
    await actor.setFlag(flagInfo.module, flagInfo.key, currentDice);
  }

  /**
   * Vide tous les des d'un pool
   */
  async clearDice(actor, resourceKey) {
    const condition = this._getCondition(actor, resourceKey);
    const flagInfo = this._getFlagInfo(resourceKey, condition);
    await actor.setFlag(flagInfo.module, flagInfo.key, []);
  }

  /**
   * Modifie la valeur d'un de specifique dans le pool
   */
  async setDieValue(actor, resourceKey, index, value) {
    const condition = this._getCondition(actor, resourceKey);
    const flagInfo = this._getFlagInfo(resourceKey, condition);
    const stats = getStats(actor);
    const level = getActorLevel(actor);
    const maxDice = this._computeMax(condition, stats, level) || 10;

    let currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];
    while (currentDice.length < maxDice) {
      currentDice.push(0);
    }

    if (index >= 0 && index < maxDice) {
      currentDice[index] = value;
    }

    await actor.setFlag(flagInfo.module, flagInfo.key, currentDice);
  }

  /**
   * Lance des des et stocke le total comme valeur unique (canStoreValue)
   */
  async rollAndSetSingleValue(actor, resourceKey, dieSize, diceCount = 1) {
    const roll = await new Roll(`${diceCount}${dieSize}`).evaluate();
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resourceKey}`)} - ${diceCount}${dieSize}`
    });
    await this.setSingleValue(actor, resourceKey, roll.total);
  }

  /**
   * Modifie une valeur unique stockee (pour canStoreValue)
   */
  async setSingleValue(actor, resourceKey, value) {
    const condition = this._getCondition(actor, resourceKey);
    const flagInfo = this._getSingleValueFlagInfo(resourceKey, condition);
    await actor.setFlag(flagInfo.module, flagInfo.key, value);
  }

  // ============================================================
  // Flag info (stockage)
  // ============================================================

  /**
   * Retourne les infos de flag pour un dice pool
   */
  _resolveModule(moduleName) {
    return moduleName === 'system' ? SYSTEM_MODULE_ID : moduleName;
  }

  _getFlagInfo(resourceKey, condition = {}) {
    if (condition.storageModule && condition.storageKey) {
      return { module: this._resolveModule(condition.storageModule), key: condition.storageKey };
    }
    return { module: MODULE_ID, key: `${resourceKey}Dice` };
  }

  /**
   * Retourne les infos de flag pour une valeur unique
   */
  _getSingleValueFlagInfo(resourceKey, condition = {}) {
    if (condition.storageModule && condition.singleValueKey) {
      return { module: this._resolveModule(condition.storageModule), key: condition.singleValueKey };
    }
    return { module: MODULE_ID, key: `${resourceKey}Value` };
  }

  // ============================================================
  // Methodes utilitaires
  // ============================================================

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

  _hasActiveEffect(actor, effectName) {
    if (!actor.effects) return false;
    return actor.effects.some(e =>
      (e.name || e.label || '').toLowerCase().includes(effectName) && !e.disabled
    );
  }

  // ============================================================
  // Reset des ressources
  // ============================================================

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

      // Dice pools : vider le pool
      if (condition.canStoreDice) {
        const flagInfo = this._getFlagInfo(key, condition);
        await actor.setFlag(flagInfo.module, flagInfo.key, []);
        continue;
      }

      // Single value (canStoreValue) : vider le pool et remettre la valeur a zero
      if (condition.canStoreValue) {
        const flagInfo = this._getFlagInfo(key, condition);
        await actor.setFlag(flagInfo.module, flagInfo.key, []);
        const singleFlagInfo = this._getSingleValueFlagInfo(key, condition);
        await actor.setFlag(singleFlagInfo.module, singleFlagInfo.key, 0);
        continue;
      }

      // Ressources avec valeur : remettre au max
      const stats = getStats(actor);
      const max = this._computeMax(condition, stats, level);
      if (max) {
        await actor.setFlag(MODULE_ID, key, max);
      }
    }
  }

  /**
   * Retourne la config max d'une ressource (pour adjustResource)
   */
  _getResourceConfig(actor, resourcePath) {
    const condition = this._getCondition(actor, resourcePath);
    if (!condition || Object.keys(condition).length === 0) return null;

    const stats = getStats(actor);
    const level = getActorLevel(actor);
    const max = this._computeMax(condition, stats, level);
    return max !== null ? { max } : null;
  }
}
