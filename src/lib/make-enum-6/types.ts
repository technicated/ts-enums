import { cases, Cast } from '../case'
import { HKT6, Kind6 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT6 & { readonly type: { readonly case: string } }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A,
  B,
  C,
  D,
  E,
  F
> = Cast<Kind6<EnumHKT, A, B, C, D, E, F>, Case> extends { p: infer Payload }
  ? Payload extends Unit
    ? []
    : [payload: Payload]
  : never

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B, C, D, E, F>(
    ...args: EnumCtorArgs<EnumHKT, Case, A, B, C, D, E, F>
  ) => Kind6<EnumHKT, A, B, C, D, E, F>
} & Record<typeof cases, CasesOfEnum<EnumHKT>>

type MakeProtoFn<EnumHKT extends EnumShape, EnumType extends object> = <
  A,
  B,
  C,
  D,
  E,
  F
>(
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => ThisType<Kind6<EnumHKT, A, B, C, D, E, F>> &
  Omit<Kind6<EnumHKT, A, B, C, D, E, F>, 'case' | 'p'>

export type MakeEnumFnArgs<
  EnumHKT extends EnumShape,
  EnumType extends object = never
> = [EnumType] extends [never]
  ? EnumHKT['type'] & { _: unknown } extends infer _T
    ? keyof Omit<_T, 'case' | 'p'> extends '_'
      ? []
      : [{ makeProto: MakeProtoFn<EnumHKT, EnumType> }]
    : never
  : EnumHKT['type'] & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | 'p'> extends '_'
    ? [{ type: EnumType }]
    : [{ makeProto: MakeProtoFn<EnumHKT, EnumType>; type: EnumType }]
  : never

export type CasesOf<Ctors> = Ctors extends EnumCtors<infer EnumHKT>
  ? EnumHKT['type']['case']
  : never
