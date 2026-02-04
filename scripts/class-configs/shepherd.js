export const shepherdConfig = {
  name: 'Shepherd',
  icon: 'icons/magic/holy/prayer-hands-glowing-yellow.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      formula: 'WIL × 3 + LVL'
    },
    searingLight: {
      requiresFeature: 'Searing Light',
      resetOn: 'safeRest',
      displayType: 'inline',
      maxStat: 'wil',
      defaultToMax: true
    },
    veilwalkersBlessing: {
      requiresFeature: "Veilwalker's Blessing",
      resetOn: 'safeRest',
      displayType: 'inline',
      maxProgression: [{ level: 7, max: 1 }],
      defaultToMax: true
    }
  }
};
