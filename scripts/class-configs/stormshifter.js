export const stormshifterConfig = {
  name: 'Stormshifter',
  icon: 'icons/creatures/mammals/wolf-howl-moon-purple.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      color: '#9C27B0',
      formula: 'WIL × 3 + LVL'
    },
    beastshift: {
      requiresFeature: 'Beastshift',
      displayType: 'inline',
      color: '#8BC34A',
      maxStat: 'dex',
      maxLevelBonus: [{ level: 6, bonus: 1 }],
      defaultToMax: true
    }
  }
};
