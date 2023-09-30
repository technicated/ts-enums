import { cases, Cast } from '../case'
import { Unit } from '../unit'

export type EnumShape = { readonly case: string }
export type ProtoShape = any // todo: remove

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['case']]: Case
}

type EnumCtorArgs<Enum extends EnumShape, Case extends Enum['case']> = Cast<
  Enum,
  Case
> extends { p: infer Payload }
  ? Payload extends Unit
    ? []
    : [payload: Payload]
  : never

export type EnumCtors<Enum extends EnumShape> = {
  [Case in Enum['case']]: (...args: EnumCtorArgs<Enum, Case>) => Enum
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
