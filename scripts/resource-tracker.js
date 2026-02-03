import { MODULE_ID } from './constants.js';

/**
 * Gestionnaire des ressources specifiques aux classes Nimble
 */
export class ResourceTracker {

  constructor(app) {
    this.app = app;
  }

  /**
   * Recupere les ressources specifiques a une classe
   */
  async getClassResources(actor, classId, config, level) {
    const system = actor.system;
    const resources = {};
    const conditions = config.resourceConditions || {};

    // Recuperer les stats de l'acteur
    const stats = this._getStats(actor);

    switch (classId) {
      case 'berserker':
        resources.fury = this._getFuryDice(actor, stats);
        resources.rageActive = this._hasActiveEffect(actor, 'rage');
        break;

      case 'mage':
        resources.mana = {
          value: this._getManaValue(actor),
          max: this._getManaMax(actor),
          formula: 'INT × 3 + LVL',
          color: '#2196F3'
        };
        break;

      case 'oathsworn':
        resources.mana = {
          value: this._getManaValue(actor),
          max: this._getManaMax(actor),
          formula: 'WIL + LVL',
          color: '#FFD700'
        };
        resources.judgmentDice = this._getJudgmentDice(actor);
        resources.layOnHands = this._getLayOnHands(actor, level);
        break;

      case 'commander':
        resources.combatDice = this._getCombatDice(actor, stats);
        resources.coordinatedStrike = this._getCoordinatedStrike(actor, level);
        break;

      case 'hunter':
        resources.thrillOfHunt = this._getThrillCharges(actor);
        resources.huntersMark = this._getHuntersMark(actor);
        break;

      case 'zephyr':
        resources.burstOfSpeed = {
          value: actor.getFlag(MODULE_ID, 'burstOfSpeed') ?? stats.dex,
          max: stats.dex,
          color: '#00BCD4'
        };
        break;

      case 'stormshifter':
        resources.mana = {
          value: this._getManaValue(actor),
          max: this._getManaMax(actor),
          formula: 'WIL × 3 + LVL',
          color: '#9C27B0'
        };
        resources.beastshift = this._getBeastshiftCharges(actor, level, stats);
        break;

      case 'songweaver':
        resources.mana = {
          value: this._getManaValue(actor),
          max: this._getManaMax(actor),
          formula: 'INT × 3 + LVL',
          color: '#E91E63'
        };
        resources.inspiration = {
          value: actor.getFlag(MODULE_ID, 'inspiration') ?? stats.wil * 2,
          max: stats.wil * 2,
          color: '#FF9800'
        };
        break;

      case 'shadowmancer':
        resources.pilferedPower = {
          value: actor.getFlag(MODULE_ID, 'pilferedPower') ?? stats.dex,
          max: stats.dex,
          color: '#673AB7'
        };
        resources.shadowMinions = {
          value: actor.getFlag(MODULE_ID, 'shadowMinions') ?? 0,
          max: Math.max(stats.int, level),
          color: '#424242'
        };
        break;

      case 'shepherd':
        resources.mana = {
          value: this._getManaValue(actor),
          max: this._getManaMax(actor),
          formula: 'WIL × 3 + LVL',
          color: '#8BC34A'
        };
        resources.searingLight = {
          value: actor.getFlag(MODULE_ID, 'searingLight') ?? stats.wil,
          max: stats.wil,
          color: '#FFEB3B'
        };
        break;

      case 'cheat':
      case 'thecheat':
        resources.sneakAttack = {
          available: !actor.getFlag('nimble', 'sneakAttackUsed'),
          dieSize: this._getSneakAttackDie(level)
        };
        resources.cheatUses = {
          moveOrHide: !actor.getFlag('nimble', 'cheatMoveUsed'),
          daily: {
            value: actor.getFlag(MODULE_ID, 'cheatDaily') ?? 1,
            max: 1
          }
        };
        break;
    }

    // Filtrer les ressources selon les conditions (requiresFeature)
    return this._filterResourcesByConditions(actor, resources, conditions, stats, level);
  }

  /**
   * Filtre les ressources selon les conditions definies dans la config
   */
  _filterResourcesByConditions(actor, resources, conditions, stats, level) {
    const filtered = {};

    for (const [key, value] of Object.entries(resources)) {
      const condition = conditions[key];

      // Pas de condition = toujours afficher
      if (!condition) {
        filtered[key] = value;
        continue;
      }

      // Verifier requiresFeature
      if (condition.requiresFeature) {
        if (this._hasFeature(actor, condition.requiresFeature)) {
          // Calculer dieSize et max depuis la config si disponible
          const dieSize = condition.dieProgression
            ? this._getDieSizeFromProgression(condition.dieProgression, level)
            : value.dieSize;
          const max = condition.maxProgression
            ? this._getMaxFromProgression(condition.maxProgression, level)
            : (condition.maxStat ? stats[condition.maxStat] : value.max);

          // Ajouter les proprietes de la condition a la ressource
          filtered[key] = {
            ...value,
            dieSize: dieSize || value.dieSize,
            max: max ?? value.max,
            canStoreDice: condition.canStoreDice || false,
            canStoreValue: condition.canStoreValue || false
          };
        }
      }
    }

    return filtered;
  }

  /**
   * Calcule la taille de dé selon la progression et le niveau
   */
  _getDieSizeFromProgression(progression, level) {
    if (!progression || !progression.length) return 'd6';

    // Trier par niveau décroissant et trouver le premier applicable
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
   * Verifie si l'acteur possede une feature avec le nom specifie
   */
  _hasFeature(actor, featureName) {
    if (!actor.items) return false;

    const normalizedName = featureName.toLowerCase().trim();
    return actor.items.some(item =>
      item.type === 'feature' &&
      item.name?.toLowerCase().trim() === normalizedName
    );
  }

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
        // Degats: d'abord les HP temporaires, puis les HP normaux
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
        // Soins: seulement les HP normaux
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
      // Utiliser le systeme Nimble pour stocker le mana
      const mana = actor.system?.resources?.mana;
      if (mana) {
        const maxMana = mana.max || 0;
        const current = mana.value ?? mana.current ?? 0;
        const newValue = Math.clamp(current + delta, 0, maxMana);
        // Mettre a jour value et current pour Nimble
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
   * Lance un dé et l'ajoute au premier emplacement vide du pool
   */
  async rollAndAddDie(actor, resourceKey, dieSize) {
    const flagInfo = this._getFlagInfo(resourceKey);
    let currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];

    // Vérifier le max
    const stats = this._getStats(actor);
    const level = this._getActorLevel(actor);
    const maxDice = this._getDicePoolMax(resourceKey, stats, level);

    // S'assurer que le tableau a la bonne taille
    while (currentDice.length < maxDice) {
      currentDice.push(0);
    }

    // Trouver le premier emplacement vide (valeur 0)
    const emptyIndex = currentDice.findIndex(v => v === 0);
    if (emptyIndex === -1) {
      ui.notifications.warn(game.i18n.localize('NIMBLE_DM_HELPER.notifications.dicePoolFull') || 'Pool de dés plein!');
      return;
    }

    // Lancer le dé
    const roll = await new Roll(`1${dieSize}`).evaluate();
    const result = roll.total;

    // Afficher le résultat dans le chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resourceKey}`)} - Dé ajouté au pool`
    });

    // Placer le résultat dans l'emplacement vide
    currentDice[emptyIndex] = result;
    await actor.setFlag(flagInfo.module, flagInfo.key, currentDice);
  }

  /**
   * Vide tous les dés d'un pool
   */
  async clearDice(actor, resourceKey) {
    const flagInfo = this._getFlagInfo(resourceKey);
    await actor.setFlag(flagInfo.module, flagInfo.key, []);
  }

  /**
   * Modifie la valeur d'un dé spécifique dans le pool
   */
  async setDieValue(actor, resourceKey, index, value) {
    const flagInfo = this._getFlagInfo(resourceKey);
    const stats = this._getStats(actor);
    const level = this._getActorLevel(actor);
    const maxDice = this._getDicePoolMax(resourceKey, stats, level);

    // Récupérer les dés actuels ou créer un tableau vide de la bonne taille
    let currentDice = actor.getFlag(flagInfo.module, flagInfo.key) || [];

    // S'assurer que le tableau a la bonne taille
    while (currentDice.length < maxDice) {
      currentDice.push(0);
    }

    // Modifier la valeur à l'index
    if (index >= 0 && index < maxDice) {
      currentDice[index] = value;
    }

    await actor.setFlag(flagInfo.module, flagInfo.key, currentDice);
  }

  /**
   * Modifie une valeur unique stockée (pour canStoreValue)
   */
  async setSingleValue(actor, resourceKey, value) {
    const flagInfo = this._getSingleValueFlagInfo(resourceKey);
    await actor.setFlag(flagInfo.module, flagInfo.key, value);
  }

  /**
   * Retourne les infos de flag pour une valeur unique
   */
  _getSingleValueFlagInfo(resourceKey) {
    const flagMap = {
      judgmentDice: { module: 'nimble', key: 'judgmentValue' }
    };
    return flagMap[resourceKey] || { module: MODULE_ID, key: `${resourceKey}Value` };
  }

  /**
   * Retourne les infos de flag pour une ressource
   */
  _getFlagInfo(resourceKey) {
    const flagMap = {
      fury: { module: 'nimble', key: 'furyDice' },
      judgmentDice: { module: 'nimble', key: 'judgmentDice' },
      combatDice: { module: 'nimble', key: 'combatDice' }
    };
    return flagMap[resourceKey] || { module: MODULE_ID, key: `${resourceKey}Dice` };
  }

  /**
   * Retourne le max de dés pour un pool
   */
  _getDicePoolMax(resourceKey, stats, level) {
    switch (resourceKey) {
      case 'fury':
        return stats.str;
      case 'combatDice':
        return stats.str;
      case 'judgmentDice':
        return level >= 14 ? 3 : 2;
      default:
        return 10;
    }
  }

  // --- Methodes privees ---

  _getStats(actor) {
    // Nimble utilise getRollData() pour les valeurs @intelligence, @strength, etc.
    const rollData = actor.getRollData?.() || {};
    const system = actor.system || {};
    const abilities = system.abilities || {};

    return {
      str: rollData.strength ?? system.strength ?? abilities.strength?.value ?? abilities.strength?.mod ?? 0,
      dex: rollData.dexterity ?? system.dexterity ?? abilities.dexterity?.value ?? abilities.dexterity?.mod ?? 0,
      int: rollData.intelligence ?? system.intelligence ?? abilities.intelligence?.value ?? abilities.intelligence?.mod ?? 0,
      wil: rollData.will ?? system.will ?? rollData.wisdom ?? system.wisdom ?? abilities.will?.value ?? abilities.will?.mod ?? 0
    };
  }

  _getManaValue(actor) {
    // Lire le mana depuis le systeme Nimble
    const mana = actor.system?.resources?.mana;
    if (mana) {
      return mana.value ?? mana.current ?? 0;
    }
    return 0;
  }

  _getManaMax(actor) {
    // Lire le max mana depuis le systeme Nimble
    const mana = actor.system?.resources?.mana;
    return mana?.max ?? 0;
  }

  _getMaxManaFromActor(actor) {
    const classId = this._getActorClass(actor);
    const stats = this._getStats(actor);
    const level = this._getActorLevel(actor);

    switch (classId) {
      case 'mage':
      case 'songweaver':
        return this._calculateMana(stats.int, 3, level);
      case 'oathsworn':
        return this._calculateMana(stats.wil, 1, level);
      case 'stormshifter':
      case 'shepherd':
        return this._calculateMana(stats.wil, 3, level);
      default:
        return 0;
    }
  }

  _getActorClass(actor) {
    const classItem = actor.items.find(i => i.type === 'class');
    if (classItem) {
      const id = classItem.system?.identifier || classItem.name || 'unknown';
      return id.toLowerCase().replace(/\s+/g, '');
    }
    const fallback = actor.system?.class?.identifier || 'unknown';
    return fallback.toLowerCase().replace(/\s+/g, '');
  }

  _getActorLevel(actor) {
    // Nimble utilise @level dans les formules (via getRollData)
    const rollData = actor.getRollData?.() || {};
    if (rollData.level) return rollData.level;

    // Fallbacks
    if (actor.system?.details?.level) return actor.system.details.level;
    if (actor.system?.level) return actor.system.level;

    // Calculer depuis les items de classe
    const classItems = actor.items.filter(i => i.type === 'class');
    if (classItems.length > 0) {
      return classItems.reduce((sum, c) => sum + (c.system?.levels || c.system?.level || 1), 0);
    }
    return 1;
  }

  _calculateMana(statMod, multiplier, level) {
    return (statMod * multiplier) + level;
  }

  _getFuryDice(actor, stats) {
    const furyDice = actor.getFlag('nimble', 'furyDice') || [];

    return {
      count: furyDice.length,
      max: stats.str,
      dieSize: 'd4', // Valeur par défaut, sera écrasée par dieProgression
      values: furyDice,
      color: '#DC143C'
    };
  }

  _getJudgmentDice(actor) {
    const current = actor.getFlag('nimble', 'judgmentDice') || [];
    const storedValue = actor.getFlag('nimble', 'judgmentValue') ?? 0;

    return {
      count: current.length,
      max: 2, // Valeur par défaut, sera écrasée par maxProgression
      dieSize: 'd6', // Valeur par défaut, sera écrasée par dieProgression
      values: current,
      storedValue,
      color: '#FFD700'
    };
  }

  _getLayOnHands(actor, level) {
    const max = level * 5;
    const current = actor.getFlag(MODULE_ID, 'layOnHands') ?? max;
    return {
      value: current,
      max,
      color: '#FFD700'
    };
  }

  _getCombatDice(actor, stats) {
    const current = actor.getFlag('nimble', 'combatDice') || [];

    return {
      count: current.length,
      max: stats.str,
      dieSize: 'd6', // Valeur par défaut, sera écrasée par dieProgression
      values: current,
      color: '#795548'
    };
  }

  _getCoordinatedStrike(actor, level) {
    let max = 1;
    if (level >= 17) max = 4;
    else if (level >= 13) max = 3;
    else if (level >= 9) max = 2;

    return {
      value: actor.getFlag(MODULE_ID, 'coordinatedStrike') ?? max,
      max,
      color: '#607D8B'
    };
  }

  _getThrillCharges(actor) {
    return {
      value: actor.getFlag(MODULE_ID, 'thrillOfHunt') || 0,
      max: null, // Pas de max fixe
      color: '#4CAF50'
    };
  }

  _getHuntersMark(actor) {
    const markTarget = actor.getFlag('nimble', 'huntersMarkTarget');
    if (!markTarget) return null;

    const target = game.actors.get(markTarget) ||
                   canvas.tokens?.get(markTarget)?.actor;
    return target?.name || 'Unknown Target';
  }

  _getBeastshiftCharges(actor, level, stats) {
    let bonus = 0;
    if (level >= 6) bonus = 1; // Expert Shifter

    return {
      value: actor.getFlag(MODULE_ID, 'beastshift') ?? (stats.dex + bonus),
      max: stats.dex + bonus,
      color: '#8BC34A'
    };
  }

  _getSneakAttackDie(level) {
    if (level >= 17) return '3d20';
    if (level >= 15) return '2d20';
    if (level >= 11) return '2d12';
    if (level >= 9) return '2d10';
    if (level >= 7) return '2d8';
    if (level >= 3) return '1d8';
    return '1d6';
  }

  _hasActiveEffect(actor, effectName) {
    if (!actor.effects) return false;
    return actor.effects.some(e =>
      (e.name || e.label || '').toLowerCase().includes(effectName) && !e.disabled
    );
  }

  _getResourceConfig(actor, resourcePath) {
    // Retourne la config de ressource si disponible
    const classId = this._getActorClass(actor);
    const stats = this._getStats(actor);
    const level = this._getActorLevel(actor);

    const configs = {
      burstOfSpeed: { max: stats.dex },
      inspiration: { max: stats.wil * 2 },
      pilferedPower: { max: stats.dex },
      shadowMinions: { max: Math.max(stats.int, level) },
      searingLight: { max: stats.wil },
      beastshift: { max: stats.dex + (level >= 6 ? 1 : 0) },
      layOnHands: { max: level * 5 }
    };

    return configs[resourcePath] || null;
  }
}
