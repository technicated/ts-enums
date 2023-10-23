import { Unit } from './unit'

/**
 * An interface defining the basic shape of an enum instance, consisting of the
 * properties `case` and `p`.
 *
 * Use this type to constrain generic types or functions to accept instances of
 * enums, like in the following example:
 *
 * ```typescript
 * function performIfMatch<E extends EnumShape, C extends E['case']>(
 *   enumValue: E,
 *   enumCase: C,
 *   operation: (value: Cast<E, C>['p']) => void
 * ): boolean { ... }
 *
 * type NumberOrString = Case<'number', number> | Case<'string', string>
 * const NumberOrString = makeEnum<NumberOrString>()
 *
 * // will return `true`
 * performIfMatch(NumberOrString.number(42), 'number', (val) => {
 *   // val is of type `number`
 * })
 *
 * // will return `false`
 * performIfMatch(NumberOrString.number(42), 'string', (val) => {
 *   // val is of type `string`
 * })
 * ```
 */
export interface EnumShape {
  readonly case: string
  readonly p: unknown
}

/**
 * Ah helper type to represent the name of a case as this library dictates.
 */
export type CaseName<Name extends string> = { readonly case: Name }

/**
 * The definition of a case of an enum. Consists of the case name and of an
 * optional payload, which defaults to `unit` if omitted.
 *
 * You combine multiple instantiations of this helper type to create a complete
 * enum type, like in the following example:
 *
 * ```typescript
 * type MyEnum =
 *   | Case<'noPayload'>
 *   | Case<'basicPayload', number>
 *   | Case<'arrayPayload', string[]>
 *   | Case<'objectPayload', { name: string }>
 *
 * type Colors =
 *   | Case<'red'>
 *   | Case<'green'>
 *   | Case<'blue'>
 *
 * type Maybe<T> =
 *   | Case<'none'>
 *   | Case<'some', T>
 *
 * type List<A> =
 *   | Case<'cons', { head: A, tail: List<A> }>
 *   | Case<'empty'>
 * ```
 */
export type Case<Name extends string, Payload = Unit> = CaseName<Name> & {
  readonly p: Payload
}

/**
 * A symbol that can be used to index an enum type to obtain its cases.
 *
 * ```typescript
 * type Colors =
 *   | Case<'red'>
 *   | Case<'green'>
 *   | Case<'blue'>
 *
 * const Colors = makeEnum<Colors>()
 * const casesOfColors = Colors[cases]
 * // casesOfColors has properties 'red', 'green' and 'blue' of types,
 * // respectively, 'red', 'green' and 'blue', all are constant strings
 * console.log(casesOfColors.red) // autocompleted, and prints "red"
 * ```
 */
export const cases: unique symbol = Symbol('ts-enums: Enum cases list')

/**
 * Manually narrow an enum type to one of its cases.
 *
 * Can be useful in generic contexts to restrict the parameters / return type of
 * functions and methods, like in the following example:
 *
 * ```typescript
 * function tryExtract<E extends EnumShape, C extends E['case']>(
 *   e: E,
 *   c: C,
 *   defaultValue: Cast<E, C>['p']
 * ): Cast<E, C>['p'] {
 *   return e.case === c ? e.p : defaultValue
 * }
 * ```
 */
export type Cast<Enum extends EnumShape, C extends Enum['case']> = Enum &
  CaseName<C>

/**
 * An helper type that works almost like `Case`, but does not include the
 * default `unit` payload if one is not supplied.
 *
 * You msut never use this type to declare an enum, but should only use it when
 * creating shape-only enums, like you do with interfaces for basic behaviorless
 * objects.
 *
 * ```typescript
 * interface WebSocketConfig {
 *   name?: string
 *   ttl?: number
 *   url: string
 * }
 *
 * type ExtraWebsocketConfig =
 *   | Choice<'plain'>
 *   | Choice<'simple', SimpleExtraConfig>
 *   | Choice<'complex', ComplexExtraConfig>
 *
 * class WebSocket {
 *   static #id: number = 0
 *
 *   readonly #resource: WebSocketStream
 *
 *   public readonly name: string
 *   public readonly ttl: number
 *
 *   constructor(config: WebSocketConfig, extraConfig: ExtraWebsocketConfig) {
 *     this.#resource = new WebSocketStream(config.url)
 *     this.name = config.name || `Socket ${WebSocket.#id++}`
 *     this.ttl = config.ttl || 1234
 *
 *     switch (extraConfig.case) {
 *       case 'plain':
 *         break
 *       case 'simple':
 *         this.simpleConfiguration(extraConfig.p.prop1, extraConfig.p.prop2)
 *         break
 *       case 'complex':
 *         this.complexConfiguration(extraConfig.p)
 *         break
 *     }
 *   }
 * }
 *
 * const socket = new WebSocket({ url: '...' }, { case: 'plain' })
 * // no need for `p` here!  ~~~~~~~~~~~~~~~~~~ ^
 * ```
 */
export type Choice<Name extends string, Payload = never> = [Payload] extends [
  never
]
  ? CaseName<Name>
  : CaseName<Name> & { readonly p: Payload }
