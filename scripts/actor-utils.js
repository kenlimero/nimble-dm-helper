/**
 * Cache par cycle de rendu pour les donnees d'acteur.
 * Appeler ActorCache.begin() au debut de _prepareContext(),
 * ActorCache.end() dans le finally.
 */
export class ActorCache {
  static _featureNames = new Map();
  static _stats = new Map();
  static _classId = new Map();
  static _level = new Map();
  static _active = false;

  static begin() {
    this._featureNames.clear();
    this._stats.clear();
    this._classId.clear();
    this._level.clear();
    this._active = true;
  }

  static end() {
    this._featureNames.clear();
    this._stats.clear();
    this._classId.clear();
    this._level.clear();
    this._active = false;
  }
}

/**
 * Determine la classe principale de l'acteur
 */
export function getActorClass(actor) {
  if (ActorCache._active && ActorCache._classId.has(actor.id)) {
    return ActorCache._classId.get(actor.id);
  }

  let result;
  const classItem = actor.items.find(i => i.type === 'class');
  if (classItem) {
    const id = classItem.system?.identifier || classItem.name || 'unknown';
    result = id.toLowerCase().replace(/\s+/g, '');
  } else {
    const fallback = actor.system?.class?.identifier || 'unknown';
    result = fallback.toLowerCase().replace(/\s+/g, '');
  }

  if (ActorCache._active) {
    ActorCache._classId.set(actor.id, result);
  }
  return result;
}

/**
 * Recupere le niveau de l'acteur
 */
export function getActorLevel(actor) {
  if (ActorCache._active && ActorCache._level.has(actor.id)) {
    return ActorCache._level.get(actor.id);
  }

  const rollData = actor.getRollData?.() || {};
  let result;
  if (rollData.level) {
    result = rollData.level;
  } else if (actor.system?.details?.level) {
    result = actor.system.details.level;
  } else if (actor.system?.level) {
    result = actor.system.level;
  } else {
    const classItems = actor.items.filter(i => i.type === 'class');
    result = classItems.length > 0
      ? classItems.reduce((sum, c) => sum + (c.system?.levels || c.system?.level || 1), 0)
      : 1;
  }

  if (ActorCache._active) {
    ActorCache._level.set(actor.id, result);
  }
  return result;
}

/**
 * Recupere les stats (str, dex, int, wil) de l'acteur
 */
export function getStats(actor) {
  if (ActorCache._active && ActorCache._stats.has(actor.id)) {
    return ActorCache._stats.get(actor.id);
  }

  const rollData = actor.getRollData?.() || {};
  const system = actor.system || {};
  const abilities = system.abilities || {};

  const result = {
    str: rollData.strength ?? system.strength ?? abilities.strength?.value ?? abilities.strength?.mod ?? 0,
    dex: rollData.dexterity ?? system.dexterity ?? abilities.dexterity?.value ?? abilities.dexterity?.mod ?? 0,
    int: rollData.intelligence ?? system.intelligence ?? abilities.intelligence?.value ?? abilities.intelligence?.mod ?? 0,
    wil: rollData.will ?? system.will ?? rollData.wisdom ?? system.wisdom ?? abilities.will?.value ?? abilities.will?.mod ?? 0
  };

  if (ActorCache._active) {
    ActorCache._stats.set(actor.id, result);
  }
  return result;
}

/**
 * Verifie si l'acteur possede une feature avec le nom specifie.
 * Pendant un cycle de cache, construit un Set une seule fois par acteur => O(1) lookups.
 */
export function hasFeature(actor, featureName) {
  if (!actor.items) return false;

  if (ActorCache._active) {
    if (!ActorCache._featureNames.has(actor.id)) {
      const nameSet = new Set();
      for (const item of actor.items) {
        if (item.type === 'feature' && item.name) {
          nameSet.add(item.name.toLowerCase().trim());
        }
      }
      ActorCache._featureNames.set(actor.id, nameSet);
    }
    return ActorCache._featureNames.get(actor.id).has(featureName.toLowerCase().trim());
  }

  // Hors cycle de cache (action handlers)
  const normalizedName = featureName.toLowerCase().trim();
  return actor.items.some(item =>
    item.type === 'feature' &&
    item.name?.toLowerCase().trim() === normalizedName
  );
}
