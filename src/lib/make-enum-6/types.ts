import { EnumShape as BaseEnumShape, CasePath, cases, Cast } from '../case'
import { HKT6, Kind6 } from '../hkt'
import { UnionToIntersection } from '../union-to-intersection'
import { Unit } from '../unit'

export type EnumShape = HKT6 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type CasePathFn<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case']
> = {
  <A, B, C, D, E, F>(enumCase: Case): CasePath<
    Kind6<EnumHKT, A, B, C, D, E, F>,
    Cast<Kind6<EnumHKT, A, B, C, D, E, F>, Case>['p']
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
} & Record<typeof cases, CasesOfEnum<EnumHKT>> &
  UnionToIntersection<CasePathFns<EnumHKT>>

interface Proto<EnumHKT extends EnumShape> {
  new <A, B, C, D, E, F>(): Omit<Kind6<EnumHKT, A, B, C, D, E, F>, 'case' | 'p'>
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
