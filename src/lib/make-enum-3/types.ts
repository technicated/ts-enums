import {
  EnumShape as BaseEnumShape,
  CasePath,
  casePath,
  cases,
  Cast,
} from '../case'
import { HKT3, Kind3 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT3 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

// this has to be a separated type or `EnumCtors` will not work!
type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A,
  B,
  C
> = [Cast<Kind3<EnumHKT, A, B, C>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B, C>(
    // this has to be this weird check in order for TS to not complain in some edge cases
    //  like the presence of `NonNullable<*>`
    ...args: Cast<Kind3<EnumHKT, A, B, C>, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs<EnumHKT, Case, A, B, C>>
      : EnumCtorArgs<EnumHKT, Case, A, B, C>
  ) => Kind3<EnumHKT, A, B, C>
} & Record<typeof cases, CasesOfEnum<EnumHKT>> &
  Record<
    typeof casePath,
    <Case extends EnumHKT['type']['case']>(
      enumCase: Case
    ) => {
      params: <A, B, C>() => CasePath<
        Kind3<EnumHKT, A, B, C>,
        Cast<Kind3<EnumHKT, A, B, C>, Case>['p']
      >
    }
  >

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

type MakeTypeFn<EnumHKT extends EnumShape, EnumType extends object> = (
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => EnumType

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
    ? [{ makeType: MakeTypeFn<EnumHKT, EnumType> }]
    : [
        {
          makeProto: MakeProtoFn<EnumHKT, EnumType>
          makeType: MakeTypeFn<EnumHKT, EnumType>
        }
      ]
  : never

export type CasesOf<Ctors> = Ctors extends EnumCtors<infer EnumHKT>
  ? EnumHKT['type']['case']
  : never
