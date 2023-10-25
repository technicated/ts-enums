import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape, EnumType extends object = never>(
    ...args: MakeEnumFnArgs<Enum, EnumType>
  ): [EnumType] extends [never] ? EnumCtors<Enum> : EnumType & EnumCtors<Enum>
}

/**
 * Create a generic enum with two generic parameter given a specific shape and
 * an optional definition.
 *
 * This is the second generic variant of the `makeEnum` family of functions of
 * the `ts-enums` library, creating enums with two generic parameter. You must
 * supply at least one generic parameter to it, representing your enum type
 * definition (cases + optional prototype), and an optional second generic
 * parameter representing other static properties and methods.
 *
 * You need to define a small helper type extending from the `HKT` family of
 * types when declaring a generic enum. This is needed in order to let
 * TypeScript defer the resolution of generic parameters until the instantiation
 * of the enum.
 *
 * The `makeEnum2` function automatically detects the "flavour" of your enum and
 * asks you to supply the prototype and / or the type implementation when
 * needed.
 *
 * There are some conventions when declaring and using an enum, so please refer
 * to the README for further information.
 *
 * You use the `makeEnum2` function like the following:
 *
 * ```typescript
 * // Enum with no prototype and no statics
 *
 * type Result<Success, Failure> =
 *   | Case<'success', Success>
 *   | Case<'failure', Failure>
 *
 * interface ResultHKT extends HKT2 {
 *   readonly type Result<this['_A'], this['_B']>
 * }
 *
 * const Result = makeEnum2<ResultHKT>()
 *
 * var r = Result.success({ value: 42 })
 * r = Result.failure('No number found')
 *
 * // Enum with prototype and no statics
 *
 * interface ResultProto<Success, Failure> {
 *   tryGet(defaultValue: () => Success): Success
 * }
 *
 * type Result<Success, Failure> = ResultProto<Success, Failure> & (
 *   | Case<'success', Success>
 *   | Case<'failure', Failure>
 * )
 *
 * interface ResultHKT extends HKT2 {
 *   readonly type Result<this['_A'], this['_B']>
 * }
 *
 * const Result = makeEnum2<ResultHKT>({
 *   makeProto: () => ({
 *     tryGet(defaultValue) {
 *       switch (this.case) {
 *         case 'success': return this.p
 *         case 'failure': return defaultValue()
 *       }
 *     },
 *   }),
 * })
 *
 * var r = Result.success({ value: 42 })
 * console.log(r.tryGet({ value: -1 }) // prints { value: 42 }
 * r = Result.failure('No number found')
 * console.log(r.tryGet({ value: -1 }) // prints { value: -1 }
 *
 * // Enum with no prototype and statics
 *
 * interface ResultType {
 *   fromOperation<Success>(
 *     operation: () => Success
 *   ): Result<Success, { error: unknown }>
 * }
 *
 * type Result =
 *   | Case<'success', Success>
 *   | Case<'failure', Failure>
 *
 * interface ResultHKT extends HKT2 {
 *   readonly type Result<this['_A'], this['_B']>
 * }
 *
 * const Result = makeEnum2<ResultHKT, ResultType>({
 *   makeType: (Result) => ({
 *     fromOperation(operation) {
 *       try {
 *         return Result.success(operation())
 *       } catch (error) {
 *         return Result.failure({ error })
 *       }
 *     },
 *   }),
 * })
 *
 * var r = Result.fromOperation(() => 42)
 * console.log(r) // 'success' which contains 42
 * r = Result.fromOperation(() => { throw new Error('some reason') })
 * console.log(r) // 'failure' which contains Error('some reason')
 *
 * // Enum with prototype and statics
 *
 * interface ResultType {
 *   fromOperation<Success>(
 *     operation: () => Success
 *   ): Result<Success, { error: unknown }>
 * }
 *
 * interface ResultProto<Success, Failure> {
 *   tryGet(defaultValue: () => Success): Success
 * }
 *
 * type Result<Success, Failure> = ResultProto<Success, Failure> & (
 *   | Case<'success', Success>
 *   | Case<'failure', Failure>
 * )
 *
 * interface ResultHKT extends HKT2 {
 *   readonly type Result<this['_A'], this['_B']>
 * }
 *
 * const Result = makeEnum2<ResultHKT, ResultType>({
 *   makeProto: () => ({
 *     tryGet(defaultValue) {
 *       switch (this.case) {
 *         case 'success': return this.p
 *         case 'failure': return defaultValue()
 *       }
 *     },
 *   }),
 *   makeType: (Result) => ({
 *     fromOperation(operation) {
 *       try {
 *         return Result.success(operation())
 *       } catch (error) {
 *         return Result.failure({ error })
 *       }
 *     },
 *   }),
 * })
 *
 * var r = Result.fromOperation(() => 42)
 * console.log(r.tryGet(-1)) // 'success' which contains 42
 * r = Result.fromOperation(() => { throw new Error('some reason') })
 * console.log(r.tryGet(-1)) // 'success' which contains -1
 * ```
 */
export const makeEnum2 = base.makeEnum as MakeEnumFn
