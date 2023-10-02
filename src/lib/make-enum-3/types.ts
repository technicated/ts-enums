import { EnumShape as BaseEnumShape, cases, Cast } from '../case'
import { HKT3, Kind3 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT3 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A,
  B,
  C
> = Cast<Kind3<EnumHKT, A, B, C>, Case>['p'] extends Unit
  ? []
  : [Cast<Kind3<EnumHKT, A, B, C>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B, C>(
    ...args: EnumCtorArgs<EnumHKT, Case, A, B, C>
  ) => Kind3<EnumHKT, A, B, C>
} & Record<typeof cases, CasesOfEnum<EnumHKT>>

type MakeProtoFn<EnumHKT extends EnumShape, EnumType extends object> = <
  A,
  B,
  C
>(
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => ThisType<Kind3<EnumHKT, A, B, C>> &
  Omit<Kind3<EnumHKT, A, B, C>, 'case' | 'p'>

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
