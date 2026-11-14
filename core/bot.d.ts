/**
 * Типы для `bot.js` (BotSchemer / Bot).
 *
 * Модуль отдаёт два именованных экспорта:
 * `Bot` — фабрика вызываемых схем, `BotSchemer` — сам движок валидации.
 */

/** Опции границ длины / количества цифр для `string` и `number`. */
export interface BoundsOpts {
  /** Точная длина (несовместим с `min`/`max`). */
  length?: number;
  /** Алиас `length`. */
  len?: number;
  /** Минимум символов / цифр. */
  min?: number;
  /** Максимум символов / цифр. */
  max?: number;
  /** Алиас `min`. */
  minLength?: number;
  /** Алиас `max`. */
  maxLength?: number;
  /** Кастомный текст ошибки длины. */
  message?: string;
  /** Алиас `message`. */
  msg?: string;
}

/** Опции точности для `float`. */
export interface PrecisionOpts {
  /** Точное число знаков после точки. */
  precision?: number;
  /** Кастомный текст ошибки. */
  message?: string;
  /** Алиас `message`. */
  msg?: string;
}

/** Аргументы `string` / `number`: границы и/или текст ошибки. */
export type BoundsArgs = Array<number | BoundsOpts | string>;

/** Аргументы `float`: точность и/или текст ошибки. */
export type PrecisionArgs = Array<number | PrecisionOpts | string>;

/** Чейн валидации одного поля. Каждый метод возвращает тот же чейн. */
export interface BotChain {
  /** Строка; длина: `(5)`, `(2, 10)`, `({ min, max })`, trailing-строка = сообщение. */
  string(...args: BoundsArgs): BotChain;
  /** Целое число; границы — количество цифр. */
  number(...args: BoundsArgs): BotChain;
  /** Дробное число; `(2)` — точность, `({ precision: 2 })`. */
  float(...args: PrecisionArgs): BotChain;
  /** Строгий email; аргумент — свой текст ошибки. */
  email(message?: string): BotChain;
  /** Булево; аргумент — свой текст ошибки. */
  boolean(message?: string): BotChain;
  /** Объект; `shape` — билдер вложенных правил и/или свой текст ошибки. */
  object(shape?: ShapeBuilder | string, message?: string): BotChain;
  /** Разрешить `null`. */
  nullable(): BotChain;
  /** Значение обязано присутствовать. */
  required(message?: string): BotChain;
}

/** Билдер вложенной формы для `object(shape)`. */
export type ShapeBuilder = (scope: BotScope) => void;

/** Scope для `shape`: те же методы, но ключи относительные. */
export interface BotScope {
  string(key: string, ...args: BoundsArgs): BotChain;
  number(key: string, ...args: BoundsArgs): BotChain;
  float(key: string, ...args: PrecisionArgs): BotChain;
  email(key: string, message?: string): BotChain;
  boolean(key: string, message?: string): BotChain;
  object(key: string, shape?: ShapeBuilder | string, message?: string): BotChain;
  nullable(key: string): BotChain;
  required(key: string, message?: string): BotChain;
}

/** Билдер правил одного поля для `rules({...})`. */
export type RuleBuilder = (f: BotChain) => void;

/** Входной объект схемы: данные полей + зарезервированный ключ `rules`. */
export interface BotSchemaInput {
  [key: string]: any;
  rules?: Record<string, RuleBuilder>;
}

/** Опции схемы. */
export interface SchemaOptions {
  /** Проверять текущие значения сразу при объявлении правил. */
  validateInitial?: boolean;
}

/** Опции батч-объявления правил. */
export interface RulesOptions {
  /** Проверять текущие значения сразу во время записи правил. */
  validateInitial?: boolean;
}

/** Словарь «имя поля → нормализатор сырого `input.value`. */
export type Normalizers = Record<string, (value: string) => any>;

/** Опции привязки формы к схеме. */
export interface BindFormOptions {
  /** Нормализаторы значений инпутов. */
  normalizers?: Normalizers;
  /** Событие(я) живой валидации (по умолчанию `"input"`). */
  event?: string | string[];
  /** Алиас `event`. */
  events?: string | string[];
  /** Колбэк успешного `submit`. */
  onValid?: (data: Record<string, any>) => void;
  /** Колбэк неудачного `submit`: имя поля → текст ошибки. */
  onInvalid?: (errors: Record<string, string>) => void;
  /** Ставить фокус на первое невалидное поле (по умолчанию `true`). */
  focusFirst?: boolean;
}

/** Вызываемая схема, которую возвращает `Bot.schema()`. */
export interface BotSchema {
  /** Чейн поля по ключу или dotted-пути (`"address.street"`). */
  (key: string): BotChain;
  /** Массовое объявление правил. */
  rules(defs?: Record<string, RuleBuilder>, opts?: RulesOptions): BotSchema;
  /** Данные под глубоким Proxy. */
  fields: Record<string, any>;
  /** То же, что вызов схемы: чейн поля по ключу. */
  field(key: string): BotChain;
  string(key: string, ...args: BoundsArgs): BotChain;
  number(key: string, ...args: BoundsArgs): BotChain;
  float(key: string, ...args: PrecisionArgs): BotChain;
  email(key: string, message?: string): BotChain;
  boolean(key: string, message?: string): BotChain;
  object(key: string, shape?: ShapeBuilder | string, message?: string): BotChain;
  nullable(key: string): BotChain;
  required(key: string, message?: string): BotChain;
  /** Показать / очистить ошибку под полем. */
  setError(input: Element, message?: string): void;
  /** Проверить одно поле из `input.value` и записать значение в `fields`. */
  validateField(
    key: string,
    input: Element,
    normalize?: (value: string) => any,
  ): boolean;
  /** Привязать форму: живая валидация + проверка на `submit`. */
  bindForm(form: HTMLFormElement, opts?: BindFormOptions): () => void;
}

/** Строгий валидатор объекта полей (движок). */
export class BotSchemer {
  constructor(fields?: BotSchemaInput, opts?: SchemaOptions);

  /** Данные под глубоким Proxy. Запись проверяется по объявленным правилам. */
  get fields(): Record<string, any>;
  set fields(obj: Record<string, any>);

  /** Чейн поля по ключу или dotted-пути. */
  field(key: string): BotChain;

  string(key: string, ...args: BoundsArgs): BotChain;
  number(key: string, ...args: BoundsArgs): BotChain;
  float(key: string, ...args: PrecisionArgs): BotChain;
  boolean(key: string, message?: string): BotChain;
  email(key: string, message?: string): BotChain;
  object(key: string, shape?: ShapeBuilder | string, message?: string): BotChain;
  nullable(key: string): BotChain;
  required(key: string, message?: string): BotChain;

  /** Массовое объявление правил; возвращает `this`. */
  rules(defs?: Record<string, RuleBuilder>, opts?: RulesOptions): this;
}

/** Точка входа: фабрика вызываемых схем + UI-утилиты. */
export class Bot {
  /** Показать / очистить ошибку под полем. */
  static setError(input: Element, message?: string): void;

  /** Создать вызываемую схему для объекта полей. */
  static schema(fields?: BotSchemaInput, opts?: SchemaOptions): BotSchema;
}
