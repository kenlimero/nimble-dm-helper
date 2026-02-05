export const songweaverConfig = {
  name: 'Songweaver',
  icon: 'icons/tools/instruments/lute-gold-brown.webp',
  resourceConditions: {
    mana: {
      requiresFeature: 'Mana and Unlock Tier 1 Spells',
      type: 'mana',
      formula: 'INT × 3 + LVL'
    },
    inspiration: {
      requiresFeature: "Songweaver's Inspiration",
      displayType: 'inline',
      maxStat: 'wil',
      maxMultiplier: 2,
      resetOn: 'safeRest',
      defaultToMax: true
    },
    songOfRest: {
      requiresFeature: "Song of Rest",
      displayType: 'inline',
      resetOn: 'newDay',
      maxProgression: [{ level: 2, max: 1 }],
      defaultToMax: true
    },
    inspiringAnthem: {
      requiresFeature: "Inspiring Anthem",
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 4, max: 1 }],
      defaultToMax: true
    },
    notMyFaaace: {
      requiresFeature: "Not My Beautiful Faaace!",
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 4, max: 1 }],
      defaultToMax: true
    },
    chordOfChaos: {
      requiresFeature: "Chord of Chaos",
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 11, max: 1 }],
      defaultToMax: true
    },
    chorusOfChampions: {
      requiresFeature: "Chorus of Champions",
      displayType: 'inline',
      resetOn: 'combatEnd',
      maxProgression: [{ level: 15, max: 1 }],
      defaultToMax: true
    }
  }
};
