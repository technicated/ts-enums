/* eslint-disable @typescript-eslint/ban-types */

import { HKT3, Kind3 } from './hkt'
import { Incr } from './type-arithmetic'
import { EnumShape } from './types'

type EnumHKTShape = HKT3 & { type: EnumShape }
type ProtoHKTShape = HKT3 & { type: object }

type RecursiveCtorArgs<
  Obj extends object,
  Index extends number = 0
> = Obj extends Record<Index, infer V>
  ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
  : []

type EnumCtorArgs<
  Enum extends EnumHKTShape,
  Case extends Enum['type']['case'],
  Proto extends ProtoHKTShape,
  A,
  B,
  C
> = Kind3<Enum, A, B, C> & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Kind3<Proto, A, B, C>>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind3<Proto, A, B, C>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Kind3<Proto, A, B, C>>]
  : never

type EnumCtors<Enum extends EnumHKTShape, Proto extends ProtoHKTShape> = {
  [Case in Enum['type']['case']]: <A, B, C>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A, B, C>
  ) => Kind3<Enum, A, B, C>
}

type MakeProtoFn<Enum extends EnumHKTShape, Proto extends ProtoHKTShape> = <
  A,
  B,
  C
>(
  e: EnumCtors<Enum, Proto>
) => Kind3<Proto, A, B, C> & ThisType<Kind3<Enum, A, B, C>>

export function makeEnum<Enum extends EnumHKTShape>(): EnumCtors<
  Enum,
  { type: {} }
>
export function makeEnum<
  Enum extends EnumHKTShape,
  Proto extends ProtoHKTShape
>(makeProto: MakeProtoFn<Enum, Proto>): EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends EnumHKTShape,
  Proto extends ProtoHKTShape,
  Type extends object
>(
  makeProto: MakeProtoFn<Enum, Proto>,
  type: Type
): Type & EnumCtors<Enum, Proto>
export function makeEnum<Enum extends EnumHKTShape, Type extends object>(
  type: Type
): Type & EnumCtors<Enum, { type: {} }>
export function makeEnum<
  Enum extends EnumHKTShape,
  Proto extends ProtoHKTShape,
  Type extends object
>(
  makeProto?: MakeProtoFn<Enum, Proto> | Type,
  type?: Type
): Type & EnumCtors<Enum, Proto> {
  const protoWrapper: { proto: object } = { proto: {} }

  const actualMakeProto = typeof makeProto === 'object' ? undefined : makeProto
  const actualType = typeof makeProto === 'object' ? makeProto : type

  const proxy = new Proxy(actualType || {}, {
    get(type: Record<string | symbol, unknown>, prop) {
      if (prop in type) {
        return type[prop]
      }

      return (payload: object) =>
        Object.setPrototypeOf(
          Object.defineProperty({ ...payload }, 'case', {
            configurable: false,
            enumerable: true,
            value: prop,
            writable: false,
          }),
          protoWrapper.proto
        )
    },
  }) as Type & EnumCtors<Enum, Proto>

  protoWrapper.proto = actualMakeProto ? actualMakeProto(proxy) : {}
  return proxy
}
