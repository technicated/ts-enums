import { cases } from '../case'
import { HKT3, Kind3 } from '../hkt'
import * as types from '../make-enum-0/types'
import { Incr } from '../type-arithmetic'

export type EnumShape = HKT3 & { type: types.EnumShape }
export type ProtoShape = HKT3 & { type: types.ProtoShape }

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
  [Case in Enum['type']['case']]: <A, B, C>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A, B, C>
  ) => Kind3<Enum, A, B, C>
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
  A,
  B,
  C
>(
  e: EnumCtors<Enum, Proto>
) => Kind3<Proto, A, B, C> & ThisType<Kind3<Enum, A, B, C>>
