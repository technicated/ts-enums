import { cases } from '../case'
import { HKT4, Kind4 } from '../hkt'
import * as types from '../make-enum-0/types'
import { Incr } from '../type-arithmetic'

export type EnumShape = HKT4 & { type: types.EnumShape }
export type ProtoShape = HKT4 & { type: types.ProtoShape }

type RecursiveCtorArgs<
  Obj extends object,
  Index extends number = 0
> = Obj extends Record<Index, infer V>
  ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
  : []

type EnumCtorArgs<
  Enum extends EnumShape,
  Case extends Enum['type']['case'],
  Proto extends ProtoShape,
  A,
  B,
  C,
  D
> = Kind4<Enum, A, B, C, D> & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Kind4<Proto, A, B, C, D>>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind4<Proto, A, B, C, D>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Kind4<Proto, A, B, C, D>>]
  : never

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['type']['case']]: Case
}

export type CasesOf<EnumType> = EnumType extends EnumCtors<
  infer Enum,
  ProtoShape
>
  ? keyof CasesOfEnum<Enum>
  : never

export type EnumCtors<Enum extends EnumShape, Proto extends ProtoShape> = {
  [Case in Enum['type']['case']]: <A, B, C, D>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A, B, C, D>
  ) => Kind4<Enum, A, B, C, D>
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
  A,
  B,
  C,
  D
>(
  e: EnumCtors<Enum, Proto>
) => Kind4<Proto, A, B, C, D> & ThisType<Kind4<Enum, A, B, C, D>>
