export const stormshifterConfig = {
  name: 'Stormshifter',
  icon: 'icons/creatures/mammals/wolf-howl-moon-purple.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      formula: 'WIL × 3 + LVL'
    },
    beastshift: {
      requiresFeature: 'Beastshift',
      displayType: 'inline',
      maxStat: 'dex',
      maxLevelBonus: [
        { level: 6, bonus: 1 },
        { level: 12, bonus: 1 }
      ],
      defaultToMax: true
    },
    stormborn: {
      requiresFeature: 'Stormborn (1)',
      displayType: 'inline',
      resetOn: 'newDay',
      maxProgression: [{ level: 8, max: 1 }],
      defaultToMax: true
    },
    attunedToNature: {
      requiresFeature: 'Attuned to Nature',
      displayType: 'inline',
      resetOn: 'newDay',
      maxProgression: [{ level: 3, max: 1 }],
      defaultToMax: true
    },
    masterOfStorm: {
      requiresFeature: 'Master of Storm',
      displayType: 'inline',
      resetOn: 'safeRest',
      maxProgression: [{ level: 15, max: 1 }],
      defaultToMax: true
    },
    unleashTheBeast: {
      requiresFeature: 'Unleash the Beast',
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 7, max: 1 }],
      defaultToMax: true
    },
    stormWake: {
      requiresFeature: 'Storm Wake',
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 7, max: 1 }],
      defaultToMax: true
    },
    venomousGaze: {
      requiresFeature: 'Venomous Gaze',
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 12, max: 1 }],
      defaultToMax: true
    }
   }
};
