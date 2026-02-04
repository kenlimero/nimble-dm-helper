export const hunterConfig = {
  name: 'Hunter',
  icon: 'icons/weapons/bows/bow-recurve-yellow.webp',
  resourceConditions: {
    thrillOfHunt: {
      requiresFeature: 'Thrill of the Hunt',
      displayType: 'inline',
      color: '#4CAF50',
      noMax: true,
      defaultValue: 0
    },
    huntersMark: {
      requiresFeature: "Hunter's Mark",
      type: 'special',
      getter: '_getHuntersMark'
    }
  }
};
