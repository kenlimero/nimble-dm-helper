export const shepherdConfig = {
  name: 'Shepherd',
  icon: 'icons/magic/holy/prayer-hands-glowing-yellow.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      color: '#8BC34A',
      formula: 'WIL × 3 + LVL'
    },
    searingLight: {
      requiresFeature: 'Searing Light',
      displayType: 'inline',
      color: '#FFEB3B',
      maxStat: 'wil',
      defaultToMax: true
    }
  }
};
