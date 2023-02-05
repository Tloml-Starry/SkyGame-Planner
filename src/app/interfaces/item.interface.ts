import { IConfig, IGuid } from "./base.interface";
import { INode } from "./node.interface";

export interface IItemConfig extends IConfig<IItem> {}

export interface IItem extends IGuid {
  type: ItemType;
  name: string;
  icon?: string;

  // Emote
  level?: number;

  // Music
  sheet?: number;

  /// References ///
  nodes?: Array<INode>;

  /// Progress ///
  unlocked?: boolean;
}

export enum ItemType {
  /** All cosmetics in the hat category. */
  Hat = 'Hat',
  /** All cosmetics in the hair category. */
  Hair = 'Hair',
  /** All cosmetics in the mask category. */
  Mask = 'Mask',
  /** All cosmetics in the nacklace category.*/
  Necklace = 'Necklace',
  /** All cosmetics in the pants category. */
  Outfit = 'Outfit',
  /** All cosmetics in the cape category. */
  Cape = 'Cape',
  /** All musical instruments in the held category. */
  Instrument = 'Instrument',
  /** All non-instrument items in the held category. */
  Held = 'Held',
  /** All items in the chair category. */
  Prop = 'Prop',
  /** All emotes. */
  Emote = 'Emote',
  /** All stances. */
  Stance = 'Stance',
  /** All honks. */
  Call = 'Call',
  /** All spells in the spell tab. */
  Spell = 'Spell',
  /** All music sheets. */
  Music = 'Music',
  /** All quests. */
  Quest = 'Quest',
  /** Special (non-)items such as candle blessings. */
  Special = 'Special'
}
