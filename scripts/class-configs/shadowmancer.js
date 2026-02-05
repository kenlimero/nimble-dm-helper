export const shadowmancerConfig = {
  name: 'Shadowmancer',
  icon: 'icons/magic/unholy/hand-claw-purple.webp',
  resourceConditions: {
    pilferedPower: {
      requiresFeature: 'Pilfered Power',
      displayType: 'inline',
      maxStat: 'dex',
      resetOn: 'safeRest',
      defaultToMax: true
    },
    shadowMinions: {
      displayType: 'inline',
      defaultValue: 0
    },
    beguilingInfluence: {
      requiresFeature: 'Beguiling Influence',
      displayType: 'inline',
      resetOn: 'newDay',
      defaultToMax: true,
      maxProgression: [{ level: 4, max: 1 }]
    },  
    bloodSight: {
      requiresFeature: 'Blood Sight',
      displayType: 'inline',
      resetOn: 'newDay',
      defaultToMax: true,
      maxProgression: [{ level: 4, max: 1 }]
    },  
    whispersOfTheGrave: {
      requiresFeature: 'Whispers of the Grave',
      displayType: 'inline',
      resetOn: 'newDay',
      defaultToMax: true,
      maxProgression: [{ level: 4, max: 1 }]
    },  
    glacialResilience: {
      requiresFeature: 'Glacial Resilience',
      displayType: 'inline',
      resetOn: 'safeRest',
      defaultToMax: true,
      maxProgression: [{ level: 11, max: 1 }]
    }
  }
};
