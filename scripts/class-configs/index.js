import { berserkerConfig } from './berserker.js';
import { mageConfig } from './mage.js';
import { oathswornConfig } from './oathsworn.js';
import { commanderConfig } from './commander.js';
import { hunterConfig } from './hunter.js';
import { zephyrConfig } from './zephyr.js';
import { stormshifterConfig } from './stormshifter.js';
import { songweaverConfig } from './songweaver.js';
import { shadowmancerConfig } from './shadowmancer.js';
import { shepherdConfig } from './shepherd.js';
import { cheatConfig } from './cheat.js';

export const CLASS_CONFIGS = {
  berserker: berserkerConfig,
  mage: mageConfig,
  oathsworn: oathswornConfig,
  commander: commanderConfig,
  hunter: hunterConfig,
  zephyr: zephyrConfig,
  stormshifter: stormshifterConfig,
  songweaver: songweaverConfig,
  shadowmancer: shadowmancerConfig,
  shepherd: shepherdConfig,
  cheat: cheatConfig,
  thecheat: cheatConfig // Alias
};
