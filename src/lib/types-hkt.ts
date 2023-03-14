import { HKT, Kind } from './hkt'
import { Incr } from './type-arithmetic'
import * as types from './types'

export type EnumShape = HKT & { type: types.EnumShape }
export type ProtoShape = HKT & { type: object }

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
> = Kind<Enum, A> & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Kind<Proto, A>>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>]
  : never

export type EnumCtors<Enum extends EnumShape, Proto extends ProtoShape> = {
  [Case in Enum['type']['case']]: <A>(
    ...args: EnumCtorArgs<Enum, Case, Proto, A>
  ) => Kind<Enum, A>
}

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <A>(
  e: EnumCtors<Enum, Proto>
) => Kind<Proto, A> & ThisType<Kind<Enum, A>>
