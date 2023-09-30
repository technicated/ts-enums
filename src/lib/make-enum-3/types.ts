import { cases, Cast } from '../case'
import { HKT3, Kind3 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT3 & { readonly type: { readonly case: string } }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A,
  B,
  C
> = Cast<Kind3<EnumHKT, A, B, C>, Case> extends { p: infer Payload }
  ? Payload extends Unit
    ? []
    : [payload: Payload]
  : never

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B, C>(
    ...args: EnumCtorArgs<EnumHKT, Case, A, B, C>
  ) => Kind3<EnumHKT, A, B, C>
} & Record<typeof cases, CasesOfEnum<EnumHKT>>

type MakeProtoFn<EnumHKT extends EnumShape, EnumType extends object> = <
  A,
  B,
  C
>(
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => ThisType<Kind3<EnumHKT, A, B, C>> &
  Omit<Kind3<EnumHKT, A, B, C>, 'case' | 'p'>

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

// import { cases } from '../case'
// import { HKT3, Kind3 } from '../hkt'
// import * as types from '../make-enum-0/types'
// import { Incr } from '../type-arithmetic'

// export type EnumShape = HKT3 & { type: types.EnumShape }
// export type ProtoShape = HKT3 & { type: types.ProtoShape }

// type RecursiveCtorArgs<
//   Obj extends object,
//   Index extends number = 0
// > = Obj extends Record<Index, infer V>
//   ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
//   : []

// type EnumCtorArgs<
//   Enum extends EnumShape,
//   Case extends Enum['type']['case'],
//   Proto extends ProtoShape,
//   A,
//   B,
//   C
// > = Kind3<Enum, A, B, C> & { _: unknown; case: Case } extends infer _T
//   ? keyof Omit<_T, 'case' | keyof Kind3<Proto, A, B, C>> extends keyof {
//       _: unknown
//     }
//     ? []
//     : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind3<Proto, A, B, C>>
//     ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
//     : Record<string, never> extends Omit<
//         _T,
//         'case' | '_' | keyof Kind3<Proto, A, B, C>
//       >
//     ? Partial<[Omit<_T, 'case' | '_' | keyof Kind3<Proto, A, B, C>>]>
//     : [Omit<_T, 'case' | '_' | keyof Kind3<Proto, A, B, C>>]
//   : never

// type CasesOfEnum<Enum extends EnumShape> = {
//   [Case in Enum['type']['case']]: Case
// }

// export type CasesOf<EnumType> = EnumType extends EnumCtors<
//   infer Enum,
//   ProtoShape
// >
//   ? keyof CasesOfEnum<Enum>
//   : never

// export type EnumCtors<Enum extends EnumShape, Proto extends ProtoShape> = {
//   [Case in Enum['type']['case']]: <A, B, C>(
//     ...args: EnumCtorArgs<Enum, Case, Proto, A, B, C>
//   ) => Kind3<Enum, A, B, C>
// } & Record<typeof cases, CasesOfEnum<Enum>>

// export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
//   A,
//   B,
//   C
// >(
//   e: EnumCtors<Enum, Proto>
// ) => Kind3<Proto, A, B, C> & ThisType<Kind3<Enum, A, B, C>>
