/* eslint-disable @typescript-eslint/ban-types */

import * as types from './types'
import * as typesHKT from './types-hkt'
import * as typesHKT2 from './types-hkt-2'
import * as typesHKT3 from './types-hkt-3'
import * as typesHKT4 from './types-hkt-4'
import * as typesHKT5 from './types-hkt-5'
import * as typesHKT6 from './types-hkt-6'

// ----------  non-generic  ----------------------------------------------------
export function makeEnum<Enum extends types.EnumShape>(): types.EnumCtors<
  Enum,
  {}
>
export function makeEnum<Enum extends types.EnumShape, Proto extends object>(
  makeProto: types.MakeProtoFn<Enum, Proto>
): types.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends types.EnumShape,
  Proto extends object,
  Type extends object
>(
  makeProto: types.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & types.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends types.EnumShape, Type extends object>(
  type: Type
): Type & types.EnumCtors<Enum, {}>
// ----------  HKT  ------------------------------------------------------------
export function makeEnum<Enum extends typesHKT.EnumShape>(): typesHKT.EnumCtors<
  Enum,
  { type: {} }
>
export function makeEnum<
  Enum extends typesHKT.EnumShape,
  Proto extends typesHKT.ProtoShape
>(makeProto: typesHKT.MakeProtoFn<Enum, Proto>): typesHKT.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends typesHKT.EnumShape,
  Proto extends typesHKT.ProtoShape,
  Type extends object
>(
  makeProto: typesHKT.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & typesHKT.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends typesHKT.EnumShape, Type extends object>(
  type: Type
): Type & typesHKT.EnumCtors<Enum, { type: {} }>
// ----------  HKT 2  ----------------------------------------------------------
export function makeEnum<
  Enum extends typesHKT2.EnumShape
>(): typesHKT2.EnumCtors<Enum, { type: {} }>
export function makeEnum<
  Enum extends typesHKT2.EnumShape,
  Proto extends typesHKT2.ProtoShape
>(
  makeProto: typesHKT2.MakeProtoFn<Enum, Proto>
): typesHKT2.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends typesHKT2.EnumShape,
  Proto extends typesHKT2.ProtoShape,
  Type extends object
>(
  makeProto: typesHKT2.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & typesHKT2.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends typesHKT2.EnumShape, Type extends object>(
  type: Type
): Type & typesHKT2.EnumCtors<Enum, { type: {} }>
// ----------  HKT 3  ----------------------------------------------------------
export function makeEnum<
  Enum extends typesHKT3.EnumShape
>(): typesHKT3.EnumCtors<Enum, { type: {} }>
export function makeEnum<
  Enum extends typesHKT3.EnumShape,
  Proto extends typesHKT3.ProtoShape
>(
  makeProto: typesHKT3.MakeProtoFn<Enum, Proto>
): typesHKT3.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends typesHKT3.EnumShape,
  Proto extends typesHKT3.ProtoShape,
  Type extends object
>(
  makeProto: typesHKT3.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & typesHKT3.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends typesHKT3.EnumShape, Type extends object>(
  type: Type
): Type & typesHKT3.EnumCtors<Enum, { type: {} }>
// ----------  HKT 4  ----------------------------------------------------------
export function makeEnum<
  Enum extends typesHKT4.EnumShape
>(): typesHKT4.EnumCtors<Enum, { type: {} }>
export function makeEnum<
  Enum extends typesHKT4.EnumShape,
  Proto extends typesHKT4.ProtoShape
>(
  makeProto: typesHKT4.MakeProtoFn<Enum, Proto>
): typesHKT4.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends typesHKT4.EnumShape,
  Proto extends typesHKT4.ProtoShape,
  Type extends object
>(
  makeProto: typesHKT4.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & typesHKT4.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends typesHKT4.EnumShape, Type extends object>(
  type: Type
): Type & typesHKT4.EnumCtors<Enum, { type: {} }>
// ----------  HKT 5  ----------------------------------------------------------
export function makeEnum<
  Enum extends typesHKT5.EnumShape
>(): typesHKT5.EnumCtors<Enum, { type: {} }>
export function makeEnum<
  Enum extends typesHKT5.EnumShape,
  Proto extends typesHKT5.ProtoShape
>(
  makeProto: typesHKT5.MakeProtoFn<Enum, Proto>
): typesHKT5.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends typesHKT5.EnumShape,
  Proto extends typesHKT5.ProtoShape,
  Type extends object
>(
  makeProto: typesHKT5.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & typesHKT5.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends typesHKT5.EnumShape, Type extends object>(
  type: Type
): Type & typesHKT5.EnumCtors<Enum, { type: {} }>
// ----------  HKT 6  ----------------------------------------------------------
export function makeEnum<
  Enum extends typesHKT6.EnumShape
>(): typesHKT6.EnumCtors<Enum, { type: {} }>
export function makeEnum<
  Enum extends typesHKT6.EnumShape,
  Proto extends typesHKT6.ProtoShape
>(
  makeProto: typesHKT6.MakeProtoFn<Enum, Proto>
): typesHKT6.EnumCtors<Enum, Proto>
export function makeEnum<
  Enum extends typesHKT6.EnumShape,
  Proto extends typesHKT6.ProtoShape,
  Type extends object
>(
  makeProto: typesHKT6.MakeProtoFn<Enum, Proto>,
  type: Type
): Type & typesHKT6.EnumCtors<Enum, Proto>
export function makeEnum<Enum extends typesHKT6.EnumShape, Type extends object>(
  type: Type
): Type & typesHKT6.EnumCtors<Enum, { type: {} }>
// ----------  implementation  -------------------------------------------------
export function makeEnum(makeProto?: unknown, type?: unknown): unknown {
  const protoWrapper: { proto: object } = { proto: {} }

  const actualMakeProto = (
    typeof makeProto === 'object' ? undefined : makeProto
  ) as Function | undefined
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
  })

  protoWrapper.proto = actualMakeProto ? actualMakeProto(proxy) : {}
  return proxy
}
