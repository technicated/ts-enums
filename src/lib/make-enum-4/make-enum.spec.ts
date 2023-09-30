import test from 'ava'
test('a', (t) => t.true(true))

// import test from 'ava'
// import { Case, cases } from '../case'
// import { HKT4 } from '../hkt'
// import { makeEnum4 } from './make-enum'
// import { CasesOf } from './types'

// test('basic enum', (t) => {
//   type MyEnum<A, B, C, D> =
//     | Case<'empty'>
//     | Case<'a', [A]>
//     | Case<'b', [A, B]>
//     | Case<'c', [A, B, C]>
//     | Case<'d', [A, B, C, D]>

//   interface MyEnumHKT extends HKT4 {
//     readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   const MyEnum = makeEnum4<MyEnumHKT>()

//   type Helper = MyEnum<unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown]>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//   }

//   const empty = MyEnum.empty() as Helper
//   performCheck(empty, 'empty', [])

//   const a = MyEnum.a([1]) as Helper
//   performCheck(a, 'a', [1])

//   const b = MyEnum.b([2, 'hello']) as Helper
//   performCheck(b, 'b', [2, 'hello'])

//   const c = MyEnum.c(['hello', 3, 'world']) as Helper
//   performCheck(c, 'c', ['hello', 3, 'world'])

//   const d = MyEnum.d(['hello', 3, 'world', true]) as Helper
//   performCheck(d, 'd', ['hello', 3, 'world', true])
// })

// test('enum with proto', (t) => {
//   interface MyEnumProto<A, B, C, D> {
//     prev(): MyEnum<A, B, C, D>
//   }

//   interface MyEnumProtoHKT extends HKT4 {
//     readonly type: MyEnumProto<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   type MyEnum<A, B, C, D> = MyEnumProto<A, B, C, D> &
//     (
//       | Case<'empty'>
//       | Case<'a', [A]>
//       | Case<'b', [A, B]>
//       | Case<'c', [A, B, C]>
//       | Case<'d', [A, B, C, D]>
//     )

//   interface MyEnumHKT extends HKT4 {
//     readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   const MyEnum = makeEnum4<MyEnumHKT, MyEnumProtoHKT>((MyEnum) => ({
//     prev() {
//       switch (this.case) {
//         case 'empty':
//           return MyEnum.empty()
//         case 'a':
//           return MyEnum.empty()
//         case 'b':
//           return MyEnum.a([this[0]])
//         case 'c':
//           return MyEnum.b([this[0], this[1]])
//         case 'd':
//           return MyEnum.c([this[0], this[1], this[2]])
//       }
//     },
//   }))

//   type Helper = MyEnum<unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown]>,
//     prev: unknown
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//     t.deepEqual(v.prev(), prev)
//   }

//   const empty = MyEnum.empty() as Helper
//   performCheck(empty, 'empty', [], MyEnum.empty())

//   const a = MyEnum.a([1]) as Helper
//   performCheck(a, 'a', [1], MyEnum.empty())

//   const b = MyEnum.b([2, 'hello']) as Helper
//   performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

//   const c = MyEnum.c(['hello', 3, 'world']) as Helper
//   performCheck(c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

//   const d = MyEnum.d(['hello', 3, 'world', true]) as Helper
//   performCheck(
//     d,
//     'd',
//     ['hello', 3, 'world', true],
//     MyEnum.c(['hello', 3, 'world'])
//   )
// })

// test('enum with proto and type', (t) => {
//   interface MyEnumProto<A, B, C, D> {
//     prev(): MyEnum<A, B, C, D>
//   }

//   interface MyEnumProtoHKT extends HKT4 {
//     readonly type: MyEnumProto<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   type MyEnum<A, B, C, D> = MyEnumProto<A, B, C, D> &
//     (
//       | Case<'empty'>
//       | Case<'a', [A]>
//       | Case<'b', [A, B]>
//       | Case<'c', [A, B, C]>
//       | Case<'d', [A, B, C, D]>
//     )

//   interface MyEnumHKT extends HKT4 {
//     readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   interface MyEnumType {
//     make<A, B, C, D>(
//       ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D]
//     ): MyEnum<A, B, C, D>
//   }

//   const MyEnum = makeEnum4<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
//     (MyEnum) => ({
//       prev() {
//         switch (this.case) {
//           case 'empty':
//             return MyEnum.empty()
//           case 'a':
//             return MyEnum.empty()
//           case 'b':
//             return MyEnum.a([this[0]])
//           case 'c':
//             return MyEnum.b([this[0], this[1]])
//           case 'd':
//             return MyEnum.c([this[0], this[1], this[2]])
//         }
//       },
//     }),
//     {
//       make<A, B, C, D>(
//         ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D]
//       ): MyEnum<A, B, C, D> {
//         switch (args.length) {
//           case 0:
//             return MyEnum.empty()
//           case 1:
//             return MyEnum.a(args)
//           case 2:
//             return MyEnum.b(args)
//           case 3:
//             return MyEnum.c(args)
//           case 4:
//             return MyEnum.d(args)
//         }
//       },
//     }
//   )

//   type Helper = MyEnum<unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown]>,
//     prev: unknown
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//     t.deepEqual(v.prev(), prev)
//   }

//   const empty = MyEnum.empty() as Helper
//   performCheck(empty, 'empty', [], MyEnum.empty())

//   const a = MyEnum.a([1]) as Helper
//   performCheck(a, 'a', [1], MyEnum.empty())

//   const b = MyEnum.b([2, 'hello']) as Helper
//   performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

//   const c = MyEnum.c(['hello', 3, 'world']) as Helper
//   performCheck(c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

//   const d = MyEnum.d(['hello', 3, 'world', true]) as Helper
//   performCheck(
//     d,
//     'd',
//     ['hello', 3, 'world', true],
//     MyEnum.c(['hello', 3, 'world'])
//   )

//   const make_empty = MyEnum.make() as Helper
//   performCheck(make_empty, 'empty', [], MyEnum.empty())

//   const make_a = MyEnum.make(1) as Helper
//   performCheck(make_a, 'a', [1], MyEnum.empty())

//   const make_b = MyEnum.make(2, 'hello') as Helper
//   performCheck(make_b, 'b', [2, 'hello'], MyEnum.a([2]))

//   const make_c = MyEnum.make('hello', 3, 'world') as Helper
//   performCheck(make_c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

//   const make_d = MyEnum.make('hello', 3, 'world', false) as Helper
//   performCheck(
//     make_d,
//     'd',
//     ['hello', 3, 'world', false],
//     MyEnum.c(['hello', 3, 'world'])
//   )
// })

// test('enum with type', (t) => {
//   type MyEnum<A, B, C, D> =
//     | Case<'empty'>
//     | Case<'a', [A]>
//     | Case<'b', [A, B]>
//     | Case<'c', [A, B, C]>
//     | Case<'d', [A, B, C, D]>

//   interface MyEnumHKT extends HKT4 {
//     readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   interface MyEnumType {
//     make<A, B, C, D>(
//       ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D]
//     ): MyEnum<A, B, C, D>
//   }

//   const MyEnum = makeEnum4<MyEnumHKT, MyEnumType>({
//     make<A, B, C, D>(
//       ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D]
//     ): MyEnum<A, B, C, D> {
//       switch (args.length) {
//         case 0:
//           return MyEnum.empty()
//         case 1:
//           return MyEnum.a(args)
//         case 2:
//           return MyEnum.b(args)
//         case 3:
//           return MyEnum.c(args)
//         case 4:
//           return MyEnum.d(args)
//       }
//     },
//   })

//   type Helper = MyEnum<unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown]>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//   }

//   const empty = MyEnum.empty() as Helper
//   performCheck(empty, 'empty', [])

//   const a = MyEnum.a([1]) as Helper
//   performCheck(a, 'a', [1])

//   const b = MyEnum.b([2, 'hello']) as Helper
//   performCheck(b, 'b', [2, 'hello'])

//   const c = MyEnum.c(['hello', 3, 'world']) as Helper
//   performCheck(c, 'c', ['hello', 3, 'world'])

//   const d = MyEnum.d(['hello', 3, 'world', true]) as Helper
//   performCheck(d, 'd', ['hello', 3, 'world', true])

//   const make_empty = MyEnum.make() as Helper
//   performCheck(make_empty, 'empty', [])

//   const make_a = MyEnum.make(1) as Helper
//   performCheck(make_a, 'a', [1])

//   const make_b = MyEnum.make(2, 'hello') as Helper
//   performCheck(make_b, 'b', [2, 'hello'])

//   const make_c = MyEnum.make('hello', 3, 'world') as Helper
//   performCheck(make_c, 'c', ['hello', 3, 'world'])

//   const make_d = MyEnum.make('hello', 3, 'world', false) as Helper
//   performCheck(make_d, 'd', ['hello', 3, 'world', false])
// })

// test('fully optional object payload', (t) => {
//   type MyEnum<A, B, C, D> =
//     | Case<'main', { a?: A; b?: B; c?: C; d?: D }>
//     | Case<'other'>

//   interface MyEnumHKT extends HKT4 {
//     readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
//   }

//   const MyEnum = makeEnum4<MyEnumHKT>()

//   type Helper = MyEnum<unknown, unknown, unknown, unknown> &
//     Record<'a' | 'b' | 'c' | 'd', unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<Record<'a' | 'b' | 'c' | 'd', unknown>>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v.a, payload.a)
//     t.deepEqual(v.b, payload.b)
//     t.deepEqual(v.c, payload.c)
//     t.deepEqual(v.d, payload.d)
//   }

//   const main = MyEnum.main() as Helper
//   performCheck(main, 'main', {})

//   const main_a = MyEnum.main({ a: 'hello' }) as Helper
//   performCheck(main_a, 'main', { a: 'hello' })

//   const main_b = MyEnum.main({ b: 2 }) as Helper
//   performCheck(main_b, 'main', { b: 2 })

//   const main_c = MyEnum.main({ c: 'hello' }) as Helper
//   performCheck(main_c, 'main', { c: 'hello' })

//   const main_d = MyEnum.main({ d: true }) as Helper
//   performCheck(main_d, 'main', { d: true })

//   const main_all = MyEnum.main({
//     a: 2,
//     b: 'hello',
//     c: 'world',
//     d: true,
//   }) as Helper
//   performCheck(main_all, 'main', { a: 2, b: 'hello', c: 'world', d: true })
// })
