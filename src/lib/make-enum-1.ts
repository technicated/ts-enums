/* eslint-disable @typescript-eslint/ban-types */

import { HKT, Kind } from './hkt'
import { Incr } from './type-arithmetic'
import { EnumShape } from './types'

type EnumHKTShape = HKT & { type: EnumShape }
type ProtoHKTShape = HKT & { type: object }

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
  A
> = Kind<Enum, A> & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Kind<Proto, A>>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>]
  : never

type EnumCtors<Enum extends EnumHKTShape, Proto extends ProtoHKTShape> = {
  [Case in Enum['type']['case']]: <A>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A>
  ) => Kind<Enum, A>
}

type MakeProtoFn<Enum extends EnumHKTShape, Proto extends ProtoHKTShape> = <A>(
  e: EnumCtors<Enum, Proto>
) => Kind<Proto, A> & ThisType<Kind<Enum, A>>

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
