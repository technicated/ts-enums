/* eslint-disable @typescript-eslint/ban-types */

import { Case } from '../case'
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

export class CasePath<Root, Value> {
  constructor(
    public readonly extract: (
      root: Root
    ) => Case<'none'> | Case<'some', { value: Value }>,
    public readonly embed: (value: Value) => Root
  ) {}
}

/* eslint-disable @typescript-eslint/no-explicit-any */

type CasesFor<EnumCtor extends Record<string, (...args: any[]) => any>> =
  EnumCtor extends Record<
    string,
    (...args: any[]) => infer E extends {
      case: string
    }
  >
    ? E['case']
    : never

type EnumFor<EnumCtor extends Record<string, (...args: any[]) => any>> =
  EnumCtor extends Record<
    string,
    (...args: any[]) => infer E extends {
      case: string
    }
  >
    ? E
    : never

type ValueFor<
  EnumCtor extends Record<string, (...args: any[]) => any>,
  Case extends CasesFor<EnumCtor>
> = EnumCtor extends Record<Case, infer Ctor extends (...args: any[]) => any>
  ? Parameters<Ctor> extends []
    ? void
    : Parameters<Ctor>[0]
  : never

function help(root: any): any {
  const result = { ...root }
  delete result['case']
  return result
}

export function casePath<
  EnumCtor extends Record<string, (...args: any[]) => any>,
  Case extends CasesFor<EnumCtor>
>(
  enumCtor: EnumCtor,
  enumCase: Case
): CasePath<EnumFor<EnumCtor>, ValueFor<EnumCtor, Case>> {
  return new CasePath<EnumFor<EnumCtor>, ValueFor<EnumCtor, Case>>(
    (root): any =>
      root.case === enumCase
        ? { case: 'some', value: help(root) }
        : { case: 'none' },
    (value) => enumCtor[enumCase](value)
  )
}

/* eslint-enable @typescript-eslint/no-explicit-any */
