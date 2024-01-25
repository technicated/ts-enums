import { EnumShape as BaseEnumShape, CasePath, cases, Cast } from '../case'
import { HKT, Kind } from '../hkt'
import { UnionToIntersection } from '../union-to-intersection'
import { Unit } from '../unit'

export type EnumShape = HKT & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type CasePathFn<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case']
> = {
  <A>(enumCase: Case): CasePath<
    Kind<EnumHKT, A>,
    Cast<Kind<EnumHKT, A>, Case>['p']
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
  A
> = [Cast<Kind<EnumHKT, A>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A>(
    // this has to be this weird check in order for TS to not complain in some edge cases
    //  like the presence of `NonNullable<*>`
    ...args: Cast<Kind<EnumHKT, A>, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs<EnumHKT, Case, A>>
      : EnumCtorArgs<EnumHKT, Case, A>
  ) => Kind<EnumHKT, A>
} & Record<typeof cases, CasesOfEnum<EnumHKT>> &
  UnionToIntersection<CasePathFns<EnumHKT>>

interface Proto<EnumHKT extends EnumShape> {
  new <A>(): Omit<Kind<EnumHKT, A>, 'case' | 'p'>
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
