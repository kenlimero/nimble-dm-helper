export const commanderConfig = {
  name: 'Commander',
  icon: 'icons/skills/social/intimidation-impressing.webp',
  resourceConditions: {
    combatDice: {
      requiresFeature: 'Fit for Any Battlefield',
      canStoreDice: true,
      color: '#795548',
      maxStat: 'str',
      storageModule: 'system',
      storageKey: 'combatDice',
      dieProgression: [
        { level: 1, dieSize: 'd6' },
        { level: 5, dieSize: 'd8' },
        { level: 9, dieSize: 'd10' },
        { level: 13, dieSize: 'd12' },
        { level: 17, dieSize: 'd20' }
      ]
    },
    coordinatedStrike: {
      requiresFeature: 'Coordinated Strike!',
      displayType: 'inline',
      color: '#607D8B',
      maxProgression: [
        { level: 1, max: 1 },
        { level: 9, max: 2 },
        { level: 13, max: 3 },
        { level: 17, max: 4 }
      ],
      defaultToMax: true
    }
  }
};
