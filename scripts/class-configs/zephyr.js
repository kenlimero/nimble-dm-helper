export const zephyrConfig = {
  name: 'Zephyr',
  icon: 'icons/magic/air/wind-tornado-blue-white.webp',
  resourceConditions: {
    burstOfSpeed: {
      requiresFeature: 'Burst of Speed',
      displayType: 'inline',
      maxStat: 'dex',
      resetOn: 'combatEnd',
      defaultToMax: true
    },
    etherealProjection: {
      requiresFeature: 'Ethereal Projection',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    },
    blur: {
      requiresFeature: 'Blur',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    }
  }
};
