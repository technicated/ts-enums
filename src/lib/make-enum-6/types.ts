import { cases } from '../case'
import { HKT6, Kind6 } from '../hkt'
import * as types from '../make-enum-0/types'
import { Incr } from '../type-arithmetic'

export type EnumShape = HKT6 & { type: types.EnumShape }
export type ProtoShape = HKT6 & { type: types.ProtoShape }

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
  D,
  E,
  F
> = Kind6<Enum, A, B, C, D, E, F> & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<
      _T,
      'case' | keyof Kind6<Proto, A, B, C, D, E, F>
    >
    ? []
    : 0 extends keyof Omit<
        _T,
        'case' | '_' | keyof Kind6<Proto, A, B, C, D, E, F>
      >
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Kind6<Proto, A, B, C, D, E, F>>]
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
  [Case in Enum['type']['case']]: <A, B, C, D, E, F>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A, B, C, D, E, F>
  ) => Kind6<Enum, A, B, C, D, E, F>
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
  A,
  B,
  C,
  D,
  E,
  F
>(
  e: EnumCtors<Enum, Proto>
) => Kind6<Proto, A, B, C, D, E, F> & ThisType<Kind6<Enum, A, B, C, D, E, F>>
