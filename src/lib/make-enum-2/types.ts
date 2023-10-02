import { EnumShape as BaseEnumShape, cases, Cast } from '../case'
import { HKT2, Kind2 } from '../hkt'
import { Unit } from '../unit'

export type EnumShape = HKT2 & { readonly type: BaseEnumShape }

type CasesOfEnum<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: Case
}

type EnumCtorArgs<
  EnumHKT extends EnumShape,
  Case extends EnumHKT['type']['case'],
  A,
  B
> = Cast<Kind2<EnumHKT, A, B>, Case>['p'] extends Unit
  ? []
  : [Cast<Kind2<EnumHKT, A, B>, Case>['p']]

export type EnumCtors<EnumHKT extends EnumShape> = {
  [Case in EnumHKT['type']['case']]: <A, B>(
    ...args: EnumCtorArgs<EnumHKT, Case, A, B>
  ) => Kind2<EnumHKT, A, B>
} & Record<typeof cases, CasesOfEnum<EnumHKT>>

type MakeProtoFn<EnumHKT extends EnumShape, EnumType extends object> = <A, B>(
  Enum: [EnumType] extends [never]
    ? EnumCtors<EnumHKT>
    : EnumCtors<EnumHKT> & EnumType
) => ThisType<Kind2<EnumHKT, A, B>> & Omit<Kind2<EnumHKT, A, B>, 'case' | 'p'>

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
// import { HKT2, Kind2 } from '../hkt'
// import * as types from '../make-enum-0/types'
// import { Incr } from '../type-arithmetic'

// export type EnumShape = HKT2 & { type: types.EnumShape }
// export type ProtoShape = HKT2 & { type: types.ProtoShape }

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
//   B
// > = Kind2<Enum, A, B> & { _: unknown; case: Case } extends infer _T
//   ? keyof Omit<_T, 'case' | keyof Kind2<Proto, A, B>> extends keyof {
//       _: unknown
//     }
//     ? []
//     : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind2<Proto, A, B>>
//     ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
//     : Record<string, never> extends Omit<
//         _T,
//         'case' | '_' | keyof Kind2<Proto, A, B>
//       >
//     ? Partial<[Omit<_T, 'case' | '_' | keyof Kind2<Proto, A, B>>]>
//     : [Omit<_T, 'case' | '_' | keyof Kind2<Proto, A, B>>]
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
//   [Case in Enum['type']['case']]: <A, B>(
//     ...args: EnumCtorArgs<Enum, Case, Proto, A, B>
//   ) => Kind2<Enum, A, B>
// } & Record<typeof cases, CasesOfEnum<Enum>>

// export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <
//   A,
//   B
// >(
//   e: EnumCtors<Enum, Proto>
// ) => Kind2<Proto, A, B> & ThisType<Kind2<Enum, A, B>>
