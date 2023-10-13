import { EnumShape as BaseEnumShape, cases, Cast } from '../case'
import { HKT6, Kind6 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT6 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

// this has to be a separated type or `EnumCtors` will not work!
type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A,
  B,
  C,
  D,
  E,
  F
> = [Cast<Kind6<EnumHKT, A, B, C, D, E, F>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B, C, D, E, F>(
    // this has to be this weird check in order for TS to not complain in some edge cases
    //  like the presence of `NonNullable<*>`
    ...args: Cast<Kind6<EnumHKT, A, B, C, D, E, F>, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs<EnumHKT, Case, A, B, C, D, E, F>>
      : EnumCtorArgs<EnumHKT, Case, A, B, C, D, E, F>
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
