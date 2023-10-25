import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape, EnumType extends object = never>(
    ...args: MakeEnumFnArgs<Enum, EnumType>
  ): [EnumType] extends [never] ? EnumCtors<Enum> : EnumType & EnumCtors<Enum>
}

/**
 * Create a generic enum with one generic parameter given a specific shape and
 * an optional definition.
 *
 * This is the first generic variant of the `makeEnum` family of functions of
 * the `ts-enums` library, creating enums which are not generic. You must supply
 * at least one generic parameter to it, representing your enum type definition
 * (cases + optional prototype), and an optional second generic parameter
 * representing other static properties and methods.
 *
 * You need to define a small helper type extending from the `HKT` family of
 * types when declaring a generic enum. This is needed in order to let
 * TypeScript defer the resolution of generic parameters until the instantiation
 * of the enum.
 *
 * The `makeEnum1` function automatically detects the "flavour" of your enum and
 * asks you to supply the prototype and / or the type implementation when
 * needed.
 *
 * There are some conventions when declaring and using an enum, so please refer
 * to the README for further information.
 *
 * You use the `makeEnum1` function like the following:
 *
 * ```typescript
 * // Enum with no prototype and no statics
 *
 * type Maybe<T> =
 *   | Case<'none'>
 *   | Case<'some', T>
 *
 * interface MaybeHKT extends HKT {
 *   readonly type Maybe<this['_A']>
 * }
 *
 * const Maybe = makeEnum1<MaybeHKT>()
 *
 * var m = Maybe.some(42)
 * m = Maybe.none()
 *
 * // Enum with prototype and no statics
 *
 * interface MaybeProto<T> {
 *   map<U>(transform: (value: T) => U): Maybe<U>
 * }
 *
 * type Maybe<T> = MaybeProto<T> & (
 *   | Case<'none'>
 *   | Case<'some', T>
 * )
 *
 * interface MaybeHKT extends HKT {
 *   readonly type Maybe<this['_A']>
 * }
 *
 * const Maybe = makeEnum1<MaybeHKT>({
 *   makeProto: (Maybe) => ({
 *     map(transform) {
 *       switch (this.case) {
 *         case 'none': return Maybe.none()
 *         case 'some': return Maybe.some(transform(this.p))
 *       }
 *     },
 *   }),
 * })
 *
 * var m = Maybe.some(42)
 * console.log(m.map((n) => n ** 2)) // 'some' and contains 1764
 * m = Maybe.none()
 * console.log(m.map((n) => n ** 2)) // 'none' and arrow function not executed
 *
 * // Enum with no prototype and statics
 *
 * interface MaybeType {
 *   fromValue<T>(value: T): Maybe<NonNullable<T>>
 * }
 *
 * type Maybe =
 *   | Case<'none'>
 *   | Case<'some', T>
 *
 * interface MaybeHKT extends HKT {
 *   readonly type Maybe<this['_A']>
 * }
 *
 * const Maybe = makeEnum1<MaybeHKT, MaybeType>({
 *   makeType: (Maybe) => ({
 *     fromValue(value) {
 *       return value !== null && value !== undefined
 *         ? Maybe.some(value)
 *         : Maybe.none()
 *     },
 *   }),
 * })
 *
 * var m = Maybe.fromValue(42)
 * console.log(m) // 'some' which contains 42
 * m = Maybe.fromValue(undefined)
 * console.log(m) // 'none'
 *
 * // Enum with prototype and statics
 *
 * interface MaybeType {
 *   fromValue<T>(value: T): Maybe<NonNullable<T>>
 * }
 *
 * interface MaybeProto<T> {
 *   map<U>(transform: (value: T) => U): Maybe<U>
 * }
 *
 * type Maybe<T> = MaybeProto<T> & (
 *   | Case<'none'>
 *   | Case<'some', T>
 * )
 *
 * interface MaybeHKT extends HKT {
 *   readonly type Maybe<this['_A']>
 * }
 *
 * const Maybe = makeEnum1<MaybeHKT, MaybeType>({
 *   makeProto: (Maybe) => ({
 *     map(transform) {
 *       switch (this.case) {
 *         case 'none': return Maybe.none()
 *         case 'some': return Maybe.some(transform(this.p))
 *       }
 *     },
 *   }),
 *   makeType: (Maybe) => ({
 *     fromValue(value) {
 *       return value !== null && value !== undefined
 *         ? Maybe.some(value)
 *         : Maybe.none()
 *     },
 *   }),
 * })
 *
 * var m = Maybe.fromValue(42)
 * console.log(m.map((n) => n ** 2)) // 'some' and contains 1764
 * m = Maybe.fromValue(undefined)
 * console.log(m.map((n) => n ** 2)) // 'none' and arrow function not executed
 * ```
 */
export const makeEnum1 = base.makeEnum as MakeEnumFn
