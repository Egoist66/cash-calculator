/**
 * # createApp — нативное управление DOM и рендером
 *
 * Мини-рантайм для монтирования приложения в DOM без фреймворка. Отвечает за:
 * - ожидание готовности документа (без «потерянного» `DOMContentLoaded`);
 * - рендер строки (HTML-фрагмента) или готового DOM-узла;
 * - детерминированный жизненный цикл;
 * - освобождение ресурсов через `destroy()`.
 *
 * ## Жизненный цикл
 *
 * 1. `mount()` дожидается `DOMContentLoaded`, если документ ещё загружается.
 * 2. Находит root по CSS-селектору (иначе — ошибка).
 * 3. Запоминает исходный `innerHTML` root (для восстановления в `destroy()`).
 * 4. `beforeInited(context)` — root уже найден, но контент ещё старый.
 * 5. Рендер: содержимое `root` заменяется результатом `app()`.
 * 6. `middlewares` — выполняются по порядку на уже отрендеренном DOM.
 * 7. `componentInitializers` — инициализация компонентов.
 * 8. `onInited(context)` — всё готово.
 *
 * Middleware и компоненты могут вернуть функцию очистки (`Cleanup`). Все такие
 * функции складываются в стек и вызываются в `destroy()` в обратном порядке.
 *
 * ## Гарантии и ограничения
 *
 * - `app()` вызывается ровно один раз за монтирование.
 * - `mount()` идемпотентен: повторные вызовы возвращают тот же промис.
 * - `destroy()` идемпотентен: повторный вызов ничего не делает.
 * - После `destroy()` объект непригоден для повторного монтирования.
 * - Если `app()` вернул строку, она разбирается как HTML-фрагмент, а теги
 *   `<script>` из неё удаляются. Inline-атрибуты (`onclick`) при этом **не**
 *   вычищаются: содержимое считается доверенным (не используйте для
 *   ненадёжного пользовательского ввода).
 * - Если монтирование упало (например, middleware бросил исключение),
 *   промис `mount()` остаётся отклонённым; для откатки вызовите `destroy()`.
 *
 * @example Базовое использование
 * import { createApp } from "./core/createApp";
 *
 * const app = createApp({
 *   root: "#app",
 *   app: () => `<h1>Привет</h1>`,
 *   onInited: ({ container }) => console.log("готово", container),
 * });
 *
 * // Позже, например при HMR/навигации:
 * app.destroy();
 *
 * @example Middleware и очистка
 * const unsubscribe = createApp({
 *   root: "#app",
 *   app: App,
 *   middlewares: [
 *     ({ container }) => {
 *       const onClick = () => console.log("click");
 *       container.addEventListener("click", onClick);
 *
 *       // Вернули cleanup — он будет вызван в destroy().
 *       return () => container.removeEventListener("click", onClick);
 *     },
 *   ],
 * });
 */

/**
 * Содержимое приложения, возвращаемое фабрикой `app`.
 *
 * - `string` — HTML-фрагмент (не полноценный документ с `<html>`/`<head>`);
 *   скрипты из него удаляются перед вставкой.
 * - `Node` — готовый узел DOM (`HTMLElement`, `DocumentFragment` и т.п.),
 *   вставляется как есть.
 */
export type AppContent = string | Node;

/**
 * Функция освобождения ресурсов.
 *
 * Возвращается из middleware или инициализатора компонента. Вызывается
 * в `destroy()` в порядке, обратном инициализации (LIFO).
 */
export type Cleanup = () => void;

/**
 * Контекст, передаваемый во все хуки жизненного цикла.
 */
export type AppContext = {
  /** CSS-селектор, с которым создавалось приложение. */
  root: string;
  /** Найденный корневой элемент, в который отрендерено приложение. */
  container: Element;
};

/**
 * Промежуточный слой, выполняемый после рендера DOM и до `componentInitializers`.
 *
 * Типичные задачи: делегирование событий, подписки на стор, синхронизация
 * состояния с DOM. Возвращённый `Cleanup` будет вызван в `destroy()`.
 */
export type Middleware = (context: AppContext) => void | Cleanup;

/**
 * Инициализатор компонента: связывает разметку с поведением.
 *
 * Выполняется после всех `middlewares`. Возвращённый `Cleanup` будет вызван
 * в `destroy()`.
 */
export type ComponentInitializer = (context: AppContext) => void | Cleanup;

/**
 * Хук жизненного цикла без очистки (для `beforeInited` и `onInited`).
 */
export type InitHook = (context: AppContext) => void;

/**
 * Обработчик ошибок монтирования.
 *
 * Вызывается для ошибок, возникших асинхронно внутри `mount()`, а также для
 * ошибок cleanup-функций в `destroy()`.
 */
export type ErrorHandler = (error: unknown) => void;

/**
 * Опции создания приложения.
 */
export interface AppOptions {
  /**
   * CSS-селектор корневого элемента.
   *
   * Ищется через `document.querySelector` после `DOMContentLoaded`. Если
   * элемент не найден — `mount()` отклоняется с ошибкой.
   */
  root: string;

  /**
   * Фабрика содержимого приложения. Вызывается один раз за монтирование.
   *
   * Возвращает HTML-фрагмент (строка) или готовый DOM-узел.
   */
  app: () => AppContent;

  /**
   * Промежуточные слои, выполняемые после рендера, по порядку объявления.
   *
   * Каждый может вернуть `Cleanup`, который вызовется в `destroy()`.
   */
  middlewares?: Middleware[];

  /**
   * Инициализаторы компонентов, выполняемые после `middlewares`.
   *
   * Каждый может вернуть `Cleanup`, который вызовется в `destroy()`.
   */
  componentInitializers?: ComponentInitializer[];

  /**
   * Вызывается перед рендером, когда root уже найден, но его содержимое ещё
   * не заменено. Удобно для подготовки контейнера или чтения исходной разметки.
   *
   * Если хук бросит исключение, монтирование прервётся с ошибкой.
   */
  beforeInited?: InitHook;

  /**
   * Вызывается после рендера, `middlewares` и `componentInitializers`.
   * Подходит для кода, которому нужен полностью готовый DOM.
   */
  onInited?: InitHook;

  /**
   * Обработчик ошибок монтирования/очистки.
   *
   * По умолчанию ошибки пишутся в `console.error` с префиксом `[createApp]`.
   * Используйте, чтобы показывать ошибки в UI или отправлять в логгер.
   */
  onError?: ErrorHandler;
}

/**
 * Обработчик ошибок по умолчанию.
 *
 * @param error — любое перехваченное значение (обычно `Error`).
 */
const defaultErrorHandler: ErrorHandler = (error) => {
  console.error("[createApp]", error);
};

/**
 * Экземпляр приложения.
 *
 * Создавайте через {@link createApp} — он сразу запускает монтирование.
 * Экземпляр хранит состояние жизненного цикла: контейнер, снимок исходного
 * HTML, стек cleanup-функций и промис монтирования.
 *
 * Повторное монтирование после `destroy()` невозможно: такой экземпляр
 * считается «сгоревшим», создайте новый через {@link createApp}.
 */
export class CreateApp {
  /** CSS-селектор корневого элемента, переданный в опциях. */
  readonly root: string;

  /** Фабрика содержимого; вызывается один раз в {@link render}. */
  private readonly appFactory: () => AppContent;
  /** Middleware в порядке объявления (не мутируется после конструктора). */
  private readonly middlewares: readonly Middleware[];
  /** Инициализаторы компонентов в порядке объявления. */
  private readonly componentInitializers: readonly ComponentInitializer[];
  /** Хук до рендера. */
  private readonly beforeInited?: InitHook;
  /** Хук после полной инициализации. */
  private readonly onInited?: InitHook;
  /** Обработчик ошибок. */
  private readonly onError: ErrorHandler;

  /** Найденный root; `null` до монтирования и после `destroy()`. */
  private container: Element | null = null;
  /** Снимок исходного `innerHTML` root для восстановления в `destroy()`. */
  private originalHTML: string | null = null;
  /** Стек cleanup-функций (LIFO при выполнении). */
  private readonly cleanups: Cleanup[] = [];
  /** Флаг «сгоревшего» экземпляра: после `destroy()` монтирование запрещено. */
  private destroyed = false;
  /** Кэш промиса монтирования, чтобы `mount()` был идемпотентным. */
  private mountPromise: Promise<AppContext> | null = null;

  /**
   * @param options — конфигурация приложения; см. {@link AppOptions}.
   */
  constructor({
    root,
    app,
    middlewares = [],
    componentInitializers = [],
    beforeInited,
    onInited,
    onError,
  }: AppOptions) {
    this.root = root;
    this.appFactory = app;
    this.middlewares = middlewares;
    this.componentInitializers = componentInitializers;
    this.beforeInited = beforeInited;
    this.onInited = onInited;
    this.onError = onError ?? defaultErrorHandler;
  }

  /**
   * `true`, если приложение размонтировано.
   *
   * После `destroy()` экземпляр нельзя монтировать повторно.
   */
  get isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Запускает монтирование и возвращает контекст после `onInited`.
   *
   * Идемпотентен: повторные вызовы возвращают **тот же** промис, поэтому
   * монтирование не выполняется дважды и хуки не дублируются.
   *
   * @returns Промис с {@link AppContext} после успешного монтирования.
   * @throws Отклоняется, если экземпляр уже уничтожен, root не найден или
   * любой из хуков/рендера бросил исключение.
   */
  mount(): Promise<AppContext> {
    if (this.destroyed) {
      return Promise.reject(
        new Error("[createApp] Cannot mount a destroyed app"),
      );
    }

    if (!this.mountPromise) {
      this.mountPromise = this.performMount();
    }

    return this.mountPromise;
  }

  /**
   * Размонтирует приложение.
   *
   * Порядок действий:
   * 1. Помечает экземпляр уничтоженным (повторные вызовы — no-op).
   * 2. Вызывает cleanup-функции в обратном порядке (LIFO), перехватывая
   *    и передавая ошибки в `onError`.
   * 3. Восстанавливает исходный `innerHTML` корневого элемента.
   * 4. Сбрасывает ссылки на контейнер и промис.
   *
   * Если `destroy()` вызван до завершения `mount()`, монтирование прервётся
   * (см. проверку в {@link performMount}).
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    while (this.cleanups.length > 0) {
      const cleanup = this.cleanups.pop();
      try {
        cleanup?.();
      } catch (error) {
        this.onError(error);
      }
    }

    if (this.container && this.originalHTML !== null) {
      this.container.innerHTML = this.originalHTML;
    }

    this.container = null;
    this.originalHTML = null;
    this.mountPromise = null;
  }

  /**
   * Внутренняя реализация монтирования.
   *
   * Выполняет шаги жизненного цикла строго по порядку. Снимок исходного HTML
   * делается **до** `beforeInited`, чтобы `destroy()` мог восстановить root,
   * даже если хук изменит разметку.
   *
   * @returns Промис с контекстом после завершения `onInited`.
   */
  private async performMount(): Promise<AppContext> {
    const container = await this.resolveContainer();

    // `destroy()` мог быть вызван, пока мы ждали DOMContentLoaded.
    if (this.destroyed) {
      throw new Error("[createApp] App was destroyed before mount");
    }

    const context: AppContext = { root: this.root, container };

    this.container = container;
    this.originalHTML = container.innerHTML;

    this.beforeInited?.(context);
    this.render(context);
    this.runHooks(this.middlewares, context);
    this.runHooks(this.componentInitializers, context);
    this.onInited?.(context);

    return context;
  }

  /**
   * Возвращает корневой элемент, при необходимости дождавшись DOM.
   *
   * Ключевой момент: `DOMContentLoaded` мог уже произойти (динамический
   * импорт, SPA-навигация, HMR). Поэтому событие ожидается только при
   * `document.readyState === "loading"`; иначе поиск выполняется сразу.
   *
   * @returns Найденный корневой элемент.
   * @throws Если элемент по селектору не найден.
   */
  private async resolveContainer(): Promise<Element> {
    if (document.readyState === "loading") {
      await new Promise<void>((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), {
          once: true,
        });
      });
    }

    const container = document.querySelector(this.root);

    if (!container) {
      throw new Error(`[createApp] Root element "${this.root}" not found`);
    }

    return container;
  }

  /**
   * Рендерит содержимое в контейнер, полностью заменяя его.
   *
   * Для строк используется `<template>`: разметка разбирается в инертном
   * `DocumentFragment`, что дешевле `DOMParser` и сохраняет `<style>`/`<link>`
   * внутри фрагмента. Теги `<script>` удаляются до вставки — так строковое
   * содержимое не запускает скрипты. Готовый `Node` вставляется без изменений.
   *
   * @param context — контекст с целевым контейнером.
   */
  private render({ container }: AppContext): void {
    const content = this.appFactory();

    if (typeof content === "string") {
      const template = document.createElement("template");
      template.innerHTML = content;
      template.content
        .querySelectorAll("script")
        .forEach((script) => script.remove());
      container.replaceChildren(template.content);
      return;
    }

    container.replaceChildren(content);
  }

  /**
   * Последовательно выполняет хуки и собирает их cleanup-функции.
   *
   * Если хук вернул функцию, она добавляется в общий стек и будет вызвана
   * в {@link destroy} в обратном порядке.
   *
   * @param hooks — список middleware или инициализаторов компонентов.
   * @param context — контекст приложения.
   */
  private runHooks(
    hooks: readonly ((context: AppContext) => void | Cleanup)[],
    context: AppContext,
  ): void {
    for (const hook of hooks) {
      const cleanup = hook(context);

      if (typeof cleanup === "function") {
        this.cleanups.push(cleanup);
      }
    }
  }
}

/**
 * Создаёт приложение и сразу запускает монтирование.
 *
 * Это основной вход в модуль. Возвращает экземпляр синхронно, поэтому
 * вызывающий код может сразу сохранить ссылку и позже вызвать `destroy()`.
 * Асинхронные ошибки монтирования перехватываются и передаются в `onError`
 * (по умолчанию — `console.error`); при ошибке промис не «висит» без
 * обработчика.
 *
 * @param options — конфигурация приложения; см. {@link AppOptions}.
 * @returns Экземпляр {@link CreateApp}.
 *
 * @example
 * const app = createApp({ root: "#app", app: App });
 *
 * // Дождаться готовности (необязательно):
 * app.mount().then(({ container }) => console.log(container));
 *
 * // Освободить ресурсы:
 * app.destroy();
 */
export function createApp(options: AppOptions): CreateApp {
  const app = new CreateApp(options);

  app.mount().catch((error: unknown) => {
    // Если приложение уже уничтожили, ошибка «destroyed before mount» —
    // ожидаемая ситуация, а не повод для onError.
    if (app.isDestroyed) {
      return;
    }

    (options.onError ?? defaultErrorHandler)(error);
  });

  return app;
}
