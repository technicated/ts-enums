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

export type CaseName<Name extends string> = { readonly case: Name }

export type Case<Name extends string, Payload = Unit> = CaseName<Name> & {
  readonly p: Payload
}

export const cases: unique symbol = Symbol('ts-enums: Enum cases list')

export type Cast<Enum extends EnumShape, C extends Enum['case']> = Enum &
  CaseName<C>

export type Choice<Name extends string, Payload = never> = [Payload] extends [
  never
]
  ? CaseName<Name>
  : CaseName<Name> & { readonly p: Payload }
