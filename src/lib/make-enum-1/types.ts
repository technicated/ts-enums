import { cases } from '../case'
import { HKT, Kind } from '../hkt'
import * as types from '../make-enum-0/types'
import { Incr } from '../type-arithmetic'

export type EnumShape = HKT & { type: types.EnumShape }
export type ProtoShape = HKT & { type: types.ProtoShape }

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
  A
> = Kind<Enum, A> & { _: unknown; case: Case } extends infer _T
  ? keyof Omit<_T, 'case' | keyof Kind<Proto, A>> extends keyof { _: unknown }
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : Record<string, never> extends Omit<
        _T,
        'case' | '_' | keyof Kind<Proto, A>
      >
    ? Partial<[Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>]>
    : [Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>]
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
  [Case in Enum['type']['case']]: <A>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A>
  ) => Kind<Enum, A>
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <A>(
  e: EnumCtors<Enum, Proto>
) => Kind<Proto, A> & ThisType<Kind<Enum, A>>
