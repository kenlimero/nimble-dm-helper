export const commanderConfig = {
  name: 'Commander',
  icon: 'icons/skills/social/intimidation-impressing.webp',
  resourceConditions: {
    combatDice: {
      requiresFeature: 'Fit for Any Battlefield',
      canStoreDice: true,
      maxStat: 'str',
      dieProgression: [
        { level: 1, dieSize: 'd6' },
        { level: 5, dieSize: 'd8' },
        { level: 9, dieSize: 'd10' },
        { level: 13, dieSize: 'd12' },
        { level: 17, dieSize: 'd20' }
      ]
    },
    coordinatedStrike: { requiresFeature: 'Coordinated Strike!' }
  }
};
