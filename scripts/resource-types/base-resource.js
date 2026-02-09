import { MODULE_ID, SYSTEM_MODULE_ID } from '../constants.js';

// ============================================================
// Utilitaires partages (extraits de ResourceTracker)
// ============================================================

/**
 * Calcule le max d'une ressource selon sa config
 */
export function computeMax(condition, stats, level) {
  if (condition.maxProgression) {
    return getMaxFromProgression(condition.maxProgression, level);
  }
  if (condition.maxLevelMultiplier) {
    return level * condition.maxLevelMultiplier;
  }
  if (condition.maxStat) {
    let max = stats[condition.maxStat] * (condition.maxMultiplier || 1);
    if (condition.maxLevelBonus) {
      for (const bonus of condition.maxLevelBonus) {
        if (level >= bonus.level) max += bonus.bonus;
      }
    }
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
export function getDieSizeFromProgression(progression, level) {
  if (!progression || !progression.length) return 'd6';
  const sorted = [...progression].sort((a, b) => b.level - a.level);
  const applicable = sorted.find(p => level >= p.level);
  return applicable?.dieSize || progression[0].dieSize;
}

/**
 * Calcule le max selon la progression et le niveau
 */
export function getMaxFromProgression(progression, level) {
  if (!progression || !progression.length) return null;
  const sorted = [...progression].sort((a, b) => b.level - a.level);
  const applicable = sorted.find(p => level >= p.level);
  return applicable?.max ?? progression[0].max;
}

/**
 * Resout le nom de module ('system' -> SYSTEM_MODULE_ID)
 */
export function resolveModule(moduleName) {
  return moduleName === 'system' ? SYSTEM_MODULE_ID : moduleName;
}

/**
 * Retourne les infos de flag pour un dice pool
 */
export function getFlagInfo(resourceKey, condition = {}) {
  if (condition.storageModule && condition.storageKey) {
    return { module: resolveModule(condition.storageModule), key: condition.storageKey };
  }
  return { module: MODULE_ID, key: `${resourceKey}Dice` };
}

/**
 * Retourne les infos de flag pour une valeur unique
 */
export function getSingleValueFlagInfo(resourceKey, condition = {}) {
  if (condition.storageModule && condition.singleValueKey) {
    return { module: resolveModule(condition.storageModule), key: condition.singleValueKey };
  }
  return { module: MODULE_ID, key: `${resourceKey}Value` };
}

// ============================================================
// Classe abstraite de base
// ============================================================

/**
 * Classe abstraite pour tous les types de ressources.
 * Chaque sous-classe implemente :
 *   - compute(actor, key, condition, stats, level) -> objet de donnees
 *   - adjust(actor, key, condition, delta) -> Promise<void>
 *   - reset(actor, key, condition, level) -> Promise<void>
 *   - toDisplayData(key, computedData, condition) -> { category, data }
 */
export class BaseResource {

  compute(actor, key, condition, stats, level) {
    throw new Error('BaseResource.compute() must be implemented by subclass');
  }

  async adjust(actor, key, condition, delta) {
    throw new Error('BaseResource.adjust() must be implemented by subclass');
  }

  async reset(actor, key, condition, level) {
    // No-op par defaut
  }

  toDisplayData(key, computedData, condition) {
    throw new Error('BaseResource.toDisplayData() must be implemented by subclass');
  }
}
