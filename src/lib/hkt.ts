/**
 * Represents a basic Higher-Kinded Type, which helps abstracting a generic type
 * with one generic parameter.
 *
 * For the purpose of this library you should use it like the following:
 *
 * ```typescript
 * type Maybe<T> =
 *   | Case<'none'>
 *   | Case<'some', T>
 *
 * interface MaybeHKT extends HKT {
 *   // leave the generic parameter of `Maybe` "floating"
 *   readonly type: Maybe<this['_A']>
 * }
 *
 * const Maybe = makeEnum1<MaybeHKT>()
 * ```
 *
 * If you want to use this type for other purposes, also take a look at the
 * `Kind` helper type.
 */
export interface HKT {
  /**
   * The placeholder for the first generic parameter of the generic type.
   */
  readonly _A?: unknown

  /**
   * The placeholder for the generic type.
   */
  readonly type?: unknown
}

/**
 * Represents a Higher-Kinded Type which abstract a generic type with two
 * generic parameters.
 *
 * For the purpose of this library you should use it like the following:
 *
 * ```typescript
 * type Result<Success, Failure> =
 *   | Case<'success', Success>
 *   | Case<'failure', Failure>
 *
 * interface ResultHKT extends HKT2 {
 *   // leave the generic parameters of `Result` "floating"
 *   readonly type: Maybe<this['_A'], this['_B']>
 * }
 *
 * const Result = makeEnum2<ResultHKT>()
 * ```
 *
 * If you want to use this type for other purposes, also take a look at the
 * `Kind2` helper type.
 */
export interface HKT2 extends HKT {
  /**
   * The placeholder for the second generic parameter of the generic type.
   */
  readonly _B?: unknown
}

/**
 * Represents a Higher-Kinded Type which abstract a generic type with three
 * generic parameters.
 *
 * See `HKT` and `HKT2` for more information.
 */
export interface HKT3 extends HKT2 {
  /**
   * The placeholder for the third generic parameter of the generic type.
   */
  readonly _C?: unknown
}

/**
 * Represents a Higher-Kinded Type which abstract a generic type with four
 * generic parameters.
 *
 * See `HKT` and `HKT2` for more information.
 */
export interface HKT4 extends HKT3 {
  /**
   * The placeholder for the fourth generic parameter of the generic type.
   */
  readonly _D?: unknown
}

/**
 * Represents a Higher-Kinded Type which abstract a generic type with five
 * generic parameters.
 *
 * See `HKT` and `HKT2` for more information.
 */
export interface HKT5 extends HKT4 {
  /**
   * The placeholder for the fifth generic parameter of the generic type.
   */
  readonly _E?: unknown
}

/**
 * Represents a Higher-Kinded Type which abstract a generic type with six
 * generic parameters.
 *
 * See `HKT` and `HKT2` for more information.
 */
export interface HKT6 extends HKT5 {
  /**
   * The placeholder for the sixth generic parameter of the generic type.
   */
  readonly _F?: unknown
}

/**
 * Type alias for the reification of an `HKT`, given a concrete type for its
 * generic parameter.
 *
 * ```typescript
 * type Maybe<T> =
 *   | Case<'none'>
 *   | Case<'some', T>
 *
 * interface MaybeHKT extends HKT {
 *   readonly type: Maybe<this['_A']>
 * }
 *
 * type MaybeOfNumber = Kind<MaybeHKT, number>
 * // Equivalent to `Maybe<number>`
 * ```
 *
 * @param T A type extending `HKT`.
 * @param A A type representing the first type parameter for `T`.
 *
 * @returns The reification of the generic type inside `T`, using the generic
 *          parameter `A`.
 */
export type Kind<T extends HKT, A> = (T & { _A: A })['type']

/**
 * Type alias for the reification of an `HKT`, given a concrete type for its
 * generic parameter.
 *
 * ```typescript
 * type Result<Success, Failure> =
 *   | Case<'success', Success>
 *   | Case<'failure', Failure>
 *
 * interface ResultHKT extends HKT2 {
 *   readonly type: Result<this['_A'], this['_B']>
 * }
 *
 * type ResultOfNumberAndString = Kind2<ResultHKT, number, string>
 * // Equivalent to `Result<number, string>`
 * ```
 *
 * @param T A type extending `HKT2`.
 * @param A A type representing the first type parameter for `T`.
 * @param B A type representing the second type parameter for `T`.
 *
 * @returns The reification of the generic type inside `T`, using the generic
 *          parameters `A` and `B`.
 */
export type Kind2<T extends HKT2, A, B> = (T & { _A: A; _B: B })['type']

/**
 * Type alias for the reification of an `HKT3`, given a concrete type for its
 * generic parameters.
 *
 * See `Kind` and `Kind2` for more information.
 *
 * @param T A type extending `HKT3`.
 * @param A A type representing the first type parameter for `T`.
 * @param B A type representing the second type parameter for `T`.
 * @param C A type representing the third type parameter for `T`.
 *
 * @returns The reification of the generic type inside `T`, using the generic
 *          parameters `A`, `B` and `C`.
 */
export type Kind3<T extends HKT3, A, B, C> = (T & {
  _A: A
  _B: B
  _C: C
})['type']

/**
 * Type alias for the reification of an `HKT4`, given a concrete type for its
 * generic parameters.
 *
 * See `Kind` and `Kind2` for more information.
 *
 * @param T A type extending `HKT4`.
 * @param A A type representing the first type parameter for `T`.
 * @param B A type representing the second type parameter for `T`.
 * @param C A type representing the third type parameter for `T`.
 * @param D A type representing the fourth type parameter for `T`.
 *
 * @returns The reification of the generic type inside `T`, using the generic
 *          parameters `A`, `B`, `C` and `D`.
 */
export type Kind4<T extends HKT4, A, B, C, D> = (T & {
  _A: A
  _B: B
  _C: C
  _D: D
})['type']

/**
 * Type alias for the reification of an `HKT5`, given a concrete type for its
 * generic parameters.
 *
 * See `Kind` and `Kind2` for more information.
 *
 * @param T A type extending `HKT5`.
 * @param A A type representing the first type parameter for `T`.
 * @param B A type representing the second type parameter for `T`.
 * @param C A type representing the third type parameter for `T`.
 * @param D A type representing the fourth type parameter for `T`.
 * @param E A type representing the fifth type parameter for `T`.
 *
 * @returns The reification of the generic type inside `T`, using the generic
 *          parameters `A`, `B`, `C`, `D` and `E`.
 */
export type Kind5<T extends HKT5, A, B, C, D, E> = (T & {
  _A: A
  _B: B
  _C: C
  _D: D
  _E: E
})['type']

/**
 * Type alias for the reification of an `HKT6`, given a concrete type for its
 * generic parameters.
 *
 * See `Kind` and `Kind2` for more information.
 *
 * @param T A type extending `HKT6`.
 * @param A A type representing the first type parameter for `T`.
 * @param B A type representing the second type parameter for `T`.
 * @param C A type representing the third type parameter for `T`.
 * @param D A type representing the fourth type parameter for `T`.
 * @param E A type representing the fifth type parameter for `T`.
 * @param F A type representing the sixth type parameter for `T`.
 *
 * @returns The reification of the generic type inside `T`, using the generic
 *          parameters `A`, `B`, `C`, `D`, `E` and `F`.
 */
export type Kind6<T extends HKT6, A, B, C, D, E, F> = (T & {
  _A: A
  _B: B
  _C: C
  _D: D
  _E: E
  _F: F
})['type']
