export const commanderConfig = {
  name: 'Commander',
  icon: 'icons/skills/social/intimidation-impressing.webp',
  resourceConditions: {
    combatDice: {
      requiresFeature: 'Fit for Any Battlefield',
      canStoreDice: true,
      color: '#795548',
      maxStat: 'str',
      maxLevelBonus: [
        { level: 6, bonus: 1 },
        { level: 8, bonus: 1 },
        { level: 10, bonus: 1 },
        { level: 12, bonus: 1 },
        { level: 16, bonus: 1 }
      ],
      resetOn: 'combatEnd',
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
      resetOn: 'safeRest',
      maxStat: 'int',
      maxLevelBonus: [
        { level: 9, bonus: 1 },
        { level: 13, bonus: 1 },
        { level: 17, bonus: 1 }
      ],
      defaultToMax: true
    },
    holdTheLine: {
      requiresFeature: 'Hold the Line!',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    },
    iCanDoThisAllDay: {
      requiresFeature: 'I Can Do This ALL DAY!',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    }
  }
};
