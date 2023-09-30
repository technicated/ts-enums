import { cases, Cast } from '../case'

export type EnumShape = { readonly case: string }
export type ProtoShape = any // todo: remove

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['case']]: Case
}

type EnumCtorArgs<Enum extends EnumShape, Case extends Enum['case']> = Cast<
  Enum,
  Case
> extends infer _T
  ? _T extends { p: infer Payload }
    ? [payload: Payload]
    : []
  : never

export type EnumCtors<Enum extends EnumShape> = {
  [Case in Enum['case']]: (...args: EnumCtorArgs<Enum, Case>) => Enum
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeEnumFnArgs<
  Enum extends EnumShape,
  EnumType extends object = never
> = [EnumType] extends [never]
  ? Enum & { _: unknown } extends infer _T
    ? keyof Omit<_T, 'case' | 'p'> extends '_'
      ? []
      : [{ makeProto: () => ThisType<Enum> & Omit<Enum, 'case'> }]
    : never
  : Enum & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | 'p'> extends '_'
    ? [{ type: EnumType }]
    : [
        {
          makeProto: () => ThisType<Enum> & Omit<Enum, 'case'>
          type: EnumType
        }
      ]
  : never

export type CasesOf<Enum extends EnumShape> = Enum['case']

/*
export type EnumShape = { readonly case: string }
export type ProtoShape = object

type RecursiveCtorArgs<
  Obj extends object,
  Index extends number = 0
> = Obj extends Record<Index, infer V>
  ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
  : []

type EnumCtorArgs<
  Enum extends EnumShape,
  Case extends Enum['case'],
  Proto extends ProtoShape
> = Enum & { _: unknown; case: Case } extends infer _T
  ? keyof Omit<_T, 'case' | keyof Proto> extends keyof { _: unknown }
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Proto>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : Record<string, never> extends Omit<_T, 'case' | '_' | keyof Proto>
    ? Partial<[Omit<_T, 'case' | '_' | keyof Proto>]>
    : [Omit<_T, 'case' | '_' | keyof Proto>]
  : never

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['case']]: Case
}

export type CasesOf<EnumType> = EnumType extends EnumCtors<
  infer Enum,
  ProtoShape
>
  ? keyof CasesOfEnum<Enum>
  : never

export type EnumCtors<Enum extends EnumShape, Proto extends ProtoShape> = {
  [Case in Enum['case']]: (...args: EnumCtorArgs<Enum, Case, Proto>) => Enum
} & Record<typeof cases, CasesOfEnum<Enum>>

export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = (
  e: EnumCtors<Enum, Proto>
) => Proto & ThisType<Enum>
*/
