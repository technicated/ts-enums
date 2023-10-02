import { EnumShape as BaseEnumShape, cases, Cast } from '../case'
import { HKT, Kind } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

export type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A
> =
  /*(Cast<Kind<EnumHKT, A>, Case>['p'] extends Unit
  ? []
  : [Cast<Kind<EnumHKT, A>, Case>['p']]) extends infer V extends unknown[] ? V : never*/
  [Cast<Kind<EnumHKT, A>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A>(
    ...args: Cast<Kind<EnumHKT, A>, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs<EnumHKT, Case, A>>
      : EnumCtorArgs<EnumHKT, Case, A>
  ) => // ...args: Cast<Kind<EnumHKT, A>, Case>['p'] extends Unit
  //   ? Partial<[Cast<Kind<EnumHKT, A>, Case>['p']]>
  //   : [Cast<Kind<EnumHKT, A>, Case>['p']]
  Kind<EnumHKT, A>
} & Record<typeof cases, CasesOfEnum<EnumHKT>>

type MakeProtoFn<EnumHKT extends EnumShape, EnumType extends object> = <A>(
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => ThisType<Kind<EnumHKT, A>> & Omit<Kind<EnumHKT, A>, 'case' | 'p'>

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
