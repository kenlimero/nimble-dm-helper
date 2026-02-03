export const oathswornConfig = {
  name: 'Oathsworn',
  icon: 'icons/magic/holy/chalice-glowing-gold.webp',
  resourceConditions: {
    mana: { requiresFeature: 'Mana and Radiant Spellcasting' },
    judgmentDice: {
      requiresFeature: 'Radiant Judgement',
      canStoreValue: true,
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
    layOnHands: { requiresFeature: 'Lay on Hands' }
  }
};
