import { EnumShape as BaseEnumShape, CasePath, cases, Cast } from '../case'
import { HKT3, Kind3 } from '../hkt'
import { UnionToIntersection } from '../union-to-intersection'
import { Unit } from '../unit'

export type EnumShape = HKT3 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type CasePathFn<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case']
> = {
  <A, B, C>(enumCase: Case): CasePath<
    Kind3<EnumHKT, A, B, C>,
    Cast<Kind3<EnumHKT, A, B, C>, Case>['p']
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
  UnionToIntersection<CasePathFns<EnumHKT>>

interface Proto<EnumHKT extends EnumShape> {
  new <A, B, C>(): Omit<Kind3<EnumHKT, A, B, C>, 'case' | 'p'>
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
