import {
  EnumShape as BaseEnumShape,
  CasePath,
  casePath,
  cases,
  Cast,
} from '../case'
import { HKT4, Kind4 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT4 & { readonly type: BaseEnumShape }

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
  D
> = [Cast<Kind4<EnumHKT, A, B, C, D>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B, C, D>(
    // this has to be this weird check in order for TS to not complain in some edge cases
    //  like the presence of `NonNullable<*>`
    ...args: Cast<Kind4<EnumHKT, A, B, C, D>, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs<EnumHKT, Case, A, B, C, D>>
      : EnumCtorArgs<EnumHKT, Case, A, B, C, D>
  ) => Kind4<EnumHKT, A, B, C, D>
} & Record<typeof cases, CasesOfEnum<EnumHKT>> &
  Record<
    typeof casePath,
    <Case extends EnumHKT['type']['case']>(
      enumCase: Case
    ) => {
      params: <A, B, C, D>() => CasePath<
        Kind4<EnumHKT, A, B, C, D>,
        Cast<Kind4<EnumHKT, A, B, C, D>, Case>['p']
      >
    }
  >

type MakeProtoFn<EnumHKT extends EnumShape, EnumType extends object> = <
  A,
  B,
  C,
  D
>(
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => ThisType<Kind4<EnumHKT, A, B, C, D>> &
  Omit<Kind4<EnumHKT, A, B, C, D>, 'case' | 'p'>

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
