import { EnumShape as BaseEnumShape, cases, Cast } from '../case'
import { Unit } from '../unit'

export type EnumShape = BaseEnumShape

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['case']]: Case
}

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
} & Record<typeof cases, CasesOfEnum<Enum>>

type MakeProtoFn<Enum extends EnumShape> = () => ThisType<Enum> &
  Omit<Enum, 'case' | 'p'>

export type MakeEnumFnArgs<
  Enum extends EnumShape,
  EnumType extends object = never
> = [EnumType] extends [never]
  ? Enum & { _: unknown } extends infer _T
    ? keyof Omit<_T, 'case' | 'p'> extends '_'
      ? []
      : [{ makeProto: MakeProtoFn<Enum> }]
    : never
  : Enum & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | 'p'> extends '_'
    ? [{ type: EnumType }]
    : [{ makeProto: MakeProtoFn<Enum>; type: EnumType }]
  : never

export type CasesOf<Ctors> = Ctors extends EnumCtors<infer Enum>
  ? Enum['case']
  : never
