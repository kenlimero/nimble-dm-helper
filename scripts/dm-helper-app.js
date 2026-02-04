import { ResourceTracker } from './resource-tracker.js';
import { CLASS_CONFIGS } from './class-configs/index.js';
import { MODULE_ID, MODULE_PATH } from './constants.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Application principale du DM Helper
 * Fenetre flottante affichant les ressources des PJ
 */
export class NimbleDMHelperApp extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    super(options);
    this.resourceTracker = new ResourceTracker(this);
  }

  static DEFAULT_OPTIONS = {
    id: MODULE_ID,
    classes: ['nimble-dm-helper', 'sheet'],
    position: {
      width: 420,
      height: 600
    },
    window: {
      title: 'NIMBLE_DM_HELPER.title',
      minimizable: true,
      resizable: true,
      controls: [
        {
          icon: 'fas fa-sync-alt',
          action: 'refresh',
          label: 'NIMBLE_DM_HELPER.refresh'
        }
      ]
    },
    actions: {
      adjustResource: NimbleDMHelperApp._onResourceAdjust,
      openSheet: NimbleDMHelperApp._onOpenSheet,
      refresh: NimbleDMHelperApp._onRefresh,
      rollDice: NimbleDMHelperApp._onRollDice,
      clearDice: NimbleDMHelperApp._onClearDice,
      editSingleValue: NimbleDMHelperApp._onEditSingleValue,
      clearSingleValue: NimbleDMHelperApp._onClearSingleValue,
      deleteAbility: NimbleDMHelperApp._onDeleteAbility
    }
  };

  static PARTS = {
    main: {
      template: `${MODULE_PATH}/templates/dm-helper.hbs`,
      scrollable: ['.dm-helper-content']
    }
  };

  /**
   * Recupere les donnees pour le template
   */
  async _prepareContext(options = {}) {
    const data = {};

    const filterByPresence = game.settings.get(MODULE_ID, 'filterByPresence');
    const isGM = game.user.isGM;

    let playerCharacters;

    if (!isGM) {
      // Joueur : uniquement son propre personnage
      playerCharacters = game.user.character ? [game.user.character] : [];
    } else if (filterByPresence) {
      // GM + filtre par presence : personnages principaux des joueurs connectés
      playerCharacters = game.users
        .filter(user =>
          user.active &&                         // Joueur connecté
          !user.isGM &&                          // Pas le GM
          user.character                         // A un main character assigné
        )
        .map(user => user.character)
        .filter(actor =>
          actor &&
          !actor.getFlag(MODULE_ID, 'excluded')  // Pas exclu manuellement
        );
    } else {
      // GM sans filtre : tous les personnages joueurs
      playerCharacters = game.actors.filter(actor =>
        actor.type === 'character' &&
        actor.hasPlayerOwner &&
        !actor.getFlag(MODULE_ID, 'excluded')
      );
    }

    // Construire les donnees de chaque personnage
    data.characters = await Promise.all(
      playerCharacters.map(actor => this._buildCharacterData(actor))
    );

    data.settings = {
      showAbilities: game.settings.get(MODULE_ID, 'showAbilities'),
      showDeleteAbility: game.settings.get(MODULE_ID, 'showDeleteAbility'),
      showDicePoolMax: game.settings.get(MODULE_ID, 'showDicePoolMax'),
      compactMode: game.settings.get(MODULE_ID, 'compactMode'),
      mergedBars: game.settings.get(MODULE_ID, 'mergedBars'),
      woundsOnlyAtZeroHP: game.settings.get(MODULE_ID, 'woundsOnlyAtZeroHP')
    };

    data.isCompact = data.settings.compactMode;

    return data;
  }

  /**
   * Construit les donnees d'un personnage pour l'affichage
   */
  async _buildCharacterData(actor) {
    const system = actor.system;
    const classId = this._getActorClass(actor);
    const classConfig = CLASS_CONFIGS[classId] || {};
    const level = this._getActorLevel(actor);

    // Ressources communes
    const hp = system.attributes?.hp || system.hp || { value: 0, max: 0 };
    const wounds = system.attributes?.wounds || system.wounds || { value: 0, max: 6 };

    const resources = {
      hp: {
        value: hp.value ?? 0,
        max: hp.max ?? 0,
        temp: hp.temp ?? 0,
        color: this._getHPColor(hp)
      },
      wounds: {
        value: wounds.value ?? 0,
        max: wounds.max ?? 6
      }
    };

    // Ressources specifiques a la classe
    const classResources = await this.resourceTracker.getClassResources(
      actor,
      classId,
      classConfig,
      level
    );

    // Categoriser les ressources par type d'affichage
    const dicePools = [];
    const valueResources = [];
    const inlineResources = [];
    const barResources = [];

    for (const [key, value] of Object.entries(classResources)) {
      if (!value || typeof value !== 'object') continue;

      const entry = { key, label: `NIMBLE_DM_HELPER.resources.${key}`, ...value };

      if (value.canStoreDice) {
        dicePools.push(entry);
      } else if (value.canStoreValue) {
        valueResources.push(entry);
      } else if (value.displayType === 'bar') {
        barResources.push(entry);
      } else if (value.displayType === 'inline') {
        inlineResources.push(entry);
      }
    }

    // Abilites depuis les items 'feature' de l'acteur
    const abilities = this._getActorFeatures(actor, level);

    // Conditions actives
    const conditions = this._getConditions(actor);

    // Appliquer le degrade de couleur dynamique a la mana
    if (classResources.mana) {
      classResources.mana.color = this._getManaColor(classResources.mana);
    }

    return {
      id: actor.id,
      name: actor.name,
      img: actor.img,
      class: classId,
      className: classConfig.name || this._formatClassName(classId),
      level: level,
      resources: { ...resources, ...classResources },
      dicePools,
      valueResources,
      inlineResources,
      barResources,
      abilities,
      conditions,
      hasClassResources: Object.keys(classResources).length > 0,
      showWounds: !game.settings.get(MODULE_ID, 'woundsOnlyAtZeroHP') || (hp.value ?? 0) === 0 || (wounds.value ?? 0) > 0
    };
  }

  /**
   * Determine la classe principale de l'acteur
   */
  _getActorClass(actor) {
    // Nimble stocke les classes comme items
    const classItem = actor.items.find(i => i.type === 'class');
    if (classItem) {
      const id = classItem.system?.identifier || classItem.name || 'unknown';
      return id.toLowerCase().replace(/\s+/g, '');
    }
    // Fallback : chercher dans les flags ou le systeme
    const fallback = actor.system?.class?.identifier || 'unknown';
    return fallback.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Recupere le niveau de l'acteur
   */
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

  /**
   * Formate le nom de classe
   */
  _formatClassName(classId) {
    if (!classId || classId === 'unknown') return 'Unknown';
    return classId.charAt(0).toUpperCase() + classId.slice(1).replace(/([A-Z])/g, ' $1');
  }

  /**
   * Calcule la couleur de la barre HP
   */
  _getHPColor(hp) {
    if (!hp.max || hp.max === 0) return '#4CAF50';
    const ratio = hp.value / hp.max;
    if (ratio > 0.5) return '#4CAF50';      // Vert
    if (ratio > 0.25) return '#FFC107';     // Orange
    return '#F44336';                        // Rouge
  }

  /**
   * Calcule la couleur de la barre de mana
   */
  _getManaColor(mana) {
    if (!mana.max || mana.max === 0) return '#2196F3';
    const ratio = mana.value / mana.max;
    if (ratio > 0.5) return '#2196F3';      // Bleu
    if (ratio > 0.25) return '#7B1FA2';     // Violet
    return '#4A148C';                        // Violet fonce
  }

  /**
   * Recupere les features de l'acteur filtrees par niveau
   */
  _getActorFeatures(actor, level) {
    const features = actor.items.filter(item => item.type === 'feature');

    return features
      .filter(f => {
        const minLevel = f.system?.level ?? f.system?.minLevel ?? 1;
        return minLevel <= level;
      })
      .map(f => ({
        id: f.id,
        name: f.name,
        description: (f.system?.description?.value ?? f.system?.description ?? '')
          .replace(/@UUID\[[^\]]*\]\{([^}]*)\}/g, '<strong>$1</strong>')
          .replace(/\[\[\/r\s+([^\]]*)\]\]/g, '$1'),
        minLevel: f.system?.level ?? f.system?.minLevel ?? 1,
        available: true
      }))
      .sort((a, b) => a.minLevel - b.minLevel);
  }

  /**
   * Recupere les conditions actives
   */
  _getConditions(actor) {
    if (!actor.effects) return [];
    return actor.effects
      .filter(e => !e.disabled)
      .map(e => ({
        id: e.id,
        name: e.name || e.label,
        icon: e.icon || e.img
      }));
  }

  /**
   * Active les event listeners apres le rendu
   */
  _onRender(context, options) {
    const html = this.element;

    // Generer les wound boxes dynamiquement
    html.querySelectorAll('.wound-boxes').forEach(el => {
      const current = parseInt(el.dataset.current) || 0;
      const max = parseInt(el.dataset.max) || 6;
      let boxesHtml = '';
      for (let j = 0; j < max; j++) {
        const filled = j < current ? 'filled' : '';
        boxesHtml += `<i class="wound-box fa-solid fa-droplet ${filled}"></i>`;
      }
      el.innerHTML = boxesHtml;
    });

    // Generer les dice slots dynamiquement
    html.querySelectorAll('.dice-pool').forEach(poolEl => {
      const card = poolEl.closest('.character-card');
      const actorId = card?.dataset?.actorId;
      const resourceKey = poolEl.dataset.resource;
      const max = parseInt(poolEl.dataset.max) || 0;
      const color = poolEl.querySelector('.dice-display')?.dataset?.color || '#7B68EE';

      // Recuperer les valeurs actuelles depuis le contexte
      const character = context.characters?.find(c => c.id === actorId);
      const dicePool = character?.dicePools?.find(dp => dp.key === resourceKey);
      const values = dicePool?.values || [];

      const displayEl = poolEl.querySelector('.dice-display');
      if (!displayEl) return;

      const dieSize = poolEl.dataset.dieSize || 'd6';
      let slotsHtml = '';
      for (let i = 0; i < max; i++) {
        const value = values[i] ?? 0;
        const isEmpty = value === 0;
        const emptyClass = isEmpty ? 'empty' : '';
        slotsHtml += `<span class="die-slot" data-index="${i}"><span class="die-value die-${dieSize} ${emptyClass}" data-index="${i}" data-value="${value}" style="--die-color: ${color}; background: ${isEmpty ? 'rgba(0,0,0,0.3)' : color};">${value}</span>`;
        if (!isEmpty) {
          slotsHtml += `<button class="die-delete" data-index="${i}" title="${game.i18n.localize('NIMBLE_DM_HELPER.clearDice')}"><i class="fas fa-times"></i></button>`;
        }
        slotsHtml += `</span>`;
      }
      displayEl.innerHTML = slotsHtml;

      // Ajouter les event listeners pour l'edition au clic
      displayEl.querySelectorAll('.die-value').forEach(dieEl => {
        dieEl.addEventListener('click', (event) => this._onEditDieValue(event, actorId, resourceKey));
      });

      // Ajouter les event listeners pour la suppression
      displayEl.querySelectorAll('.die-delete').forEach(delEl => {
        delEl.addEventListener('click', async (event) => {
          event.stopPropagation();
          const index = parseInt(delEl.dataset.index);
          const actor = game.actors.get(actorId);
          if (!actor) return;
          await this.resourceTracker.setDieValue(actor, resourceKey, index, 0);
          this.render();
        });
      });
    });

    // Double-clic sur valeur pour editer
    html.querySelectorAll('.resource-value').forEach(el => {
      el.addEventListener('dblclick', this._onEditValue.bind(this));
    });

    // Hover sur abilite = tooltip HTML custom
    html.querySelectorAll('.ability-item').forEach(el => {
      const desc = el.dataset.description;
      if (!desc) return;

      el.addEventListener('mouseenter', () => {
        let tooltip = document.getElementById('ndh-ability-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'ndh-ability-tooltip';
          document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = desc;
        tooltip.classList.add('visible');

        const rect = el.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 6}px`;

        // Ajuster si le tooltip dépasse à droite
        requestAnimationFrame(() => {
          const tooltipRect = tooltip.getBoundingClientRect();
          if (tooltipRect.right > window.innerWidth - 8) {
            tooltip.style.left = `${window.innerWidth - tooltipRect.width - 8}px`;
          }
        });
      });

      el.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('ndh-ability-tooltip');
        if (tooltip) tooltip.classList.remove('visible');
      });
    });
  }

  /**
   * Edite la valeur d'un de dans le pool
   */
  async _onEditDieValue(event, actorId, resourceKey) {
    const dieEl = event.currentTarget;
    const index = parseInt(dieEl.dataset.index);
    const currentValue = parseInt(dieEl.dataset.value) || 0;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const dicePool = dieEl.closest('.dice-pool');
    const dieSize = dicePool?.dataset?.dieSize || 'd6';
    const maxValue = parseInt(dieSize.replace('d', '')) || 6;

    const newValue = await this._promptForDieValue(currentValue, maxValue);
    if (newValue !== null) {
      await this.resourceTracker.setDieValue(actor, resourceKey, index, newValue);
      this.render();
    }
  }

  /**
   * Prompt pour nouvelle valeur de de
   */
  async _promptForDieValue(currentValue, maxValue) {
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: 'Valeur du dé' },
      content: `<input type="number" name="value" value="${currentValue}" min="0" max="${maxValue}" style="width: 100%">`,
      ok: {
        label: 'OK',
        callback: (event, button) => {
          const form = button.form ?? event.target.closest('form');
          const input = form?.querySelector('input[name="value"]');
          return parseInt(input?.value);
        }
      }
    });
    if (result === null || isNaN(result)) return null;
    return Math.clamp(result, 0, maxValue);
  }

  /**
   * Gere les clics +/- sur les ressources (action)
   */
  static async _onResourceAdjust(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const resource = target.dataset.resource;
    const delta = parseInt(target.dataset.delta) || 0;

    if (!actorId || !resource) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    await this.resourceTracker.adjustResource(actor, resource, delta);
    this.render();
  }

  /**
   * Ouvre la fiche de personnage (action)
   */
  static _onOpenSheet(event, target) {
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    if (!actorId) return;

    const actor = game.actors.get(actorId);
    actor?.sheet?.render(true);
  }

  /**
   * Rafraichit la fenetre (action)
   */
  static _onRefresh(event, target) {
    this.render({ force: true });
  }

  /**
   * Lance un dé et l'ajoute au pool (action)
   */
  static async _onRollDice(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const dicePool = target.closest('.dice-pool');
    const resource = dicePool?.dataset?.resource;
    const dieSize = dicePool?.dataset?.dieSize;

    if (!actorId || !resource || !dieSize) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    await this.resourceTracker.rollAndAddDie(actor, resource, dieSize);
    this.render();
  }

  /**
   * Vide tous les dés d'un pool (action)
   */
  static async _onClearDice(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const dicePool = target.closest('.dice-pool');
    const resource = dicePool?.dataset?.resource;

    if (!actorId || !resource) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    await this.resourceTracker.clearDice(actor, resource);
    this.render();
  }

  /**
   * Remet a zero une valeur unique (action)
   */
  static async _onClearSingleValue(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const resource = target.dataset.resource || target.closest('[data-resource]')?.dataset?.resource;

    if (!actorId || !resource) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    await this.resourceTracker.setSingleValue(actor, resource, 0);
    this.render();
  }

  /**
   * Supprime une habileté (feature) de l'acteur (action)
   */
  static async _onDeleteAbility(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const abilityId = target.dataset.abilityId || target.closest('[data-ability-id]')?.dataset?.abilityId;

    if (!actorId || !abilityId) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const item = actor.items.get(abilityId);
    if (!item) return;

    const confirm = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize('NIMBLE_DM_HELPER.deleteAbility') },
      content: `<p>${game.i18n.format('NIMBLE_DM_HELPER.deleteAbilityConfirm', { name: item.name })}</p>`
    });

    if (confirm) {
      await item.delete();
      this.render();
    }
  }

  /**
   * Edite une valeur unique (action pour canStoreValue)
   */
  static async _onEditSingleValue(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const valueResource = target.closest('.value-resource');
    const resource = valueResource?.dataset?.resource;

    if (!actorId || !resource) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const currentValue = parseInt(target.dataset.value) || 0;
    const newValue = await this._promptForSingleValue(resource, currentValue);

    if (newValue !== null && newValue !== currentValue) {
      await this.resourceTracker.setSingleValue(actor, resource, newValue);
      this.render();
    }
  }

  /**
   * Prompt pour nouvelle valeur unique
   */
  async _promptForSingleValue(resource, currentValue) {
    const title = game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resource}`) || resource;
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title },
      content: `<input type="number" name="value" value="${currentValue}" min="0" style="width: 100%">`,
      ok: {
        label: 'OK',
        callback: (event, button) => {
          const form = button.form ?? event.target.closest('form');
          const input = form?.querySelector('input[name="value"]');
          return parseInt(input?.value);
        }
      }
    });
    return (result === null || isNaN(result)) ? null : Math.max(0, result);
  }

  /**
   * Permet l'edition directe d'une valeur
   */
  async _onEditValue(event) {
    const el = event.currentTarget;
    const card = el.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const resource = el.dataset.resource;

    if (!actorId || !resource) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const currentValue = parseInt(el.textContent) || 0;
    const newValue = await this._promptForValue(resource, currentValue);

    if (newValue !== null && newValue !== currentValue) {
      const delta = newValue - currentValue;
      await this.resourceTracker.adjustResource(actor, resource, delta);
      this.render();
    }
  }

  /**
   * Prompt pour nouvelle valeur
   */
  async _promptForValue(resource, currentValue) {
    const title = game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resource}`) || resource;
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title },
      content: `<input type="number" name="value" value="${currentValue}" style="width: 100%">`,
      ok: {
        label: 'OK',
        callback: (event, button) => {
          const form = button.form ?? event.target.closest('form');
          const input = form?.querySelector('input[name="value"]');
          return parseInt(input?.value);
        }
      }
    });
    return (result === null || isNaN(result)) ? null : result;
  }
}
