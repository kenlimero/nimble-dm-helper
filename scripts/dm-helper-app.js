import { ResourceTracker } from './resource-tracker.js';
import { CLASS_CONFIGS } from './class-configs/index.js';
import { MODULE_ID, MODULE_PATH } from './constants.js';
import { ActorCache, getActorClass, getActorLevel } from './actor-utils.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Application principale du DM Helper
 * Fenetre flottante affichant les ressources des PJ
 */
export class NimbleDMHelperApp extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    super(options);
    this.resourceTracker = new ResourceTracker(this);
    this._renderQueued = false;
    this._sessionPinnedActors = new Set();
  }

  /**
   * Render guard : coalise les appels multiples dans une seule frame.
   * Utiliser { force: true } pour bypass (ex: refresh manuel).
   */
  render(options = {}) {
    if (this._renderQueued && !options.force) return;
    this._renderQueued = true;
    // Sauvegarder la position de scroll avant le re-render
    const scrollEl = this.element?.querySelector('.dm-helper-content');
    if (scrollEl) this._savedScrollTop = scrollEl.scrollTop;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      super.render(options);
    });
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
      resizable: true
    },
    actions: {
      adjustResource: NimbleDMHelperApp._onResourceAdjust,
      openSheet: NimbleDMHelperApp._onOpenSheet,
      refresh: NimbleDMHelperApp._onRefresh,
      rollDice: NimbleDMHelperApp._onRollDice,
      clearDice: NimbleDMHelperApp._onClearDice,
      editSingleValue: NimbleDMHelperApp._onEditSingleValue,
      rollSingleValue: NimbleDMHelperApp._onRollSingleValue,
      clearSingleValue: NimbleDMHelperApp._onClearSingleValue,
      deleteAbility: NimbleDMHelperApp._onDeleteAbility,
      editDieValue: NimbleDMHelperApp._onEditDieValueAction,
      deleteDie: NimbleDMHelperApp._onDeleteDieAction,
      clickWound: NimbleDMHelperApp._onClickWound,
      newDay: NimbleDMHelperApp._onResetAll,
      safeRestAll: NimbleDMHelperApp._onResetAll,
      removePin: NimbleDMHelperApp._onRemovePin
    }
  };

  static PARTS = {
    main: {
      template: `${MODULE_PATH}/templates/dm-helper.hbs`,
      scrollable: ['.dm-helper-content']
    }
  };

  /**
   * Retourne les controles de la barre de titre (GM only pour Safe Rest et New Day)
   */
  _getHeaderControls() {
    const controls = [
      {
        icon: 'fas fa-sync-alt',
        action: 'refresh',
        label: 'NIMBLE_DM_HELPER.refresh'
      }
    ];

    if (game.user.isGM) {
      controls.unshift(
        {
          icon: 'fas fa-sun',
          action: 'newDay',
          label: 'NIMBLE_DM_HELPER.newDay'
        },
        {
          icon: 'fas fa-campground',
          action: 'safeRestAll',
          label: 'NIMBLE_DM_HELPER.safeRestAll'
        }
      );
    }

    return controls;
  }

  /**
   * Gere le drop d'un Actor sur la fenetre
   */
  async _handleDrop(event) {
    event.preventDefault();
    if (!game.user.isGM) return;

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (e) {
      return;
    }

    if (data.type !== 'Actor') return;

    const actor = data.uuid ? await fromUuid(data.uuid) : game.actors.get(data.id);
    if (!actor) return;

    await this._pinActor(actor.id);
  }

  /**
   * Retourne l'ensemble des IDs d'acteurs epingles (persistent + session)
   */
  _getPinnedActorIds() {
    const persist = game.settings.get(MODULE_ID, 'persistPinnedActors');
    const persisted = persist ? game.settings.get(MODULE_ID, 'pinnedActors') : [];
    return new Set([...persisted, ...this._sessionPinnedActors]);
  }

  /**
   * Epingle un acteur (persistent ou session selon le setting)
   */
  async _pinActor(actorId) {
    const persist = game.settings.get(MODULE_ID, 'persistPinnedActors');

    if (persist) {
      const current = game.settings.get(MODULE_ID, 'pinnedActors');
      if (!current.includes(actorId)) {
        await game.settings.set(MODULE_ID, 'pinnedActors', [...current, actorId]);
      }
    } else {
      this._sessionPinnedActors.add(actorId);
    }

    this.render();
  }

  /**
   * Retire un acteur epingle (des deux stores)
   */
  async _unpinActor(actorId) {
    const current = game.settings.get(MODULE_ID, 'pinnedActors');
    if (current.includes(actorId)) {
      await game.settings.set(MODULE_ID, 'pinnedActors', current.filter(id => id !== actorId));
    }
    this._sessionPinnedActors.delete(actorId);
    this.render();
  }

  /**
   * Action handler : retire un personnage epingle
   */
  static async _onRemovePin(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    if (!actorId) return;
    await this._unpinActor(actorId);
  }

  /**
   * Recupere les donnees pour le template
   */
  async _prepareContext(options = {}) {
    ActorCache.begin();
    try {
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

    // Merge pinned actors (GM uniquement)
    const autoDiscoveredIds = new Set(playerCharacters.map(a => a.id));
    const pinnedIds = isGM ? this._getPinnedActorIds() : new Set();

    const additionalPinned = [];
    for (const id of pinnedIds) {
      if (autoDiscoveredIds.has(id)) continue;
      const actor = game.actors.get(id);
      if (actor) {
        additionalPinned.push(actor);
      }
    }

    const allActors = [...playerCharacters, ...additionalPinned];

    // Construire les donnees de chaque personnage
    data.characters = await Promise.all(
      allActors.map(async (actor) => {
        const charData = await this._buildCharacterData(actor);
        charData.isPinned = pinnedIds.has(actor.id) && !autoDiscoveredIds.has(actor.id);
        return charData;
      })
    );

    data.isGM = isGM;

    data.settings = {
      showAbilities: game.settings.get(MODULE_ID, 'showAbilities'),
      showDeleteAbility: game.settings.get(MODULE_ID, 'showDeleteAbility'),
      showRollButton: game.settings.get(MODULE_ID, 'showRollButton'),
      showClearButton: game.settings.get(MODULE_ID, 'showClearButton'),
      showDiceEdit: game.settings.get(MODULE_ID, 'showDiceEdit'),
      showDiceDelete: game.settings.get(MODULE_ID, 'showDiceDelete'),
      compactMode: game.settings.get(MODULE_ID, 'compactMode'),
      mergedBars: game.settings.get(MODULE_ID, 'mergedBars'),
      showBarControls: game.settings.get(MODULE_ID, 'showBarControls'),
      woundsOnlyAtZeroHP: game.settings.get(MODULE_ID, 'woundsOnlyAtZeroHP'),
      showInlineResources: game.settings.get(MODULE_ID, 'showInlineResources'),
      showDiceResources: game.settings.get(MODULE_ID, 'showDiceResources'),
      showHPMana: game.settings.get(MODULE_ID, 'showHPMana'),
      showOtherBars: game.settings.get(MODULE_ID, 'showOtherBars')
    };

    data.isCompact = data.settings.compactMode;

    return data;
    } finally {
      ActorCache.end();
    }
  }

  /**
   * Construit les donnees d'un personnage pour l'affichage
   */
  async _buildCharacterData(actor) {
    const system = actor.system;
    const classId = getActorClass(actor);
    const classConfig = CLASS_CONFIGS[classId] || {};
    const level = getActorLevel(actor);

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
    const hpBars = [];
    const manaBars = [];
    const otherResourceBars = [];

    // HP comme premiere barre (toujours presente)
    hpBars.push({
      key: 'hp',
      label: 'HP',
      value: resources.hp.value,
      max: resources.hp.max,
      temp: resources.hp.temp,
      color: resources.hp.color,
      supportsMergedBars: true,
      controls: [
        { delta: -5, label: '-5' },
        { delta: -1, label: '-1' },
        { delta: 1, label: '+1' },
        { delta: 5, label: '+5' }
      ]
    });

    // Temp HP comme barre juste apres HP (visible uniquement si > 0)
    if (resources.hp.temp) {
      hpBars.push({
        key: 'tempHp',
        label: 'Temp HP',
        value: resources.hp.temp,
        max: resources.hp.temp,
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

    // Appliquer le degrade de couleur dynamique a la mana
    if (classResources.mana) {
      classResources.mana.color = this._getManaColor(classResources.mana);
    }

    for (const [key, value] of Object.entries(classResources)) {
      if (!value || typeof value !== 'object') continue;

      const entry = { key, labelKey: `NIMBLE_DM_HELPER.resources.${key}`, ...value };

      if (value.canStoreDice) {
        dicePools.push(entry);
      } else if (value.canStoreValue) {
        entry.diceImages = Array.from({ length: entry.max || 0 }, () => entry.dieSize);
        valueResources.push(entry);
      } else if (key === 'mana' && value.max) {
        // Mana comme barre avec support merged bars
        manaBars.push({
          key: 'mana',
          labelKey: 'NIMBLE_DM_HELPER.resources.mana',
          value: value.value,
          max: value.max,
          formula: value.formula,
          color: value.color,
          supportsMergedBars: true,
          controls: [
            { delta: -1, label: '-1' },
            { delta: 1, label: '+1' },
            { delta: 5, label: '+5' }
          ]
        });
      } else if (value.displayType === 'bar') {
        // Autres bar resources (ex: Lay on Hands)
        otherResourceBars.push({
          ...entry,
          supportsMergedBars: true,
          controls: [
            { delta: -5, label: '-5' },
            { delta: -1, label: '-1' },
            { delta: 1, label: '+1' }
          ]
        });
      } else if (value.displayType === 'inline') {
        inlineResources.push(entry);
      }
    }

    // Abilites depuis les items 'feature' de l'acteur
    const abilities = this._getActorFeatures(actor, level);

    // Conditions actives
    const conditions = this._getConditions(actor);

    return {
      id: actor.id,
      name: actor.name,
      img: actor.img,
      class: classId,
      className: classConfig.name || this._formatClassName(classId),
      level: level,
      resources: { ...resources, ...classResources },
      hpBars,
      manaBars,
      otherResourceBars,
      dicePools,
      valueResources,
      inlineResources,
      abilities,
      conditions,
      hasClassResources: Object.keys(classResources).length > 0,
      showWounds: !game.settings.get(MODULE_ID, 'woundsOnlyAtZeroHP') || (hp.value ?? 0) === 0 || (wounds.value ?? 0) > 0
    };
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

    // Generer les wound boxes dynamiquement (cliquables)
    html.querySelectorAll('.wound-boxes').forEach(el => {
      const current = parseInt(el.dataset.current) || 0;
      const max = parseInt(el.dataset.max) || 6;
      let boxesHtml = '';
      for (let j = 0; j < max; j++) {
        const filled = j < current ? 'filled' : '';
        boxesHtml += `<i class="wound-box fa-solid fa-droplet ${filled}" data-action="clickWound" data-index="${j}"></i>`;
      }
      el.innerHTML = boxesHtml;
    });

    // Index des personnages pour lookup rapide O(1) dans la generation des dice pools
    const characterIndex = new Map();
    if (context.characters) {
      for (const c of context.characters) {
        characterIndex.set(c.id, c);
      }
    }

    // Generer les dice slots dynamiquement avec data-action pour delegation
    html.querySelectorAll('.dice-pool').forEach(poolEl => {
      const card = poolEl.closest('.character-card');
      const actorId = card?.dataset?.actorId;
      const resourceKey = poolEl.dataset.resource;
      const max = parseInt(poolEl.dataset.max) || 0;
      const color = poolEl.querySelector('.dice-display')?.dataset?.color || '#7B68EE';

      // Recuperer les valeurs actuelles depuis le contexte (lookup O(1))
      const character = characterIndex.get(actorId);
      const dicePool = character?.dicePools?.find(dp => dp.key === resourceKey);
      const values = dicePool?.values || [];

      const displayEl = poolEl.querySelector('.dice-display');
      if (!displayEl) return;

      const dieSize = poolEl.dataset.dieSize || 'd6';
      const showEdit = context.settings.showDiceEdit;
      const showDelete = context.settings.showDiceDelete;
      let slotsHtml = '';
      for (let i = 0; i < max; i++) {
        const value = values[i] ?? 0;
        const isEmpty = value === 0;
        const emptyClass = isEmpty ? 'empty' : '';
        slotsHtml += `<span class="die-slot" data-index="${i}">`;
        slotsHtml += `<span class="die-value die-${dieSize} ${emptyClass}" ${showEdit ? `data-action="editDieValue"` : ''} data-index="${i}" data-value="${value}" data-actor-id="${actorId}" data-resource="${resourceKey}" style="--die-color: ${color}; background: ${isEmpty ? 'rgba(0,0,0,0.3)' : color};">${value}</span>`;
        if (!isEmpty && showDelete) {
          slotsHtml += `<button class="die-delete" data-action="deleteDie" data-index="${i}" data-actor-id="${actorId}" data-resource="${resourceKey}" title="${game.i18n.localize('NIMBLE_DM_HELPER.clearDice')}"><i class="fas fa-times"></i></button>`;
        }
        slotsHtml += `</span>`;
      }
      const showRoll = context.settings.showRollButton;
      const showClear = context.settings.showClearButton;
      if (showRoll || showClear) {
        slotsHtml += `<div class="dice-controls">`;
        if (showRoll) slotsHtml += `<button class="dice-btn roll-dice" data-action="rollDice" type="button" title="${game.i18n.localize('NIMBLE_DM_HELPER.rollDice')}"><i class="fas fa-dice"></i></button>`;
        if (showClear) slotsHtml += `<button class="dice-btn clear-dice" data-action="clearDice" type="button" title="${game.i18n.localize('NIMBLE_DM_HELPER.clearDice')}"><i class="fas fa-trash"></i></button>`;
        slotsHtml += `</div>`;
      }
      displayEl.innerHTML = slotsHtml;
    });

    // Listeners delegues : attaches une seule fois sur this.element
    if (!this._delegatedListenersAttached) {
      this._delegatedListenersAttached = true;

      // Clic sur single-value pour editer (canStoreValue comme judgmentDice)
      html.addEventListener('click', (event) => {
        const el = event.target.closest('.single-value');
        if (el && el.dataset.action === 'editSingleValue') {
          event.preventDefault();
          NimbleDMHelperApp._onEditSingleValue.call(this, event, el);
        }
      });

      // Double-clic sur valeur pour editer
      html.addEventListener('dblclick', (event) => {
        const el = event.target.closest('.resource-value');
        if (el) this._onEditValue({ currentTarget: el });
      });

      // Hover sur abilite = tooltip HTML custom
      html.addEventListener('mouseover', (event) => {
        const el = event.target.closest('.ability-item');
        if (el && el.dataset.description) this._showAbilityTooltip(el);
      });

      html.addEventListener('mouseout', (event) => {
        const el = event.target.closest('.ability-item');
        if (el && !el.contains(event.relatedTarget)) {
          this._hideAbilityTooltip();
        }
      });

      // Drag and drop : autoriser le drop + feedback visuel
      html.addEventListener('dragover', (event) => {
        event.preventDefault();
        const content = event.target.closest('.dm-helper-content');
        if (content) content.classList.add('drop-hover');
      });

      html.addEventListener('dragleave', (event) => {
        const content = event.target.closest('.dm-helper-content');
        if (content && !content.contains(event.relatedTarget)) {
          content.classList.remove('drop-hover');
        }
      });

      html.addEventListener('drop', (event) => {
        const content = html.querySelector('.dm-helper-content');
        if (content) content.classList.remove('drop-hover');
        this._handleDrop(event);
      });
    }

    // Restaurer la position de scroll apres le contenu dynamique
    const scrollEl = html.querySelector('.dm-helper-content');
    if (scrollEl && this._savedScrollTop !== undefined) {
      scrollEl.scrollTop = this._savedScrollTop;
    }
  }

  /**
   * Affiche le tooltip d'une abilite
   */
  _showAbilityTooltip(el) {
    let tooltip = document.getElementById('ndh-ability-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'ndh-ability-tooltip';
      document.body.appendChild(tooltip);
    }
    tooltip.innerHTML = el.dataset.description;
    tooltip.classList.add('visible');

    const rect = el.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 6}px`;

    // Ajuster si le tooltip depasse a droite
    requestAnimationFrame(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > window.innerWidth - 8) {
        tooltip.style.left = `${window.innerWidth - tooltipRect.width - 8}px`;
      }
    });
  }

  /**
   * Cache le tooltip d'abilite
   */
  _hideAbilityTooltip() {
    const tooltip = document.getElementById('ndh-ability-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
  }

  /**
   * Edite la valeur d'un de dans le pool (action)
   */
  static async _onEditDieValueAction(event, target) {
    event.preventDefault();
    const actorId = target.dataset.actorId;
    const resourceKey = target.dataset.resource;
    const index = parseInt(target.dataset.index);
    const currentValue = parseInt(target.dataset.value) || 0;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const dicePool = target.closest('.dice-pool');
    const dieSize = dicePool?.dataset?.dieSize || 'd6';
    const maxValue = parseInt(dieSize.replace('d', '')) || 6;

    const newValue = await this._promptForDieValue(currentValue, maxValue);
    if (newValue !== null) {
      await this.resourceTracker.setDieValue(actor, resourceKey, index, newValue);
    }
  }

  /**
   * Supprime un de du pool (action)
   */
  static async _onDeleteDieAction(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const actorId = target.dataset.actorId;
    const resourceKey = target.dataset.resource;
    const index = parseInt(target.dataset.index);

    const actor = game.actors.get(actorId);
    if (!actor) return;

    await this.resourceTracker.setDieValue(actor, resourceKey, index, 0);
  }

  /**
   * Evalue une expression simple avec + et -
   * @param {string} expr - L'expression à évaluer (ex: "10+5-3")
   * @param {number} baseValue - Valeur de base si l'expression commence par + ou -
   * @returns {number|null} - Le résultat ou null si invalide
   */
  _evaluateExpression(expr, baseValue = 0) {
    if (expr === null || expr === undefined) return null;

    const cleaned = String(expr).replace(/\s/g, '');
    if (!cleaned) return null;

    // Si l'expression commence par + ou -, utiliser la valeur de base
    let expression = cleaned;
    if (/^[+-]/.test(cleaned)) {
      expression = baseValue + cleaned;
    }

    // Valider que l'expression ne contient que des chiffres, + et -
    if (!/^[\d+\-]+$/.test(expression)) return null;

    // Parser et évaluer l'expression
    const tokens = expression.match(/[+-]?\d+/g);
    if (!tokens) return null;

    const result = tokens.reduce((acc, token) => acc + parseInt(token, 10), 0);
    return isNaN(result) ? null : result;
  }

  /**
   * Prompt pour nouvelle valeur de de
   */
  async _promptForDieValue(currentValue, maxValue) {
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: 'Valeur du dé' },
      content: `<input type="text" name="value" value="${currentValue}" style="width: 100%">
        <div style="font-size: 0.85em; color: #888; margin-top: 4px;">0-${maxValue} (calcul: +/-)</div>`,
      ok: {
        label: 'OK',
        callback: (event, button) => {
          const form = button.form ?? event.target.closest('form');
          const input = form?.querySelector('input[name="value"]');
          return input?.value;
        }
      }
    });
    if (result === null) return null;
    const evaluated = this._evaluateExpression(result, currentValue);
    if (evaluated === null) return null;
    return Math.clamp(evaluated, 0, maxValue);
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
  }

  /**
   * Gere le clic sur une wound box (toggle)
   */
  static async _onClickWound(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    if (!actorId) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const index = parseInt(target.dataset.index);
    const system = actor.system;
    const wounds = system.attributes?.wounds || system.wounds || { value: 0, max: 6 };
    const current = wounds.value;

    // Clic sur la derniere wound remplie -> la retire (toggle off)
    // Sinon -> definit les wounds jusqu'a cet index (toggle on)
    const newValue = (index === current - 1) ? index : index + 1;
    const clampedValue = Math.clamp(newValue, 0, wounds.max);
    const updatePath = system.attributes?.wounds ? 'system.attributes.wounds.value' : 'system.wounds.value';
    await actor.update({ [updatePath]: clampedValue });
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
   * Reset global : reset les ressources pour tous les personnages selon l'action (newDay, safeRestAll)
   */
  static async _onResetAll(event, target) {
    const action = target.dataset.action;
    const restType = action === 'safeRestAll' ? 'safeRest' : 'newDay';
    const i18nKey = action === 'safeRestAll' ? 'safeRestAll' : 'newDay';

    const confirmed = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize(`NIMBLE_DM_HELPER.${i18nKey}`) },
      content: `<p>${game.i18n.localize(`NIMBLE_DM_HELPER.${i18nKey}Confirm`)}</p>`
    });
    if (!confirmed) return;

    const resourceTracker = this.resourceTracker;
    if (!resourceTracker) return;

    const actors = game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner);
    for (const actor of actors) {
      // Safe Rest : restaurer HP, mana, temp HP et guerir 1 wound
      if (restType === 'safeRest') {
        const system = actor.system;
        const hp = system.attributes?.hp || system.hp || { value: 0, max: 0 };
        const basePath = system.attributes?.hp ? 'system.attributes.hp' : 'system.hp';

        await actor.update({
          [`${basePath}.value`]: hp.max || 0,
          [`${basePath}.temp`]: 0
        });

        const mana = system.resources?.mana;
        if (mana && mana.max > 0) {
          // Mana geree par le systeme Nimble
          await actor.update({
            'system.resources.mana.value': mana.max,
            'system.resources.mana.current': mana.max
          });
        } else {
          // Mana geree par le module (fallback) : remettre au max
          const classId = getActorClass(actor);
          const config = CLASS_CONFIGS[classId];
          const manaCondition = config?.resourceConditions?.mana;
          if (manaCondition?.type === 'mana' && manaCondition.maxStat) {
            await actor.unsetFlag(MODULE_ID, 'manaValue');
          }
        }

        const wounds = system.attributes?.wounds || system.wounds || { value: 0 };
        const woundPath = system.attributes?.wounds ? 'system.attributes.wounds.value' : 'system.wounds.value';
        if (wounds.value > 0) {
          await actor.update({ [woundPath]: wounds.value - 1 });
        }

        // Reset hit dice to max
        if (actor.HitDiceManager) {
          const { updates } = actor.HitDiceManager.getUpdateData({
            upperLimit: actor.HitDiceManager.max,
            restoreLargest: true
          });
          if (Object.keys(updates).length > 0) {
            await actor.update(updates);
          }
        }
      }

      await resourceTracker.resetRestResources(actor, restType);
    }

    ui.notifications.info(game.i18n.localize(`NIMBLE_DM_HELPER.notifications.${i18nKey}Reset`));
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
  }

  /**
   * Lance un de et stocke la valeur (action pour canStoreValue)
   */
  static async _onRollSingleValue(event, target) {
    event.preventDefault();
    const card = target.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const valueResource = target.closest('.value-resource');
    const resource = valueResource?.dataset?.resource;
    const dieSize = valueResource?.dataset?.dieSize;
    const diceCount = parseInt(valueResource?.dataset?.max) || 1;

    if (!actorId || !resource || !dieSize) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    await this.resourceTracker.rollAndSetSingleValue(actor, resource, dieSize, diceCount);
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
    const dieSize = valueResource?.dataset?.dieSize || 'd6';
    const maxDice = parseInt(valueResource?.dataset?.max) || 1;
    const maxDieValue = parseInt(dieSize.replace('d', '')) || 6;
    const maxValue = maxDice * maxDieValue;

    const newValue = await this._promptForSingleValue(resource, currentValue, maxValue);

    if (newValue !== null && newValue !== currentValue) {
      await this.resourceTracker.setSingleValue(actor, resource, newValue);
    }
  }

  /**
   * Prompt pour nouvelle valeur unique
   */
  async _promptForSingleValue(resource, currentValue, maxValue = null) {
    const title = game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resource}`) || resource;
    const maxHint = maxValue
      ? `<div style="font-size: 0.85em; color: #888; margin-top: 4px;">0-${maxValue} (calcul: +/-)</div>`
      : `<div style="font-size: 0.85em; color: #888; margin-top: 4px;">Calcul: +/-</div>`;
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title },
      content: `<input type="text" name="value" value="${currentValue}" style="width: 100%">${maxHint}`,
      ok: {
        label: 'OK',
        callback: (event, button) => {
          const form = button.form ?? event.target.closest('form');
          const input = form?.querySelector('input[name="value"]');
          return input?.value;
        }
      }
    });
    if (result === null) return null;
    const evaluated = this._evaluateExpression(result, currentValue);
    if (evaluated === null) return null;
    const clamped = maxValue ? Math.clamp(evaluated, 0, maxValue) : Math.max(0, evaluated);
    return clamped;
  }

  /**
   * Permet l'edition directe d'une valeur
   */
  async _onEditValue(event) {
    if (this._dialogOpen) return;
    const el = event.currentTarget;
    const card = el.closest('.character-card');
    const actorId = card?.dataset?.actorId;
    const resource = el.dataset.resource;

    if (!actorId || !resource) return;

    const actor = game.actors.get(actorId);
    if (!actor) return;

    const currentValue = parseInt(el.textContent) || 0;
    this._dialogOpen = true;
    try {
      const newValue = await this._promptForValue(resource, currentValue);
      if (newValue !== null && newValue !== currentValue) {
        const delta = newValue - currentValue;
        await this.resourceTracker.adjustResource(actor, resource, delta);
      }
    } finally {
      this._dialogOpen = false;
    }
  }

  /**
   * Prompt pour nouvelle valeur
   */
  async _promptForValue(resource, currentValue) {
    const title = game.i18n.localize(`NIMBLE_DM_HELPER.resources.${resource}`) || resource;
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title },
      content: `<input type="text" name="value" value="${currentValue}" style="width: 100%">
        <div style="font-size: 0.85em; color: #888; margin-top: 4px;">Calcul: +/-</div>`,
      ok: {
        label: 'OK',
        callback: (event, button) => {
          const form = button.form ?? event.target.closest('form');
          const input = form?.querySelector('input[name="value"]');
          return input?.value;
        }
      }
    });
    if (result === null) return null;
    return this._evaluateExpression(result, currentValue);
  }

  /**
   * Nettoie le tooltip global a la fermeture de l'app
   */
  async close(options = {}) {
    const tooltip = document.getElementById('ndh-ability-tooltip');
    if (tooltip) tooltip.remove();
    return super.close(options);
  }
}
