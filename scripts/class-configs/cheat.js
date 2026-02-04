export const cheatConfig = {
  name: 'The Cheat',
  icon: 'icons/skills/melee/strike-dagger-skull-red.webp',
  resourceConditions: {
    sneakAttack: {
      requiresFeature: 'Sneak Attack',
      type: 'special',
      getter: '_getSneakAttack'
    },
    cheatUses: {
      requiresFeature: 'Cheat',
      type: 'special',
      getter: '_getCheatUses'
    }
  }
};
