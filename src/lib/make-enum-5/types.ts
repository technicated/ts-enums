import { cases } from '../case'
import { HKT5, Kind5 } from '../hkt'
import * as types from '../make-enum-0/types'
import { Incr } from '../type-arithmetic'

export type EnumShape = HKT5 & { type: types.EnumShape }
export type ProtoShape = HKT5 & { type: types.ProtoShape }

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
  E
> = Kind5<Enum, A, B, C, D, E> & {
  _: unknown
  case: Case
} extends infer _T
  ? keyof Omit<_T, 'case' | keyof Kind5<Proto, A, B, C, D, E>> extends keyof {
      _: unknown
    }
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind5<Proto, A, B, C, D, E>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : Record<string, never> extends Omit<
        _T,
        'case' | '_' | keyof Kind5<Proto, A, B, C, D, E>
      >
    ? Partial<[Omit<_T, 'case' | '_' | keyof Kind5<Proto, A, B, C, D, E>>]>
    : [Omit<_T, 'case' | '_' | keyof Kind5<Proto, A, B, C, D, E>>]
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
  [Case in Enum['type']['case']]: <A, B, C, D, E>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A, B, C, D, E>
  ) => Kind5<Enum, A, B, C, D, E>
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
  A,
  B,
  C,
  D,
  E
>(
  e: EnumCtors<Enum, Proto>
) => Kind5<Proto, A, B, C, D, E> & ThisType<Kind5<Enum, A, B, C, D, E>>
