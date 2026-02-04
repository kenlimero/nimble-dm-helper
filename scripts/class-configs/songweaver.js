export const songweaverConfig = {
  name: 'Songweaver',
  icon: 'icons/tools/instruments/lute-gold-brown.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      color: '#E91E63',
      formula: 'INT × 3 + LVL'
    },
    inspiration: {
      requiresFeature: "Songweaver's Inspiration",
      displayType: 'inline',
      color: '#FF9800',
      maxStat: 'wil',
      maxMultiplier: 2,
      defaultToMax: true
    }
  }
};
