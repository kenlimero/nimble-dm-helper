import { NimbleDMHelperApp } from './dm-helper-app.js';
import { registerSettings } from './settings.js';
import { registerHooks } from './hooks.js';
import { MODULE_ID, MODULE_PATH } from './constants.js';

Hooks.once('init', async () => {
  console.log(`${MODULE_ID} | Initializing Nimble DM Helper`);
  registerSettings();
  registerHandlebarsHelpers();

  // Precharger les templates partials
  const partials = [
    `${MODULE_PATH}/templates/partials/character-card.hbs`,
    `${MODULE_PATH}/templates/partials/resource-bar.hbs`
  ];
  await foundry.applications.handlebars.loadTemplates(partials);

  // Enregistrer les partials avec des alias courts pour éviter les chemins hardcodés
  const aliases = {
    'nimble-character-card': `${MODULE_PATH}/templates/partials/character-card.hbs`,
    'nimble-dm-helper.resource-bar': `${MODULE_PATH}/templates/partials/resource-bar.hbs`
  };
  for (const [alias, path] of Object.entries(aliases)) {
    const content = Handlebars.partials[path];
    if (content) {
      Handlebars.registerPartial(alias, content);
    }
  }
});

// Bouton dans les scene controls - doit etre enregistre avant 'ready'
Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user?.isGM && !game.settings.get(MODULE_ID, 'playerAccess')) return;

  // Verifier si le setting existe et est active (force pour les joueurs)
  try {
    if (game.user?.isGM && !game.settings.get(MODULE_ID, 'showToolbarButton')) return;
  } catch (e) {
    // Settings pas encore enregistres, afficher par defaut
  }

  // Foundry v13+ : controls.tokens.tools est un objet, pas un array
  const tokenControls = controls.tokens;
  if (tokenControls?.tools) {
    tokenControls.tools[MODULE_ID] = {
      name: MODULE_ID,
      title: 'NIMBLE_DM_HELPER.title',
      icon: 'fas fa-users-cog',
      button: true,
      onChange: () => game.nimbleDMHelper?.toggle()
    };
  }
});

/**
 * Enregistre les helpers Handlebars personnalises
 */
function registerHandlebarsHelpers() {
  // Helper pour les calculs mathematiques
  Handlebars.registerHelper('math', function(...args) {
    const ops = args.slice(0, -1); // Enlever le dernier argument (options)
    if (ops.length < 3) return 0;

    let result = parseFloat(ops[0]) || 0;
    for (let i = 1; i < ops.length; i += 2) {
      const operator = ops[i];
      const operand = parseFloat(ops[i + 1]) || 0;
      switch (operator) {
        case '+': result += operand; break;
        case '-': result -= operand; break;
        case '*': result *= operand; break;
        case '/': result = operand !== 0 ? result / operand : 0; break;
      }
    }
    return Math.round(result * 100) / 100;
  });

  // Helper pour repeter N fois
  Handlebars.registerHelper('times', function(n, block) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += block.fn({ index: i, first: i === 0, last: i === n - 1 });
    }
    return result;
  });

  // Helper less than or equal
  Handlebars.registerHelper('lte', function(a, b) {
    return a <= b;
  });

  // Helper less than
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  // Helper equal
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Helper greater than
  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper('or', function(...args) {
    args.pop(); // remove Handlebars options object
    return args.some(Boolean);
  });

  Handlebars.registerHelper('and', function(...args) {
    args.pop(); // remove Handlebars options object
    return args.every(Boolean);
  });

  // Helper pour calculer le pourcentage
  Handlebars.registerHelper('percent', function(value, max) {
    if (!max || max === 0) return 0;
    return Math.round((value / max) * 100);
  });

  console.log(`${MODULE_ID} | Handlebars helpers registered`);
}

Hooks.once('ready', () => {
  const playerAccess = game.settings.get(MODULE_ID, 'playerAccess');
  if (!game.user.isGM && !playerAccess) {
    console.log(`${MODULE_ID} | Not a GM and player access disabled, module disabled`);
    return;
  }

  console.log(`${MODULE_ID} | Ready (${game.user.isGM ? 'GM' : 'Player'})`);
  registerHooks();

  // Creer instance globale
  game.nimbleDMHelper = {
    app: null,
    toggle: () => {
      if (!game.nimbleDMHelper.app) {
        game.nimbleDMHelper.app = new NimbleDMHelperApp();
      }
      if (game.nimbleDMHelper.app.rendered) {
        game.nimbleDMHelper.app.close();
      } else {
        game.nimbleDMHelper.app.render({ force: true });
      }
    }
  };
});
