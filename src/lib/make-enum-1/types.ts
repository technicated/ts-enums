import { Case, cases, Cast, Payload } from '../case'
import { HKT, Kind } from '../hkt'
import * as types from '../make-enum-0/types'
import { Unit } from '../unit'
import { makeEnum } from './make-enum'

export type EnumShape = HKT & { type: types.EnumShape }

export type MakeEnumFnArgs<
  Enum extends EnumShape,
  Type extends object = never
> = Enum['type'] & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | Payload> extends '_'
  ? [Type] extends [never]
  ? []
  : [{ type: Type }]
  : [Type] extends [never]
  ? [{ proto: Omit<Kind<Enum, string>, 'case' | Payload> & ThisType<Kind<Enum, string>> }]
  : [
    {
      proto: Omit<Kind<Enum, string>, 'case' | Payload> & ThisType<Kind<Enum, string>>
      type: Type
    }
  ]
  : never

type CasesOfEnum<Enum extends EnumShape> = {
  [Case in Enum['type']['case']]: Case
}

export type EnumCtors<Enum extends EnumShape> = {
  [Case in Enum['type']['case']]: Cast<
    Enum['type'],
    Case
  > extends infer _T extends types.EnumShape
  ? _T[Payload] extends Unit
  ? <A>() => Kind<Enum, A>
  : <A>(payload: Cast<Kind<Enum, A>, Case>[Payload]) => Kind<Enum, A>
  : never
} & Record<typeof cases, CasesOfEnum<Enum>>

export type CasesOf<EnumType extends EnumShape> = keyof CasesOfEnum<EnumType>

// --------

interface MyEnumProto<T> {
  getValue(): T
}

type MyEnum<T> = MyEnumProto<T> & (Case<'zero'> | Case<'a', T> | Case<'b', [T]>)

interface MyEnumHKT extends HKT {
  readonly type: MyEnum<this['_A']>
}

interface MyEnumType {
  make(): number
}

type _A = MakeEnumFnArgs<MyEnumHKT>
const asd: _A = [
  {
    proto: {
      getValue() { return 12 },
    },
  },
]

const MyEnum = makeEnum<MyEnumHKT, MyEnumType>({
  proto: () => ({
    getValue() { return this.getValue() },
  }),
  type: {
    make: () => {
      return 12
    },
  },
})

const aaa: ThisType<{ a: number }> = {
  asd() {
    return this.a
  },
}

type Asd = MakeEnumFnArgs<MyEnumHKT>
const a: Asd = [
  {
    proto: {
      a: 12,
    },
  },
]

const gg = MyEnum.a(1234)

type Test = EnumCtors<MyEnumHKT>
const t: Test = undefined as any
const res = t.b(['12314' as const])

type V = CasesOf<MyEnumHKT>

// import { cases } from '../case'
// import { HKT, Kind } from '../hkt'
// import * as types from '../make-enum-0/types'
// import { Incr } from '../type-arithmetic'
//
// export type EnumShape = HKT & { type: types.EnumShape }
// export type ProtoShape = HKT & { type: types.ProtoShape }
//
// type RecursiveCtorArgs<
//   Obj extends object,
//   Index extends number = 0
// > = Obj extends Record<Index, infer V>
//   ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
//   : []
//
// type EnumCtorArgs<
//   Enum extends EnumShape,
//   Case extends Enum['type']['case'],
//   Proto extends ProtoShape,
//   A
// > = Kind<Enum, A> & { _: unknown; case: Case } extends infer _T
//   ? keyof Omit<_T, 'case' | keyof Kind<Proto, A>> extends keyof { _: unknown }
//     ? []
//     : 0 extends keyof Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>
//     ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
//     : Record<string, never> extends Omit<
//         _T,
//         'case' | '_' | keyof Kind<Proto, A>
//       >
//     ? Partial<[Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>]>
//     : [Omit<_T, 'case' | '_' | keyof Kind<Proto, A>>]
//   : never
//
// type CasesOfEnum<Enum extends EnumShape> = {
//   [Case in Enum['type']['case']]: Case
// }
//
// export type CasesOf<EnumType> = EnumType extends EnumCtors<
//   infer Enum,
//   ProtoShape
// >
//   ? keyof CasesOfEnum<Enum>
//   : never
//
// export type EnumCtors<Enum extends EnumShape, Proto extends ProtoShape> = {
//   [Case in Enum['type']['case']]: <A>(
//     ...args: EnumCtorArgs<Enum, Case, Proto, A>
//   ) => Kind<Enum, A>
// } & Record<typeof cases, CasesOfEnum<Enum>>
//
// export type MakeProtoFn<Enum extends EnumShape, Proto extends ProtoShape> = <A>(
//   e: EnumCtors<Enum, Proto>
// ) => Kind<Proto, A> & ThisType<Kind<Enum, A>>
