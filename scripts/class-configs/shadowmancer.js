export const shadowmancerConfig = {
  name: 'Shadowmancer',
  icon: 'icons/magic/unholy/hand-claw-purple.webp',
  resourceConditions: {
    pilferedPower: {
      requiresFeature: 'Pilfered Power',
      displayType: 'inline',
      color: '#673AB7',
      maxStat: 'dex',
      defaultToMax: true
    },
    shadowMinions: {
      requiresFeature: 'Summon Shadows',
      displayType: 'inline',
      color: '#424242',
      maxStat: 'int',
      maxMinLevel: true,
      defaultValue: 0
    }
  }
};
