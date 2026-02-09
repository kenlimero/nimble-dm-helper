import { SimpleValueResource } from './simple-value-resource.js';
import { DicePoolResource } from './dice-pool-resource.js';
import { SingleValueResource } from './single-value-resource.js';
import { ManaResource } from './mana-resource.js';
import { StatusEffectResource } from './status-effect-resource.js';
import { SpecialResource } from './special-resource.js';
import { HpResource } from './hp-resource.js';
import { TempHpResource } from './temp-hp-resource.js';
import { WoundsResource } from './wounds-resource.js';

/**
 * Registry qui mappe les cles de ressources et les configs de condition
 * vers les instances de handlers.
 *
 * Resolution :
 *   1. Ressources systeme par nom de cle (hp, tempHp, wounds)
 *   2. Ressources config-driven par type/proprietes :
 *      a. condition.type === 'statusEffect' -> StatusEffectResource
 *      b. condition.type === 'special' -> SpecialResource
 *      c. condition.type === 'mana' -> ManaResource
 *      d. condition.canStoreDice -> DicePoolResource
 *      e. condition.canStoreValue -> SingleValueResource
 *      f. fallback -> SimpleValueResource
 *
 * Tous les handlers sont des singletons stateless.
 */
export class ResourceRegistry {

  constructor() {
    this._simpleValue = new SimpleValueResource();
    this._dicePool = new DicePoolResource();
    this._singleValue = new SingleValueResource();
    this._mana = new ManaResource();
    this._statusEffect = new StatusEffectResource();
    this._special = new SpecialResource();
    this._hp = new HpResource();
    this._tempHp = new TempHpResource();
    this._wounds = new WoundsResource();

    this._systemHandlers = new Map([
      ['hp', this._hp],
      ['tempHp', this._tempHp],
      ['wounds', this._wounds]
    ]);
  }

  /**
   * Resout le handler pour une cle et une condition donnees.
   */
  getHandler(key, condition = null) {
    // 1. Ressources systeme par cle
    const systemHandler = this._systemHandlers.get(key);
    if (systemHandler) return systemHandler;

    // 2. Resolution par proprietes de la condition
    if (!condition) return this._simpleValue;

    if (condition.type === 'statusEffect') return this._statusEffect;
    if (condition.type === 'special') return this._special;
    if (condition.type === 'mana') return this._mana;
    if (condition.canStoreDice) return this._dicePool;
    if (condition.canStoreValue) return this._singleValue;

    return this._simpleValue;
  }

  get hp() { return this._hp; }
  get tempHp() { return this._tempHp; }
  get wounds() { return this._wounds; }
  get mana() { return this._mana; }
  get dicePool() { return this._dicePool; }
  get singleValue() { return this._singleValue; }
  get special() { return this._special; }
}
