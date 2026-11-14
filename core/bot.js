/**
 * @fileoverview BotSchemer — строгий валидатор данных формы.
 *
 *
 * 1. **Один источник правды о типе** — приватный `#getType` через
 *    `Object.prototype.toString.call(val).slice(8, -1)`.
 *    Все методы сверяются только с ним: `"String"`, `"Number"`,
 *    `"Boolean"`, `"Object"`, `"Array"`, `"Null"`, `"Undefined"`.
 * 2. **Чейн помнит поле** — первый вызов принимает ключ (`"name"`) или
 *    dotted-путь (`"address.street"`), дальше методы идут без значения:
 *    `schema.string("name", 5).required()`.
 * 3. **Глубокий Proxy** — следит за любым уровнем вложенности, а не только
 *    за верхним. Прямая запись мимо методов блокируется:
 *    `schema.fields.name = 2` → `Error: "name": need String, got Number`.
 *
 * Три способа объявить правила:
 * 0) в объекте — `Bot.schema({ name: "", rules: { name: (f) => f.string(5).required() } })`
 *    (ключ `rules` зарезервирован, в `fields` не попадает);
 * 1) массово — `schema.rules({ name: (f) => f.string(5).required(), ... })`;
 * 2) точечно — `schema("name").string(5).required()` (схема вызываемая:
 *    вызов с ключом возвращает чейн поля, цепочка не рвётся никогда).
 *
 * Быстрый старт:
 * @example
 * const schema = Bot.schema({ name: "Farid", age: 25 });
 * schema.rules({
 *   name: (f) => f.string(5).required(), // ok
 *   age: (f) => f.number().required(),    // ok
 * });
 * schema("name").string(5).required(); // то же самое, точечно
 * schema.fields.name = 2;             // Error — прямая запись заблокирована
 *
 * Правила хранятся в приватной карте `#rules` под полным путём
 * (`"address.geo.lat"`). Правило появляется только после вызова
 * метода-типа для пути. Ветка без правила не охраняется (прокси видит
 * запись, но сверять не с чем) — как поле без схемы в `yup.object()`.
 */

/**
 * Опции границ длины/кол-ва для `string`/`number` (объектная форма).
 * `length` — точная длина (несовместим с `min`/`max`);
 * `min`/`max` — диапазон (0/`undefined` = край открыт).
 * @typedef {Object} BoundsOpts
 * @property {number} [length] точная длина.
 * @property {number} [len] алиас `length`.
 * @property {number} [min] минимум символов/цифр (алиас `minLength`).
 * @property {number} [max] максимум символов/цифр (алиас `maxLength`).
 * @property {number} [minLength] алиас `min`.
 * @property {number} [maxLength] алиас `max`.
 * @property {string} [message] кастомный текст ошибки длины (алиас `msg`).
 * @property {string} [msg] алиас `message`.
 */

/**
 * Опции точности для `float` (объектная форма).
 * @typedef {Object} PrecisionOpts
 * @property {number} [precision] точное число знаков после точки.
 * @property {string} [message] кастомный текст ошибки (алиас `msg`).
 * @property {string} [msg] алиас `message`.
 */

/**
 * Чейн валидации — возвращается каждым методом после первого вызова с ключом.
 * Каждый метод сохраняет правило и возвращает тот же чейн, поэтому цепочка
 * не рвётся и автокомплит после точки всегда показывает все методы.
 * Текущее значение проверяется только в строгом режиме (`validateInitial: true`),
 * по дефолту объявление ленивое.
 * @typedef {Object} BotChain
 * @property {(...args: Array<(number|BoundsOpts|string)>) => BotChain} string строка: `(5)` — точная длина, `(2, 10)` — диапазон, `({min,max})` — объектом; trailing-строка = свой текст ошибки (тип + длина).
 * @property {(...args: Array<(number|BoundsOpts|string)>) => BotChain} number целое число: то же, но границы — кол-во цифр; trailing-строка = свой текст ошибки.
 * @property {(...args: Array<(number|PrecisionOpts|string)>) => BotChain} float дробь: `(2)` — точность, `({precision:2})` — объектом; trailing-строка = свой текст ошибки.
 * @property {(message?: string) => BotChain} email строгий email; аргумент = свой текст ошибки.
 * @property {(message?: string) => BotChain} boolean булево; аргумент = свой текст ошибки.
 * @property {(shape?: Function|string, message?: string) => BotChain} object объект: `shape` и/или свой текст ошибки.
 * @property {() => BotChain} nullable разрешить `null`.
 * @property {(message?: string) => BotChain} required значение обязано присутствовать.
 */

/**
 * Scope для `shape`: те же методы чейна, но ключи относительные.
 * @typedef {Object} BotScope
 * @property {(key: string, ...args: Array<(number|BoundsOpts|string)>) => BotChain} string
 * @property {(key: string, ...args: Array<(number|BoundsOpts|string)>) => BotChain} number
 * @property {(key: string, ...args: Array<(number|PrecisionOpts|string)>) => BotChain} float
 * @property {(key: string, message?: string) => BotChain} email
 * @property {(key: string, message?: string) => BotChain} boolean
 * @property {(key: string, shape?: Function|string, message?: string) => BotChain} object
 * @property {(key: string) => BotChain} nullable
 * @property {(key: string, message?: string) => BotChain} required
 */

/**
 * Билдер правил одного поля для `schema.rules({...})` и ключа `rules`
 * в `Bot.schema({...})`. Получает чейн поля — тот же объект, что
 * возвращает `schema("name")`.
 * @callback RuleBuilder
 * @param {BotChain} f чейн поля, дальше без значения.
 * @returns {void}
 */

/**
 * Входной объект схемы: произвольные поля данных + зарезервированный
 * ключ `rules` с правилами `{ поле: (f) => ... }` (то же, что `schema.rules()`).
 * Тип нужен редактору для подсказок при наведении: документация ключа
 * `rules`, тип параметра `f` (`BotChain`) и методы чейна
 * (`f.string`, `.required` и т.д.).
 * @typedef {{ [key: string]: any, rules?: Object<string, RuleBuilder> }} BotSchemaInput
 */

/**
 * Строгий валидатор объекта полей (обычно — данных формы).
 */
export class BotSchemer {
  /**
   * Сырые данные. Живут только внутри класса — наружу отдаётся `#proxy`.
   * Напрямую сюда никто не пишет: любая запись идёт через `#prepare`.
   * @type {Object}
   */
  #data = {};
  /**
   * Объявленные правила валидации. Ключ — полный путь:
   * `"name"`, `"address.street"`, `"address.geo.lat"`.
   * Правило появляется только после вызова метода-типа для этого пути.
   * Ветка без правила не охраняется: прокси запись видит, но сверять не с чем.
   * @type {Object<string, {type?: string, length?: number, minLength?: number, maxLength?: number, stringMessage?: string, numberMessage?: string, floatMessage?: string, emailMessage?: string, booleanMessage?: string, objectMessage?: string, precision?: number, required?: boolean, requiredMessage?: string, nullable?: boolean}>}
   */
  #rules = {};
  /** Корневой Proxy поверх `#data` — то, что пользователь видит как `fields`. */
  #proxy;
  /**
   * Кэш обёрток: raw-объект -> Map(путь -> proxy).
   * Нужен, чтобы один и тот же объект по одному пути всегда отдавал
   * один и тот же proxy (`fields.address === fields.address` → true).
   * @type {WeakMap<Object, Map<string, Object>>}
   */
  #proxyCache = new WeakMap();
  /**
   * Режим «только записать правила, значения не проверять».
   * Включается внутри `object(shape)`, когда поле сейчас `null`:
   * shape описывает будущий объект, проверять пока нечего.
   * @type {boolean}
   */
  #recordOnly = false;
  /**
   * Проверять ли текущие значения в момент объявления правил.
   * По дефолту `false` (ленивый режим для пустой формы): `rules()` и прямые
   * чейны только записывают правила, проверка включается на каждой записи
   * через `fields` (Proxy охраняет всегда, независимо от этого флага).
   * `true` — строгий режим: объявление сразу сверяется с текущими значениями.
   * @type {boolean}
   */
  #validateInitial = false;
  /**
   * Разовый пропуск проверки начальных значений — выставляет `rules()`
   * на время батча из `opts.validateInitial`, затем возвращает как было.
   * @type {boolean}
   */
  #deferCheck = false;

  /**
   * @param {BotSchemaInput} [fields={}] начальные данные (глубоко копируются —
   * внешние ссылки отрезаются, мутации снаружи внутрь не пролезут).
   * Могут быть пустыми (`""`) — по дефолту объявление правил их не проверяет.
   * Ключ `rules` зарезервирован: если он есть — это не данные, а правила
   * `{ поле: (f) => ... }` (то же, что `rules()`), в `fields` он не попадает.
   * @param {Object} [opts={}] опции схемы.
   * @param {boolean} [opts.validateInitial=false] проверять ли текущие значения
   * в момент объявления правил. `true` — строгий режим: объявление сразу
   * сверяется с текущими значениями (упадёт на пустой форме).
   * @throws {Error} если `fields.rules` — не объект.
   * @example
   * new BotSchemer({ name: "", rules: { name: (f) => f.string({ min: 2 }).required("Заполни имя") } });
   */
  constructor(fields = {}, opts = {}) {
    const src = fields ?? {};
    const { rules, ...data } = src;
    this.#data = this.#deepClone(data);
    this.#validateInitial = opts.validateInitial ?? false;
    this.#proxy = this.#wrap(this.#data, "");
    if (rules !== undefined) {
      if (rules === null || typeof rules !== "object") {
        throw new Error(`Bot.schema(): поле "rules" должно быть объектом { поле: (f) => ... }, получили ${rules === null ? "Null" : typeof rules}`);
      }
      this.rules(rules);
    }
  }

  /**
   * Данные под глубоким Proxy. Чтение — напрямую, любая запись
   * (`fields.name = X`, `fields.address.street = X`, `delete fields.x`)
   * идёт через проверку против объявленных правил.
   * @type {Object}
   */
  get fields() {
    return this.#proxy;
  }

  /**
   * Замена данных целиком: каждое значение проверяется, а все
   * `required`-правила должны остаться закрыты после замены.
   * @param {Object} obj новый объект полей.
   */
  set fields(obj) {
    const prepared = {};
    for (const [k, v] of Object.entries(obj)) prepared[k] = this.#prepare(k, v);
    for (const k of Object.keys(this.#data)) delete this.#data[k];
    Object.assign(this.#data, prepared);
    for (const [p, rule] of Object.entries(this.#rules)) {
      if (rule.required) this.#checkValue(p, this.#getPath(p), rule);
    }
  }

  #getType = (val) => Object.prototype.toString.call(val).slice(8, -1);

  #isContainer = (val) => {
    const t = this.#getType(val);
    return t === "Object" || t === "Array";
  };

  #deepClone = (val) => {
    if (Array.isArray(val)) return val.map((v) => this.#deepClone(v));
    if (this.#getType(val) === "Object") {
      const out = {};
      for (const [k, v] of Object.entries(val)) out[k] = this.#deepClone(v);
      return out;
    }
    return val;
  };

  #childPath = (base, prop) => (base ? `${base}.${prop}` : `${prop}`);

  // Строгая проверка email без внешних зависимостей:
  // один `@`, без пробелов, точки не с краю и не подряд,
  // домен с точкой и буквенным TLD (2+ символов).
  #isEmail = (value) => {
    if (typeof value !== "string") return false;
    if (value.length < 3 || value.length > 254) return false;
    if (value.includes(" ") || value.includes("\t") || value.includes("\n"))
      return false;
    if ((value.match(/@/g) || []).length !== 1) return false;

    const [local, domain] = value.split("@");
    if (!local || !domain) return false;
    if (local.length > 64 || domain.length > 253) return false;

    // local: буквы/цифры + . _ % + - ; точки не с краю и не подряд
    if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return false;
    if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
      return false;

    // domain: точки не с краю и не подряд, минимум одна точка
    if (domain.startsWith(".") || domain.endsWith(".") || domain.includes(".."))
      return false;
    if (domain.startsWith("-") || domain.endsWith("-")) return false;
    if (!domain.includes(".")) return false;

    const labels = domain.split(".");
    if (labels.length < 2) return false;
    for (const label of labels) {
      if (label.length < 1 || label.length > 63) return false;
      if (!/^[A-Za-z0-9-]+$/.test(label)) return false;
      if (label.startsWith("-") || label.endsWith("-")) return false;
    }
    // TLD — только буквы, минимум 2
    if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1])) return false;

    return true;
  };

  // Рекурсивный Proxy: следит за любым уровнем вложенности, а не только за верхним.
  // Один и тот же raw-объект по одному пути всегда отдаёт один и тот же proxy (кэш).
  #wrap = (value, basePath) => {
    if (!this.#isContainer(value)) return value;

    let byPath = this.#proxyCache.get(value);
    if (!byPath) {
      byPath = new Map();
      this.#proxyCache.set(value, byPath);
    }
    const hit = byPath.get(basePath);
    if (hit) return hit;

    const proxy = new Proxy(value, {
      get: (target, prop, receiver) => {
        const v = Reflect.get(target, prop, receiver);
        if (typeof prop === "symbol" || prop === "__proto__") return v;
        if (v !== null && typeof v === "object") {
          return this.#wrap(v, this.#childPath(basePath, String(prop)));
        }
        return v;
      },
      set: (target, prop, v) => {
        if (typeof prop === "symbol") {
          target[prop] = v;
          return true;
        }
        const path = this.#childPath(basePath, String(prop));
        target[prop] = this.#prepare(path, v);
        return true;
      },
      deleteProperty: (target, prop) => {
        if (typeof prop === "symbol") {
          delete target[prop];
          return true;
        }
        this.#prepare(this.#childPath(basePath, String(prop)), undefined);
        delete target[prop];
        return true;
      },
    });

    byPath.set(basePath, proxy);
    return proxy;
  };

  #getPath = (path) => {
    if (!path) return this.#data;
    return String(path)
      .split(".")
      .reduce((o, k) => (o == null ? o : o[k]), this.#data);
  };

  #getSub = (root, sub) => {
    if (!sub) return root;
    return String(sub)
      .split(".")
      .reduce((o, k) => (o == null ? o : o[k]), root);
  };

  /**
   * Отщепляет trailing-строку от аргументов `string`/`number` — это кастомный
   * текст ошибки длины: `string(5, "msg")`, `string(2, 10, "msg")`, `string("msg")`.
   * @param {any[]} args сырые аргументы вызова.
   * @returns {{rest: any[], message: (string|undefined)}} остаток + текст (`undefined` = не передан).
   */
  #splitLenArgs = (args) => {
    const rest = [...args];
    let message;
    if (rest.length > 0 && typeof rest[rest.length - 1] === "string")
      message = rest.pop();
    return { rest, message };
  };

  /**
   * Чистит тексты ошибок типа при смене типа правила (например `string` → `float`),
   * кроме одного — текущего (`except`). Чужие тексты иначе лежали бы мёртвым
   * грузом в правиле. `requiredMessage` не трогает (другой слой).
   * @param {Object} next строящееся правило.
   * @param {string} [except] ключ, который не чистить (`"stringMessage"` и т.п.).
   */
  #clearTypeMessages = (next, except) => {
    for (const k of ["stringMessage", "numberMessage", "floatMessage", "emailMessage", "booleanMessage", "objectMessage"]) {
      if (k !== except) delete next[k];
    }
  };

  /**
   * Нормализация аргументов точности для `float`.
   * Формы: `(2)` — точность (легаси); `({precision: 2, message: "m"})` — объект.
   * Trailing-строка сюда не входит — её заранее отщепляет `#splitLenArgs`.
   * @param {string} key путь поля (для текста ошибок).
   * @param {any[]} args сырые аргументы вызова (без trailing-строки).
   * @returns {{precision: number, message: (string|undefined)}} точность (0 = любая) + текст из объекта.
   * @throws {Error} нечисловая/отрицательная/дробная точность, нестроковый `message`, 2+ аргумента.
   */
  #normPrecision = (key, args) => {
    const err = (msg) => new Error(`"${key}": float(): ${msg}`);
    const asInt = (v, name) => {
      if (v === undefined || v === null || v === 0) return 0;
      if (typeof v !== "number" || Number.isNaN(v)) throw err(`"${name}" должно быть числом, получили ${JSON.stringify(v)}`);
      if (!Number.isInteger(v)) throw err(`"${name}" должно быть целым, получили ${v}`);
      if (v < 0) throw err(`"${name}" не может быть отрицательным, получили ${v}`);
      return v;
    };
    if (args.length === 1) {
      const [a] = args;
      if (a !== null && typeof a === "object") {
        const precision = asInt(a.precision ?? 0, "precision");
        const rawMsg = a.message ?? a.msg ?? undefined;
        if (rawMsg !== undefined && typeof rawMsg !== "string") {
          throw err(`"message" должно быть строкой, получили ${typeof rawMsg}`);
        }
        return { precision, message: rawMsg };
      }
      return { precision: asInt(a, "precision"), message: undefined };
    }
    throw err(`ожидается (precision[, message]) | ({ precision, message? }), получили ${args.length} аргумента`);
  };

  /**
   * Нормализация аргументов длины для `string`/`number`.
   * Формы: `()` — без границ (старые не трогаем); `(5)` — точная длина (легаси);
   * `(2, 10)` — диапазон min/max, `0`/`undefined` = край открыт (`(2, 0)` — только min,
   * `(0, 10)` — только max); `({min:2, max:10})` / `({length:5})` — объектная форма
   * (текст ошибки длины — ключ `message`/`msg`). Trailing-строка сюда не входит —
   * её заранее отщепляет `#splitLenArgs`.
   * `length` и `min`/`max` взаимоисключают друг друга.
   * @param {string} key путь поля (для текста ошибок).
   * @param {string} method имя метода (`"string"`/`"number"`).
   * @param {any[]} args сырые аргументы вызова (без trailing-строки).
   * @returns {{length: number, min: number, max: number, message: (string|undefined)}} границы (0 = не задана) + текст из объекта.
   * @throws {Error} нечисловые/отрицательные/дробные границы, `min > max`,
   * конфликт `length` с диапазоном, 3+ аргумента, нестроковый `message`.
   */
  #normBounds = (key, method, args) => {
    const err = (msg) => new Error(`"${key}": ${method}(): ${msg}`);
    const asInt = (v, name) => {
      if (v === undefined || v === null || v === 0) return 0;
      if (typeof v !== "number" || Number.isNaN(v))
        throw err(
          `"${name}" должно быть числом, получили ${JSON.stringify(v)}`,
        );
      if (!Number.isInteger(v))
        throw err(`"${name}" должно быть целым, получили ${v}`);
      if (v < 0)
        throw err(`"${name}" не может быть отрицательным, получили ${v}`);
      return v;
    };
    if (args.length === 1) {
      const [a] = args;
      if (a !== null && typeof a === "object") {
        const length = asInt(a.length ?? a.len ?? 0, "length");
        const min = asInt(a.min ?? a.minLength ?? 0, "min");
        const max = asInt(a.max ?? a.maxLength ?? 0, "max");
        const rawMsg = a.message ?? a.msg ?? undefined;
        if (rawMsg !== undefined && typeof rawMsg !== "string") {
          throw err(`"message" должно быть строкой, получили ${typeof rawMsg}`);
        }
        if (length > 0 && (min > 0 || max > 0)) {
          throw err(
            `length (${length}) и min/max несовместимы — укажи либо точную длину, либо диапазон`,
          );
        }
        if (min > 0 && max > 0 && min > max)
          throw err(`min (${min}) > max (${max})`);
        return { length, min, max, message: rawMsg };
      }
      return { length: asInt(a, "length"), min: 0, max: 0, message: undefined };
    }
    if (args.length === 2) {
      const min = asInt(args[0], "min");
      const max = asInt(args[1], "max");
      if (min > 0 && max > 0 && min > max)
        throw err(`min (${min}) > max (${max})`);
      return { length: 0, min, max, message: undefined };
    }
    throw err(
      `ожидается (length[, message]) | (min, max[, message]) | ({ length | min, max, message? }), получили ${args.length} аргумента`,
    );
  };

  /**
   * Проверка длины/кол-ва против правила: сначала точная `length`,
   * иначе диапазон `minLength`/`maxLength` (0 = граница открыта).
   * Кастомный текст метода (если задан) побеждает все дефолтные тексты длины.
   * @param {string} key путь поля (для текста ошибок).
   * @param {number} len фактическая длина (символы строки / цифры числа).
   * @param {{length?: number, minLength?: number, maxLength?: number}} rule правило поля.
   * @param {string} [custom] свой текст ошибки метода (`stringMessage` / `numberMessage`).
   * @throws {Error} кастомный текст ИЛИ `need length N` / `need length MIN..MAX` / `need length >= MIN` / `need length <= MAX`.
   */
  #checkLen = (key, len, rule, custom) => {
    if (rule.length > 0) {
      if (len !== rule.length) throw new Error(custom ?? `"${key}": need length ${rule.length}`);
      return;
    }
    const min = rule.minLength || 0;
    const max = rule.maxLength || 0;
    if (min > 0 && max > 0) {
      if (len < min || len > max) throw new Error(custom ?? `"${key}": need length ${min}..${max}`);
    } else if (min > 0 && len < min) {
      throw new Error(custom ?? `"${key}": need length >= ${min}`);
    } else if (max > 0 && len > max) {
      throw new Error(custom ?? `"${key}": need length <= ${max}`);
    }
  };

  // Единый центр строгой валидации: тип всегда через #getType
  #checkValue = (key, value, rule) => {
    if (value === null) {
      if (rule.nullable) return;
      if (rule.required && rule.requiredMessage)
        throw new Error(rule.requiredMessage);
      throw new Error(
        rule.type
          ? `"${key}": need ${rule.type}, got Null`
          : `"${key}": required`,
      );
    }

    // Пустота при required важнее типа/длины: пустое поле — это «нет значения»,
    // а не «не та длина». Поэтому кастомный required-текст побеждает дефолтные
    // `need String` / `need length ...` (как в yup: '' + required → required-ошибка).
    if (rule.required) {
      if (value === undefined)
        throw new Error(rule.requiredMessage ?? `"${key}": required`);
      if (typeof value === "string" && value.trim() === "") {
        throw new Error(rule.requiredMessage ?? `"${key}": required`);
      }
    }

    if (rule.type === "String") {
      const type = this.#getType(value);
      if (type !== "String")
        throw new Error(rule.stringMessage ?? `"${key}": need String, got ${type}`);
      this.#checkLen(key, value.length, rule, rule.stringMessage);
    }

    if (rule.type === "Number") {
      const type = this.#getType(value);
      if (type !== "Number")
        throw new Error(rule.numberMessage ?? `"${key}": need Number, got ${type}`);
      if (Number.isNaN(value))
        throw new Error(rule.numberMessage ?? `"${key}": NaN is not a valid number`);
      if (!Number.isFinite(value)) throw new Error(rule.numberMessage ?? `"${key}": must be finite`);
      if (!Number.isInteger(value))
        throw new Error(rule.numberMessage ?? `"${key}": must be integer, got ${value}`);
      // кол-во цифр без минуса: String(Math.abs(value)).length
      this.#checkLen(key, String(Math.abs(value)).length, rule, rule.numberMessage);
    }

    if (rule.type === "Float") {
      const type = this.#getType(value);
      if (type !== "Number")
        throw new Error(rule.floatMessage ?? `"${key}": need Float, got ${type}`);
      if (Number.isNaN(value))
        throw new Error(rule.floatMessage ?? `"${key}": NaN is not a valid float`);
      if (!Number.isFinite(value)) throw new Error(rule.floatMessage ?? `"${key}": must be finite`);
      if (Number.isInteger(value))
        throw new Error(rule.floatMessage ?? `"${key}": must be float, got ${value}`);
      if (rule.precision > 0) {
        const dec = String(Math.abs(value)).split(".")[1]?.length ?? 0;
        if (dec !== rule.precision)
          throw new Error(rule.floatMessage ?? `"${key}": need precision ${rule.precision}`);
      }
    }

    if (rule.type === "Email") {
      const type = this.#getType(value);
      if (type !== "String")
        throw new Error(rule.emailMessage ?? `"${key}": need Email, got ${type}`);
      if (!this.#isEmail(value))
        throw new Error(
          rule.emailMessage ?? `"${key}": invalid email, got ${JSON.stringify(value)}`,
        );
    }

    if (rule.type === "Boolean") {
      const type = this.#getType(value);
      if (type !== "Boolean")
        throw new Error(rule.booleanMessage ?? `"${key}": need Boolean, got ${type}`);
    }

    if (rule.type === "Object") {
      const type = this.#getType(value);
      if (type !== "Object")
        throw new Error(rule.objectMessage ?? `"${key}": need Object, got ${type}`);
    }
  };

  // При записи объекта/массива проверяем и все вложенные правила под этим путём
  #checkDeep = (path, value) => {
    const prefix = path ? `${path}.` : "";
    for (const [rp, r] of Object.entries(this.#rules)) {
      if (rp.startsWith(prefix)) {
        this.#checkValue(rp, this.#getSub(value, rp.slice(prefix.length)), r);
      }
    }
  };

  // Проверка + подготовка значения к записи (контейнеры заворачиваем в proxy)
  #prepare = (path, value) => {
    const rule = this.#rules[path];
    if (rule) this.#checkValue(path, value, rule);
    if (this.#isContainer(value)) {
      this.#checkDeep(path, value);
      return this.#wrap(value, path);
    }
    return value;
  };

  /**
   * Scope для shape: относительные ключи превращаются в полные пути.
   * @param {string} base путь родительского объекта.
   * @returns {BotScope} методы с относительными ключами.
   */
  #scope = (base) => {
    const j = (k) => (base ? `${base}.${k}` : `${k}`);
    return {
      string: (k, ...args) => this.#chain(j(k)).string(...args),
      number: (k, ...args) => this.#chain(j(k)).number(...args),
      float: (k, ...args) => this.#chain(j(k)).float(...args),
      email: (k, ...args) => this.#chain(j(k)).email(...args),
      boolean: (k, ...args) => this.#chain(j(k)).boolean(...args),
      object: (k, ...args) => this.#chain(j(k)).object(...args),
      nullable: (k) => this.#chain(j(k)).nullable(),
      required: (k, message) => this.#chain(j(k)).required(message),
    };
  };

  /**
   * Чейн помнит путь — поэтому дальше методы вызываются без значения.
   * Пустой ключ запрещён сразу с понятной ошибкой (иначе получился бы
   * невнятный `"undefined": need Number, got Object`).
   * @param {string} path полный путь поля.
   * @returns {BotChain} чейн — возвращается всегда, цепочка не рвётся.
   * @throws {Error} если ключ не передан.
   */
  #chain = (path) => {
    if (path == null || path === "") {
      throw new Error(`key is required, e.g. schema("name").string(5)`);
    }
    const get = () => this.#getPath(path);
    const check = (next) => {
      if (!this.#recordOnly && !this.#deferCheck && this.#validateInitial) {
        this.#checkValue(path, get(), next);
      }
    };

    const api = {
      string: (...args) => {
        const next = { ...(this.#rules[path] || {}), type: "String" };
        // trailing-строка = свой текст ошибки (тип + длина), иначе дефолтные
        const { rest, message: trailing } = this.#splitLenArgs(args);
        let strMsg = trailing;
        if (rest.length > 0) {
          const { length, min, max, message } = this.#normBounds(
            path,
            "string",
            rest,
          );
          delete next.length;
          delete next.minLength;
          delete next.maxLength;
          if (length > 0) next.length = length;
          if (min > 0) next.minLength = min;
          if (max > 0) next.maxLength = max;
          this.#clearTypeMessages(next, "stringMessage");
          strMsg ??= message;
        }
        if (strMsg !== undefined) {
          if (strMsg) next.stringMessage = strMsg;
          else delete next.stringMessage;
        }
        check(next);
        this.#rules[path] = next;
        return api;
      },
      number: (...args) => {
        const next = { ...(this.#rules[path] || {}), type: "Number" };
        // trailing-строка = свой текст ошибки (тип + кол-во цифр), иначе дефолтные
        const { rest, message: trailing } = this.#splitLenArgs(args);
        let numMsg = trailing;
        if (rest.length > 0) {
          const { length, min, max, message } = this.#normBounds(
            path,
            "number",
            rest,
          );
          delete next.length;
          delete next.minLength;
          delete next.maxLength;
          if (length > 0) next.length = length;
          if (min > 0) next.minLength = min;
          if (max > 0) next.maxLength = max;
          this.#clearTypeMessages(next, "numberMessage");
          numMsg ??= message;
        }
        if (numMsg !== undefined) {
          if (numMsg) next.numberMessage = numMsg;
          else delete next.numberMessage;
        }
        check(next);
        this.#rules[path] = next;
        return api;
      },
      float: (...args) => {
        const next = { ...(this.#rules[path] || {}), type: "Float" };
        delete next.length;
        delete next.minLength;
        delete next.maxLength;
        this.#clearTypeMessages(next, "floatMessage");
        // свой текст ошибки — trailing-строкой или ключом message: float(2, "m"), float({ precision: 2, message: "m" })
        const { rest, message: trailing } = this.#splitLenArgs(args);
        let flMsg = trailing;
        if (rest.length > 0) {
          const { precision, message } = this.#normPrecision(path, rest);
          delete next.precision;
          if (precision > 0) next.precision = precision;
          flMsg ??= message;
        }
        if (flMsg !== undefined) {
          if (flMsg) next.floatMessage = flMsg;
          else delete next.floatMessage;
        }
        check(next);
        this.#rules[path] = next;
        return api;
      },
      boolean: (...args) => {
        const next = { ...(this.#rules[path] || {}), type: "Boolean" };
        this.#clearTypeMessages(next, "booleanMessage");
        // свой текст ошибки: boolean("m")
        const { rest, message } = this.#splitLenArgs(args);
        if (rest.length > 0) {
          throw new Error(`"${path}": boolean(): ожидается boolean([message]), получили лишние аргументы`);
        }
        if (message !== undefined) {
          if (message) next.booleanMessage = message;
          else delete next.booleanMessage;
        }
        check(next);
        this.#rules[path] = next;
        return api;
      },
      email: (...args) => {
        const next = { ...(this.#rules[path] || {}), type: "Email" };
        delete next.length;
        delete next.minLength;
        delete next.maxLength;
        delete next.precision;
        this.#clearTypeMessages(next, "emailMessage");
        // свой текст ошибки: email("Введите корректный email")
        const { rest, message } = this.#splitLenArgs(args);
        if (rest.length > 0) {
          throw new Error(`"${path}": email(): ожидается email([message]), получили лишние аргументы`);
        }
        if (message !== undefined) {
          if (message) next.emailMessage = message;
          else delete next.emailMessage;
        }
        check(next);
        this.#rules[path] = next;
        return api;
      },
      object: (...args) => {
        const next = { ...(this.#rules[path] || {}), type: "Object" };
        delete next.length;
        delete next.minLength;
        delete next.maxLength;
        delete next.precision;
        this.#clearTypeMessages(next, "objectMessage");
        // формы: object(), object(shape), object("msg"), object(shape, "msg")
        const { rest, message } = this.#splitLenArgs(args);
        let shape;
        if (rest.length > 1) {
          throw new Error(`"${path}": object(): ожидается object([shape][, message]), получили лишние аргументы`);
        }
        if (rest.length === 1) {
          if (rest[0] == null) shape = undefined;
          else if (typeof rest[0] === "function") shape = rest[0];
          else {
            throw new Error(`"${path}": object(): shape должно быть функцией, получили ${typeof rest[0]}`);
          }
        }
        if (message !== undefined) {
          if (message) next.objectMessage = message;
          else delete next.objectMessage;
        }
        check(next);
        if (shape) {
          if (get() !== null) {
            shape(this.#scope(path)); // проверка текущих + запись правил
          } else {
            // поле сейчас null: правила фиксируем без проверки значений
            this.#recordOnly = true;
            try {
              shape(this.#scope(path));
            } finally {
              this.#recordOnly = false;
            }
          }
        }
        this.#rules[path] = next;
        return api;
      },
      nullable: () => {
        this.#rules[path] = { ...(this.#rules[path] || {}), nullable: true };
        return api;
      },
      required: (message) => {
        const next = { ...(this.#rules[path] || {}), required: true };
        if (message) next.requiredMessage = message;
        else delete next.requiredMessage;
        check(next);
        this.#rules[path] = next;
        return api;
      },
    };

    return api;
  };

  /**
   * Низкоуровневый доступ к чейну поля — движок для вызываемой схемы.
   * В обычном коде используйте `schema("name")` — это то же самое.
   * @param {string} key ключ поля или dotted-путь.
   * @returns {BotChain} чейн поля — дальше без значения.
   * @throws {Error} если ключ не передан.
   * @example schemer.field("name").string(5).required();
   */
  field(key) {
    return this.#chain(key);
  }

  /**
   * Строка. Только `String`; границы длины — точная или диапазон.
   * Формы (одно число = точная длина — легаси; два числа = диапазон min/max):
   * `string(key)` — любая длина; `string(key, 5)` — ровно 5 символов;
   * `string(key, 2, 10)` — от 2 до 10 символов (`0` = край открыт:
   * `string(key, 2, 0)` — только min, `string(key, 0, 10)` — только max);
   * `string(key, { min: 2, max: 10 })` — диапазон объектом;
   * `string(key, { length: 5 })` — точная длина объектом.
   * `length` и `min`/`max` взаимоисключают друг друга; повторный вызов
   * перезаписывает границы целиком; голый вызов без аргументов старые не трогает.
   * Свой текст ошибки (тип + длина) — trailing-строкой или ключом `message` в объекте:
   * `string(key, 5, "Минимум 5")`, `string(key, 2, 10, "От 2 до 10")`,
   * `string(key, { min: 2, message: "Минимум 2" })`, `string(key, "Своя ошибка")`
   * (одиночная строка меняет только текст, границы не трогает).
   * Пустое поле (`""`/`"   "`) при `.required()` даёт required-текст, а не длину.
   * @param {string} key ключ поля или dotted-путь (`"address.street"`).
   * @param {...(number|BoundsOpts|string)} args границы и/или текст ошибки (см. формы выше).
   * @returns {BotChain} чейн — цепочка продолжается.
   * @throws {Error} `"key": need String, got X` / кастомный текст ИЛИ `"key": need length N` /
   * `"key": need length MIN..MAX` / `"key": need length >= MIN` / `"key": need length <= MAX`.
   * @example schema.string("name", 5).required();       // ровно 5
   * @example schema.string("name", 2, 10).required();   // от 2 до 10
   * @example schema.string("name", { min: 2 }).required(); // минимум 2
   * @example schema.string("name", { min: 5, message: "Имя не короче 5" }).required("Заполни имя");
   */
  string(key, ...args) {
    return this.#chain(key).string(...args);
  }

  /**
   * Идеальное целое число: `Number` + не `NaN` + конечное + integer.
   * Дроби (`3.14`) отбрасываются — для них есть `float`.
   * Границы — это кол-во ЦИФР (минус не считается: `-12345` = 5 цифр),
   * а не диапазон значений. Формы как у `string`:
   * `number(key)` — любое целое; `number(key, 6)` — ровно 6 цифр (легаси);
   * `number(key, 2, 3)` — 2–3 цифры; `number(key, { min: 2, max: 3 })` — то же объектом;
   * `number(key, { length: 6 })` — ровно 6 цифр объектом.
   * Свой текст ошибки (тип + кол-во цифр) — trailing-строкой (`number(key, 6, "Ровно 6 цифр")`)
   * или ключом `message` в объекте.
   * @param {string} key ключ поля или dotted-путь.
   * @param {...(number|BoundsOpts|string)} args границы и/или текст ошибки (см. формы выше).
   * @returns {BotChain} чейн для продолжения (`.required()`, `.nullable()`…).
   * @throws {Error} `need Number` / `NaN is not a valid number` / `must be finite` / `must be integer` / кастомный текст ИЛИ `need length N` / `need length MIN..MAX` / `need length >= MIN` / `need length <= MAX`.
   * @example schema.number("age").required();
   * @example schema.number("zip", 6).required();     // ровно 6 цифр
   * @example schema.number("zip", 5, 6).required();  // 5–6 цифр
   * @example schema.number("zip", 5, 6, "Индекс: 5–6 цифр").required("Заполни индекс");
   */
  number(key, ...args) {
    return this.#chain(key).number(...args);
  }

  /**
   * Дробное число: `Number` + конечное + **не** integer.
   * Целые (`25`, `2.0`) отбрасываются — для них есть `number`.
   * Формы: `float(key)` — любая дробь; `float(key, 2)` — ровно 2 знака (легаси);
   * `float(key, { precision: 2 })` — то же объектом.
   * Свой текст ошибки — trailing-строкой (`float(key, 2, "Ровно 2 знака")`)
   * или ключом `message` в объекте; одиночная `float(key, "m")` меняет только текст.
   * @param {string} key ключ поля или dotted-путь.
   * @param {...(number|PrecisionOpts|string)} args точность и/или текст ошибки (см. формы выше).
   * @returns {BotChain} чейн для продолжения.
   * @throws {Error} кастомный текст ИЛИ `need Float` / `NaN is not a valid float` / `must be finite` / `must be float` / `need precision N`.
   * @example schema.float("price", 2).required();
   * @example schema.float("price", 2, "Цена: ровно 2 знака").required("Укажи цену");
   */
  float(key, ...args) {
    return this.#chain(key).float(...args);
  }

  /**
   * Булево. Только `Boolean` — строка `"true"` не проходит.
   * Свой текст ошибки — аргументом: `boolean(key, "Только да/нет")`.
   * @param {string} key ключ поля или dotted-путь.
   * @param {string} [message] кастомный текст ошибки; по дефолту `"key": need Boolean, got X`.
   * @returns {BotChain} чейн для продолжения.
   * @throws {Error} кастомный текст ИЛИ `"key": need Boolean, got X`.
   * @example schema.boolean("active").required();
   * @example schema.boolean("active", "Поставь галочку").required("Обязательное поле");
   */
  boolean(key, message) {
    return this.#chain(key).boolean(...(message === undefined ? [] : [message]));
  }

  /**
   * Строгий email: только `String`, один `@`, без пробелов,
   * local и domain без ведущих/концевых точек и без `..`,
   * домен с точкой и буквенным TLD (2+ символов).
   * Свой текст ошибки — аргументом: `email(key, "Введите корректный email")`.
   * @param {string} key ключ поля или dotted-путь.
   * @param {string} [message] кастомный текст ошибки; по дефолту `"key": need Email...` / `"key": invalid email...`.
   * @returns {BotChain} чейн для продолжения.
   * @throws {Error} кастомный текст ИЛИ `"key": need Email, got X` / `"key": invalid email, got "..."`.
   * @example schema.email("contact").required();
   * @example schema.email("contact", "Введите корректный email").required("Заполни email");
   */
  email(key, message) {
    return this.#chain(key).email(...(message === undefined ? [] : [message]));
  }

  /**
   * Объект. Только plain `Object` — массив и `null` не проходят
   * (для `null` добавь `.nullable()`). `shape` — функция-билдер, ей даётся scope
   * с теми же методами, но ключи относительные.
   * Формы: `object(key)`, `object(key, shape)`, `object(key, "свой текст")`,
   * `object(key, shape, "свой текст")`.
   * @param {string} key ключ поля или dotted-путь.
   * @param {...(Function|string)} args shape-билдер и/или кастомный текст ошибки.
   * @returns {BotChain} чейн для продолжения.
   * @throws {Error} кастомный текст ИЛИ `"key": need Object, got X`.
   * @example
   * schema.object("address", (a) => {
   *   a.string("street").required();
   *   a.object("geo", (g) => {
   *     g.float("lat").required();
   *   });
   * }).required();
   */
  object(key, ...args) {
    return this.#chain(key).object(...args);
  }

  /**
   * Модификатор как `yup.nullable()`: разрешает `null` (проверки типа
   * и `required` его пропускают). `undefined` не разрешается никогда.
   * Порядок свободный, но в строгом режиме (`validateInitial: true`),
   * если поле **сейчас** `null` — начни с `nullable`.
   * @param {string} key ключ поля или dotted-путь.
   * @returns {BotChain} чейн для продолжения.
   * @example schema.nullable("nickname").string();
   */
  nullable(key) {
    return this.#chain(key).nullable();
  }

  /**
   * Значение обязано присутствовать: отбрасывает `null` (если нет `nullable`),
   * `undefined` и пустую строку (`""` / `"   "`). `0` и `false` проходят —
   * это значения, а не пустота.
   * Пустота проверяется РАНЬШЕ типа и длины: пустое поле при `required`
   * всегда даёт required-текст, а не `need String` / `need length ...`.
   * Поэтому `f.string(5).required("Заполни имя")` на пустом инпуте покажет
   * `"Заполни имя"`, а на непустом коротком (`"Jo"`) — ошибку длины
   * (свою — только если задана в `string`: `f.string(5, "Минимум 5")`).
   * @param {string} key ключ поля или dotted-путь.
   * @param {string} [message] кастомный текст ошибки; по дефолту `"key": required`.
   * @returns {BotChain} чейн для продолжения.
   * @throws {Error} `"key": required` (или кастомный `message`).
   * @example schema.required("name").string(5);
   * @example schema.required("name", "Введите имя");
   */
  required(key, message) {
    return this.#chain(key).required(message);
  }

  /**
   * Массовое объявление правил: `{ поле: (f) => ... }`.
   * Ключи — имена полей или dotted-пути, значение — билдер, получающий
   * чейн поля (тот же объект, что возвращает `field(key)`).
   * @param {Object<string, RuleBuilder>} [defs={}] поле → билдер правил.
   * @param {Object} [opts={}] опции батча.
   * @param {boolean} [opts.validateInitial] проверять ли текущие значения
   * во время записи правил. По дефолту — настройка схемы (а она по дефолту
   * ленивая: правила записываются даже на пустых данных `""`, проверка
   * включается на записях через `fields`). `true` — строго проверить сейчас.
   * @returns {BotSchemer} this — цепочка не рвётся.
   * @throws {Error} если правило — не функция.
   * @example
   * schemer.rules({ name: (f) => f.string(5).required() });
   * @example
   * // строго: сверить текущие значения сразу (упадёт на пустых)
   * schemer.rules({ name: (f) => f.string(5).required("Заполни имя") }, { validateInitial: true });
   */
  rules(defs = {}, opts = {}) {
    const validate = opts.validateInitial ?? this.#validateInitial;
    const prevDefer = this.#deferCheck;
    const prevDefault = this.#validateInitial;
    this.#deferCheck = false;
    this.#validateInitial = validate;
    try {
      for (const [key, build] of Object.entries(defs)) {
        if (typeof build !== "function") {
          throw new Error(
            `rules(): правило для "${key}" должно быть функцией (f) => ..., получили ${typeof build}`,
          );
        }
        build(this.#chain(key));
      }
    } finally {
      this.#deferCheck = prevDefer;
      this.#validateInitial = prevDefault;
    }
    return this;
  }
}

/**
 * Точка входа: фабрика вызываемых схем.
 * Схема — это функция: вызов `schema("name")` возвращает чейн поля,
 * цепочка не рвётся никогда. Плюс свойства-утилиты внутри Bot:
 * `schema.rules({...})` — массовое объявление правил,
 * `schema.fields` — данные под глубоким Proxy,
 * `schema.string(key)`, `schema.number(key)`, `schema.float(key)`,
 * `schema.email(key)`, `schema.boolean(key)`, `schema.object(key)`,
 * `schema.nullable(key)`, `schema.required(key)`, `schema.field(key)` —
 * короткие формы (делегируют в `BotSchemer`).
 * UI-утилиты формы (только внутри `Bot`, движок их не знает):
 * `Bot.setError(input, msg)`, `schema.setError(...)`,
 * `schema.validateField(key, input, normalize)`,
 * `schema.bindForm(form, { normalizers, event, onValid, onInvalid })`.
 * @example
 * const schema = Bot.schema({ name: "Farid", age: 25 });
 * schema.rules({ name: (f) => f.string(5).required() });
 * schema("age").number().required();
 * schema.string("name", 5).required(); // короткая форма через Bot
 */
export class Bot {
  /**
   * UI-утилита: показать / очистить ошибку под полем.
   * Хинт `.error-hint` создаётся автоматически в `input.parentElement`.
   * Чистый DOM-хелпер — к `BotSchemer` (движку валидации) не относится.
   * @param {Element} input инпут, под которым рисовать ошибку.
   * @param {string} [message=""] текст ошибки; пусто = очистить.
   */
  static setError(input, message = "") {
    input.style.borderColor = message ? "#e5484d" : "";
    let hint = input.parentElement.querySelector(".error-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "error-hint";
      hint.style.cssText =
        "color:#e5484d;font-size:12px;margin-top:4px;min-height:16px;";
      input.parentElement.appendChild(hint);
    }
    hint.textContent = message || "";
  }

    /**
     * Создаёт вызываемую схему для объекта полей.
     * @param {BotSchemaInput} [fields={}] начальные данные. Могут быть пустыми (`""`) —
     * по дефолту объявление правил их не проверяет (ленивый режим).
     * Ключ `rules` зарезервирован: это правила `{ поле: (f) => ... }`
     * (то же, что `schema.rules({...})`, но без отдельного вызова;
     * сам `rules()` остаётся для совместимости и дообъявления).
     * @param {Object} [opts={}] опции схемы.
     * @param {boolean} [opts.validateInitial=false] проверять ли текущие значения
     * в момент объявления правил. `true` — строгий режим: объявление сразу
     * сверяется с текущими значениями (упадёт на пустой форме).
     * @throws {Error} если `fields.rules` — не объект.
     * @example
     * // пустая форма без дефолтов: объявление не падает
     * const schema = Bot.schema({ name: "", email: "" });
     * schema.rules({ name: (f) => f.string({ min: 5 }).required("Заполни имя") });
     * @example
     * // то же самое, но короче — правила прямо в объекте (rules() можно не вызывать)
     * const schema = Bot.schema({
     *   name: "",
     *   rules: { name: (f) => f.string({ min: 5 }).required("Заполни имя") },
     * });
     */
  static schema(fields = {}, opts = {}) {
    const schemer = new BotSchemer(fields, opts);

    /**
     * Индивидуальный доступ к полю: возвращает чейн, привязанный к ключу.
     * Дальше методы идут без значения: `schema("name").string(5).required()`.
     * @param {string} key ключ поля или dotted-путь (`"address.street"`).
     * @returns {BotChain} чейн поля.
     * @throws {Error} если ключ не передан.
     */
    const fn = (key) => schemer.field(key);

    /**
     * Массовое объявление правил: `{ поле: (f) => ... }`.
     * Ключи — имена полей или dotted-пути, значение — билдер, получающий
     * чейн поля (тот же объект, что возвращает `schema("name")`).
     * Возвращает ту же схему — цепочка не рвётся:
     * `schema.rules({...})("name").string(5)`.
     * @param {Object<string, RuleBuilder>} [defs={}] поле → билдер правил.
     * @param {Object} [opts={}] опции батча.
     * @param {boolean} [opts.validateInitial] проверять ли текущие значения
     * во время записи правил; по дефолту — настройка схемы (лениво:
     * правила запишутся даже на пустых данных `""`). `true` — строго
     * проверить текущие значения сразу.
     * @throws {Error} если правило — не функция.
     * @example
     * schema.rules({
     *   name: (f) => f.string(5).required(),
     *   age: (f) => f.number().required(),
     * });
     * @example
     * // строго: сверить текущие значения сразу (упадёт на пустых)
     * schema.rules({ name: (f) => f.string(5).required("Заполни имя") }, { validateInitial: true });
     */
    fn.rules = (defs = {}, opts = {}) => {
      schemer.rules(defs, opts);
      return fn;
    };

    /** Данные под глубоким Proxy: чтение напрямую, запись — через проверку. */
    fn.fields = schemer.fields;

    // Короткие формы — утилиты внутри Bot (делегируют в BotSchemer).
    // Позволяют писать schema.string("name", 5) вместо schema("name").string(5).
    fn.field = (key) => schemer.field(key);
    fn.string = (key, ...args) => schemer.string(key, ...args);
    fn.number = (key, ...args) => schemer.number(key, ...args);
        fn.float = (key, ...args) => schemer.float(key, ...args);
        fn.email = (key, ...args) => schemer.email(key, ...args);
        fn.boolean = (key, ...args) => schemer.boolean(key, ...args);
        fn.object = (key, ...args) => schemer.object(key, ...args);
    fn.nullable = (key) => schemer.nullable(key);
    fn.required = (key, message) => schemer.required(key, message);

    // --- UI-утилиты формы (живут внутри Bot, движок BotSchemer их не знает) ---

    /** Показать/очистить ошибку под полем (делегирует в `Bot.setError`). */
    fn.setError = (input, message = "") => Bot.setError(input, message);

    /**
     * Одно поле -> одна запись через Proxy -> одна проверка.
     * Ошибку рисует сразу через `Bot.setError`.
     * @param {string} key ключ поля в `fields`.
     * @param {Element} input инпут, откуда брать `.value`.
     * @param {(v: string) => any} [normalize] преобразование перед записью.
     * @returns {boolean} true = валидно, false = показана ошибка.
     */
    fn.validateField = (key, input, normalize = (v) => v) => {
      try {
        fn.fields[key] = normalize(input.value);
        Bot.setError(input, "");
        return true;
      } catch (err) {
        Bot.setError(input, err.message);
        return false;
      }
    };

    /**
     * Привязка формы к схеме: живая валидация на `input` (по дефолту) + проверка всех
     * полей на `submit`. Все `name`-инпуты формы маппятся 1:1 на ключи `fields`.
     * @param {HTMLFormElement} form форма для привязки (все инпуты ищутся
     * по селектору `[name]` внутри неё; `input.name` должен совпадать с ключом в `fields`).
     * @param {Object} [opts={}] второй аргумент — объект настроек привязки.
     * @param {Object<string, (v: string) => any>} [opts.normalizers={}] словарь
     * «имя поля -> функция нормализации»: превращает сырой `input.value` (всегда строка)
     * в значение перед записью в `fields`. Нужен, когда тип в схеме не строка —
     * например `age: (v) => Number(v)`, `active: (v) => checkbox.checked`.
     * Если для поля нормалайзера нет — значение пишется как есть (строкой).
     * @param {string|string[]} [opts.event="input"] событие(я), на котором срабатывает
     * живая валидация каждого инпута (вызывается `validateField` и сразу рисуется/чистится
     * ошибка под полем). По дефолту `"input"` — проверка на каждое нажатие клавиши.
     * Поставь `"change"` — проверка только при потере фокуса/подтверждении,
     * `["input", "change"]` — оба сразу. Одно событие на все инпуты формы.
     * @param {string|string[]} [opts.events] алиас для `opts.event` (то же самое,
     * множественное имя). Приоритет ниже: если задан `event` — используется он.
     * @param {(data: Object) => void} [opts.onValid] колбэк успеха: вызывается на `submit`,
     * только если ВСЕ поля прошли валидацию. Получает копию валидных данных
     * (`{ ...fn.fields }`) — здесь обычно отправка на сервер / переход дальше.
     * Если не задан — при успехе просто ничего не происходит.
     * @param {(errors: Object<string, string>) => void} [opts.onInvalid] колбэк провала:
     * вызывается на `submit`, если хотя бы одно поле невалидно. Получает словарь
     * «имя поля -> текст ошибки» (`{ email: '"email": invalid email...' }`) —
     * здесь обычно тост, подсветка, аналитика. Ошибки под полями уже нарисованы
     * через `setError` до вызова колбэка.
     * @param {boolean} [opts.focusFirst=true] ставить ли фокус на первое невалидное
     * поле после неудачного `submit` (удобно для длинных форм — юзер сразу видит,
     * что чинить). Поставь `false`, чтобы фокус не прыгал.
     * @returns {() => void} функция отписки (снимает все навешанные слушатели
     * через `AbortController` — вызови при размонтировании формы/SPA-переходе).
     * @example
     * schema.bindForm(form, {
     *   normalizers: { message: (v) => (v.trim() === "" ? null : v) },
     *   onValid: (data) => console.log("valid:", data),
     * });
     * @example
     * schema.bindForm(form, { event: "change" });
     */
    fn.bindForm = (form, opts = {}) => {
      const {
        normalizers = {},
        event = null,
        events = null,
        onValid = null,
        onInvalid = null,
        focusFirst = true,
      } = opts;
      const rawEvent = event ?? events ?? "input";
      const listenEvents = Array.isArray(rawEvent) ? rawEvent : [rawEvent];
      const inputs = [...form.querySelectorAll("[name]")];
      const pick = (name) => normalizers[name] || ((v) => v);
      const aborter = new AbortController();
      const { signal } = aborter;

      inputs.forEach((input) => {
        for (const ev of listenEvents) {
          input.addEventListener(
            ev,
            () => fn.validateField(input.name, input, pick(input.name)),
            { signal },
          );
        }
      });

      form.addEventListener(
        "submit",
        (e) => {
          e.preventDefault();
          const errors = {};
          let firstBad = null;
          for (const input of inputs) {
            const ok = fn.validateField(input.name, input, pick(input.name));
            if (!ok) {
              errors[input.name] =
                input.parentElement.querySelector(".error-hint")?.textContent ||
                "invalid";
              if (!firstBad) firstBad = input;
            }
          }
          if (Object.keys(errors).length > 0) {
            if (focusFirst && firstBad) firstBad.focus();
            if (onInvalid) onInvalid(errors);
            return;
          }
          if (onValid) onValid({ ...fn.fields });
        },
        { signal },
      );

      return () => aborter.abort();
    };

    return fn;
  }
}

// --- Демо ---
// const schema = Bot.schema({
//     name: "Farid",
//     age: 25,
// })

// schema.rules({
//     name: (f) => f.string(5).required(), // ok
//     age: (f) => f.number().required(),   // ok
// });

// schema("name").string(5).required(); // ok
// schema("age").number().required();   // ok
