export const oathswornConfig = {
  name: 'Oathsworn',
  icon: 'icons/magic/holy/chalice-glowing-gold.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Radiant Spellcasting',
      type: 'mana',
      color: '#FFD700',
      formula: 'WIL + LVL'
    },
    judgmentDice: {
      requiresFeature: 'Radiant Judgement',
      canStoreValue: true,
      color: '#FFD700',
      storageModule: 'system',
      storageKey: 'judgmentDice',
      singleValueKey: 'judgmentValue',
      resetOn: 'combatEnd',
      maxProgression: [
        { level: 1, max: 2 },
        { level: 14, max: 3 }
      ],
      dieProgression: [
        { level: 1, dieSize: 'd6' },
        { level: 3, dieSize: 'd8' },
        { level: 5, dieSize: 'd10' },
        { level: 8, dieSize: 'd12' },
        { level: 10, dieSize: 'd20' }
      ]
    },
    layOnHands: {
      requiresFeature: 'Lay on Hands',
      displayType: 'bar',
      color: '#FFD700',
      maxLevelMultiplier: 5,
      defaultToMax: true,
      resetOn: 'safeRest'
    },
    blindingAura: {
      requiresFeature: 'Blinding Aura',
      displayType: 'inline',
      resetOn: 'safeRest',
      maxProgression: [{ level: 3, max: 1 }],
      defaultToMax: true
    },
    courage: {
      requiresFeature: 'Courage!',
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 3, max: 1 }],
      defaultToMax: true
    },
    explosiveJudgment: {
      requiresFeature: 'Explosive Judgment',
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 3, max: 1 }],
      defaultToMax: true
    }
  }
};
