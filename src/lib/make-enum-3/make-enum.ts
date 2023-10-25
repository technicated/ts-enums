import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape, EnumType extends object = never>(
    ...args: MakeEnumFnArgs<Enum, EnumType>
  ): [EnumType] extends [never] ? EnumCtors<Enum> : EnumType & EnumCtors<Enum>
}

/**
 * Create a generic enum with three generic parameters given a specific shape and
 * an optional definition.
 *
 * This is the third generic variant of the `makeEnum` family of functions of
 * the `ts-enums` library, creating enums with three generic parameter. You must
 * supply at least one generic parameter to it, representing your enum type
 * definition (cases + optional prototype), and an optional second generic
 * parameter representing other static properties and methods.
 *
 * You need to define a small helper type extending from the `HKT` family of
 * types when declaring a generic enum. This is needed in order to let
 * TypeScript defer the resolution of generic parameters until the instantiation
 * of the enum.
 *
 * The `makeEnum3` function automatically detects the "flavour" of your enum and
 * asks you to supply the prototype and / or the type implementation when
 * needed.
 *
 * There are some conventions when declaring and using an enum, so please refer
 * to the README for further information.
 *
 * See the documentation of `makeEnum`, `makeEnum1` and `makeEnum2` for examples
 * on how to use this function.
 * ```
 */
export const makeEnum3 = base.makeEnum as MakeEnumFn
