/* eslint-disable @typescript-eslint/ban-types */

import { Incr } from './type-arithmetic'
import { EnumShape } from './types'

type RecursiveCtorArgs<
  Obj extends object,
  Index extends number = 0
> = Obj extends Record<Index, infer V>
  ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
  : []

type EnumCtorArgs<
  Enum extends EnumShape,
  Case extends Enum['case'],
  Proto extends object
> = Enum & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Proto>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Proto>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Proto>]
  : never

type EnumCtors<Enum extends EnumShape, Proto extends object> = {
  [Case in Enum['case']]: (...args: EnumCtorArgs<Enum, Case, Proto>) => Enum
}

type MakeProtoFn<Enum extends EnumShape, Proto extends object> = (
  e: EnumCtors<Enum, Proto>
) => Proto & ThisType<Enum>

export function makeEnum<Enum extends EnumShape>(): EnumCtors<Enum, {}>
export function makeEnum<Enum extends EnumShape, Proto extends object>(
  makeProto: MakeProtoFn<Enum, Proto>
): EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends EnumShape,
  Proto extends object,
  Type extends object
>(
  makeProto: MakeProtoFn<Enum, Proto>,
  type: Type
): Type & EnumCtors<Enum, Proto>
export function makeEnum<Enum extends EnumShape, Type extends object>(
  type: Type
): Type & EnumCtors<Enum, {}>
export function makeEnum<
  Enum extends EnumShape,
  Proto extends object,
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
