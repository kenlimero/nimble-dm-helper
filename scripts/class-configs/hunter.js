export const hunterConfig = {
  name: 'Hunter',
  icon: 'icons/weapons/bows/bow-recurve-yellow.webp',
  resourceConditions: {
    greaseTrap: {
      requiresFeature: 'Grease Trap',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    },
    snareTrap: {
      requiresFeature: 'Snare Trap',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    },
    primalPredator: {
      requiresFeature: 'Primal Predator',
      displayType: 'inline',
      resetOn: 'combatEnd',
      defaultToMax: true,
      maxProgression: [{ level: 3, max: 1 }]
  },
    haIAmOverThere: {
      requiresFeature: "Ha! I'm Over Here!",
      displayType: 'inline',
      resetOn: 'safeRest',
      defaultToMax: true,
      maxProgression: [{ level: 3, max: 1 }]
    }
  }
};
