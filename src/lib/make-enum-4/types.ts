import { EnumShape as BaseEnumShape, CasePath, cases, Cast } from '../case'
import { HKT4, Kind4 } from '../hkt'
import { UnionToIntersection } from '../union-to-intersection'
import { Unit } from '../unit'

export type EnumShape = HKT4 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type CasePathFn<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case']
> = {
  <A, B, C, D>(enumCase: Case): CasePath<
    Kind4<EnumHKT, A, B, C, D>,
    Cast<Kind4<EnumHKT, A, B, C, D>, Case>['p']
  >
}

type CasePathFns<EnumHKT extends EnumShape> =
  EnumHKT['type']['case'] extends infer Cases extends string
    ? { [Case in Cases]: CasePathFn<EnumHKT, Case> }[Cases]
    : never

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
  UnionToIntersection<CasePathFns<EnumHKT>>

interface Proto<EnumHKT extends EnumShape> {
  new <A, B, C, D>(): Omit<Kind4<EnumHKT, A, B, C, D>, 'case' | 'p'>
}

interface Type<EnumType extends object> {
  new (): EnumType
}

export type MakeEnumFnArgs<
  EnumHKT extends EnumShape,
  EnumType extends object = never
> = [EnumType] extends [never]
  ? EnumHKT['type'] & { _: unknown } extends infer _T
    ? keyof Omit<_T, 'case' | 'p'> extends '_'
      ? []
      : [{ proto: Proto<EnumHKT> }]
    : never
  : EnumHKT['type'] & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | 'p'> extends '_'
    ? [{ type: Type<EnumType> }]
    : [
        {
          proto: Proto<EnumHKT>
          type: Type<EnumType>
        }
      ]
  : never

export type CasesOf<Ctors> = Ctors extends EnumCtors<infer EnumHKT>
  ? EnumHKT['type']['case']
  : never
