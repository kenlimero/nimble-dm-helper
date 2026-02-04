export const mageConfig = {
  name: 'Mage',
  icon: 'icons/magic/fire/flame-burning-hand-orange.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      formula: 'INT × 3 + LVL'
    },
    nullify: {
      requiresFeature: 'Nullify',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 7, max: 1 }]
    },
    steelWill: {
      requiresFeature: 'Steel Will',
      displayType: 'inline',
      resetOn: 'safeRest',
      defaultToMax: true,
      maxProgression: [{ level: 11, max: 1 }]
    },  
    chaosLash: {
      requiresFeature: 'Chaos Lash',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 7, max: 1 }]
    }
  }
};
