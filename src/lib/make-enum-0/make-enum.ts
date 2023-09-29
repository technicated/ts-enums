/* eslint-disable @typescript-eslint/ban-types */

import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeProtoFn, ProtoShape } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape>(): EnumCtors<Enum, {}>
  <Enum extends EnumShape, Proto extends ProtoShape>(
    makeProto: MakeProtoFn<Enum, Proto>
  ): EnumCtors<Enum, Proto>
  <Enum extends EnumShape, Proto extends ProtoShape, Type extends object>(
    makeProto: MakeProtoFn<Enum, Proto>,
    type: Type
  ): Type & EnumCtors<Enum, Proto>
  <Enum extends EnumShape, Type extends object>(type: Type): Type &
    EnumCtors<Enum, {}>
}

export const makeEnum = base.makeEnum as MakeEnumFn
