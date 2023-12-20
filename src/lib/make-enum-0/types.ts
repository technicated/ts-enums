import { EnumShape as BaseEnumShape, CasePath, cases, Cast } from '../case'
import { UnionToIntersection } from '../union-to-intersection'
import { Unit } from '../unit'

export type EnumShape = BaseEnumShape

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['case']]: Case
}

type CasePathFn<Enum extends EnumShape, Case extends Enum['case']> = {
  (enumCase: Case): CasePath<Enum, Cast<Enum, Case>['p']>
}

type CasePathFns<Enum extends EnumShape> =
  Enum['case'] extends infer Cases extends string
    ? { [Case in Cases]: CasePathFn<Enum, Case> }[Cases]
    : never

// this is like this for consistency with generic variants
type EnumCtorArgs<Enum extends EnumShape, Case extends Enum['case']> = [
  Cast<Enum, Case>['p']
]

export type EnumCtors<Enum extends EnumShape> = {
  [Case in Enum['case']]: (
    // this is like this for consistency with generic variants
    ...args: Cast<Enum, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs<Enum, Case>>
      : EnumCtorArgs<Enum, Case>
  ) => Enum
} & Record<typeof cases, CasesOfEnum<Enum>> &
  UnionToIntersection<CasePathFns<Enum>>

type MakeProtoFn<Enum extends EnumShape, EnumType extends object> = (
  Enum: [EnumType] extends [never]
    ? EnumCtors<Enum>
    : EnumCtors<Enum> & EnumType
) => ThisType<Enum> & Omit<Enum, 'case' | 'p'>

type MakeTypeFn<Enum extends EnumShape, EnumType extends object> = (
  Enum: [EnumType] extends [never]
    ? EnumCtors<Enum>
    : EnumCtors<Enum> & EnumType
) => EnumType

export type MakeEnumFnArgs<
  Enum extends EnumShape,
  EnumType extends object = never
> = [EnumType] extends [never]
  ? Enum & { _: unknown } extends infer _T
    ? keyof Omit<_T, 'case' | 'p'> extends '_'
      ? []
      : [{ makeProto: MakeProtoFn<Enum, EnumType> }]
    : never
  : Enum & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | 'p'> extends '_'
    ? [{ makeType: MakeTypeFn<Enum, EnumType> }]
    : [
        {
          makeProto: MakeProtoFn<Enum, EnumType>
          makeType: MakeTypeFn<Enum, EnumType>
        }
      ]
  : never

export type CasesOf<Ctors> = Ctors extends EnumCtors<infer Enum>
  ? Enum['case']
  : never
