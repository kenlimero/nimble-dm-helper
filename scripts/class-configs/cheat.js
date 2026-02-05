export const cheatConfig = {
  name: 'The Cheat',
  icon: 'icons/skills/melee/strike-dagger-skull-red.webp',
  resourceConditions: {
    cheat: {
      requiresFeature: 'Cheat!',
      displayType: 'inline',
      resetOn: 'newDay',
      defaultToMax: true,
      maxProgression: [{ level: 2, max: 1 }]
    },
    quickReadEnc: {
      requiresFeature: 'Quick Read',
      resetOn: 'combatEnd',
      displayType: 'inline',
      defaultToMax: true,
      maxProgression: [{ level: 5, max: 1 }]
    },
    quickReadDay: {
      requiresFeature: 'Quick Read',
      displayType: 'inline',
      resetOn: 'newDay',
      defaultToMax: true,
      maxProgression: [{ level: 5, max: 1 }]
    },
    thatNotWhatHappened: {
      requiresFeature: "THAT'S Not What Happened!",
      resetOn: 'safeRest',
      displayType: 'inline',
      defaultToMax: true,
      maxProgression: [{ level: 6, max: 1 }]
    }
  }
};
