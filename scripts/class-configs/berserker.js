export const berserkerConfig = {
  name: 'Berserker',
  icon: 'icons/skills/melee/strike-axe-blood-red.webp',
  resourceConditions: {
    fury: {
      requiresFeature: 'Rage',
      canStoreDice: true,
      maxStat: 'str',
      resetOn: 'combatEnd',
      dieProgression: [
        { level: 1, dieSize: 'd4' },
        { level: 6, dieSize: 'd6' },
        { level: 9, dieSize: 'd8' },
        { level: 13, dieSize: 'd10' },
        { level: 17, dieSize: 'd12' }
      ]
    }
  }
};
