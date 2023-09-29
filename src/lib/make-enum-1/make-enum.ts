import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <E extends EnumShape>(...args: MakeEnumFnArgs<E>): EnumCtors<E>

  <E extends EnumShape, Type extends object>(
    ...args: MakeEnumFnArgs<E, Type>
  ): Type & EnumCtors<E>
}

export const makeEnum = base.makeEnum as MakeEnumFn

// /* eslint-disable @typescript-eslint/ban-types */
//
// import * as base from '../make-enum'
// import { EnumCtors, EnumShape, MakeProtoFn, ProtoShape } from './types'
//
// interface MakeEnumFn {
//   <Enum extends EnumShape>(): EnumCtors<Enum, { type: {} }>
//   <Enum extends EnumShape, Proto extends ProtoShape>(
//     makeProto: MakeProtoFn<Enum, Proto>
//   ): EnumCtors<Enum, Proto>
//   <Enum extends EnumShape, Proto extends ProtoShape, Type extends object>(
//     makeProto: MakeProtoFn<Enum, Proto>,
//     type: Type
//   ): Type & EnumCtors<Enum, Proto>
//   <Enum extends EnumShape, Type extends object>(type: Type): Type &
//     EnumCtors<Enum, { type: {} }>
// }
//
// export const makeEnum1 = base.makeEnum as MakeEnumFn
