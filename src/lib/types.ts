import { Incr } from './type-arithmetic'

export type EnumShape = {
  readonly case: string
}

type RecursiveCtorArgs<
  Obj extends object,
  Index extends number = 0
> = Obj extends Record<Index, infer V>
  ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
  : []

type EnumCtorArgs<
  Enum extends EnumShape,
  Case extends Enum['case'],
  Proto extends object
> = Enum & {
  _: unknown
  case: Case
} extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Proto>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Proto>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Proto>]
  : never

export type EnumCtors<Enum extends EnumShape, Proto extends object> = {
  [Case in Enum['case']]: (...args: EnumCtorArgs<Enum, Case, Proto>) => Enum
}

export type MakeProtoFn<Enum extends EnumShape, Proto extends object> = (
  e: EnumCtors<Enum, Proto>
) => Proto & ThisType<Enum>
