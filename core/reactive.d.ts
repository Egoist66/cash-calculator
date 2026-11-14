/**
 * Типы для `reactive.js` — реактивного хранилища состояния.
 */

/** Опции хранилища. */
export interface ReactiveStoreOptions {
  /**
   * Глубокая реактивность: запись во вложенные объекты
   * (`store.user.name = ...`) тоже уведомляет подписчиков корневого свойства.
   * По умолчанию `false`.
   */
  deep?: boolean;
}

/** Колбэк, получающий новое значение свойства. */
export type SubscriberCallback<T> = (value: T) => void;

/** Функция отписки, возвращаемая `subscribe`. */
export type UnsubscribeFn = () => void;

/** Дополнительные методы хранилища, добавляемые к исходному объекту. */
export interface ReactiveStore<T extends object = Record<string, unknown>> {
  /** Подписаться на изменения свойства. Возвращает функцию отписки. */
  subscribe<K extends keyof T>(
    prop: K,
    callback: SubscriberCallback<T[K]>,
  ): UnsubscribeFn;
  /** Подписаться на изменение произвольного свойства по строковому имени. */
  subscribe(
    prop: string,
    callback: SubscriberCallback<T[keyof T]>,
  ): UnsubscribeFn;
}

/** Прокси-хранилище: исходное состояние плюс `subscribe`. */
export type ReactiveState<T extends object> = T & ReactiveStore<T>;

/**
 * Создаёт реактивное хранилище с возможностью подписки на изменения свойств.
 *
 * @param initialState начальное состояние (мутируется через прокси).
 * @param options опции хранилища (`deep`).
 * @returns прокси-объект состояния с методом `subscribe`.
 *
 * @example
 * const store = reactive({ count: 0 });
 * const off = store.subscribe("count", (value) => console.log(value));
 * store.count = 1; // вызовет колбэк
 * off();
 *
 * @example
 * const store = reactive({ user: { name: "Анна" } }, { deep: true });
 * store.subscribe("user", (user) => console.log(user));
 * store.user.name = "Иван"; // вызовет колбэк (глубокая реактивность)
 */
export function reactive<T extends object>(
  initialState: T,
  options?: ReactiveStoreOptions,
): ReactiveState<T>;
