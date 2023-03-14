import { HKT2, Kind2 } from './hkt'
import { Incr } from './type-arithmetic'
import * as types from './types'

export type EnumShape = HKT2 & { type: types.EnumShape }
export type ProtoShape = HKT2 & { type: object }

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
  B
> = Kind2<Enum, A, B> & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Kind2<Proto, A, B>>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind2<Proto, A, B>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Kind2<Proto, A, B>>]
  : never

export type EnumCtors<Enum extends EnumShape, Proto extends ProtoShape> = {
  [Case in Enum['type']['case']]: <A, B>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A, B>
  ) => Kind2<Enum, A, B>
}

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
  A,
  B
>(
  e: EnumCtors<Enum, Proto>
) => Kind2<Proto, A, B> & ThisType<Kind2<Enum, A, B>>
