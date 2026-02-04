export const mageConfig = {
  name: 'Mage',
  icon: 'icons/magic/fire/flame-burning-hand-orange.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      color: '#2196F3',
      formula: 'INT × 3 + LVL'
    }
  }
};
