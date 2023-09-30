import test from 'ava'
test('a', (t) => t.true(true))

// import test from 'ava'
// import { Case, cases } from '../case'
// import { HKT5 } from '../hkt'
// import { makeEnum5 } from './make-enum'
// import { CasesOf } from './types'

// test('basic enum', (t) => {
//   type MyEnum<A, B, C, D, E> =
//     | Case<'empty'>
//     | Case<'a', [A]>
//     | Case<'b', [A, B]>
//     | Case<'c', [A, B, C]>
//     | Case<'d', [A, B, C, D]>
//     | Case<'e', [A, B, C, D, E]>

//   interface MyEnumHKT extends HKT5 {
//     readonly type: MyEnum<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   const MyEnum = makeEnum5<MyEnumHKT>()

//   type Helper = MyEnum<unknown, unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3 | 4, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown, unknown]>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//     t.deepEqual(v[4], payload[4])
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

//   const e = MyEnum.e(['hello', 3, 'world', true, 'foo']) as Helper
//   performCheck(e, 'e', ['hello', 3, 'world', true, 'foo'])
// })

// test('enum with proto', (t) => {
//   interface MyEnumProto<A, B, C, D, E> {
//     prev(): MyEnum<A, B, C, D, E>
//   }

//   interface MyEnumProtoHKT extends HKT5 {
//     readonly type: MyEnumProto<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   type MyEnum<A, B, C, D, E> = MyEnumProto<A, B, C, D, E> &
//     (
//       | Case<'empty'>
//       | Case<'a', [A]>
//       | Case<'b', [A, B]>
//       | Case<'c', [A, B, C]>
//       | Case<'d', [A, B, C, D]>
//       | Case<'e', [A, B, C, D, E]>
//     )

//   interface MyEnumHKT extends HKT5 {
//     readonly type: MyEnum<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   const MyEnum = makeEnum5<MyEnumHKT, MyEnumProtoHKT>((MyEnum) => ({
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
//         case 'e':
//           return MyEnum.d([this[0], this[1], this[2], this[3]])
//       }
//     },
//   }))

//   type Helper = MyEnum<unknown, unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3 | 4, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown, unknown]>,
//     prev: unknown
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//     t.deepEqual(v[4], payload[4])
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

//   const e = MyEnum.e(['hello', 3, 'world', true, 'foo']) as Helper
//   performCheck(
//     e,
//     'e',
//     ['hello', 3, 'world', true, 'foo'],
//     MyEnum.d(['hello', 3, 'world', true])
//   )
// })

// test('enum with proto and type', (t) => {
//   interface MyEnumProto<A, B, C, D, E> {
//     prev(): MyEnum<A, B, C, D, E>
//   }

//   interface MyEnumProtoHKT extends HKT5 {
//     readonly type: MyEnumProto<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   type MyEnum<A, B, C, D, E> = MyEnumProto<A, B, C, D, E> &
//     (
//       | Case<'empty'>
//       | Case<'a', [A]>
//       | Case<'b', [A, B]>
//       | Case<'c', [A, B, C]>
//       | Case<'d', [A, B, C, D]>
//       | Case<'e', [A, B, C, D, E]>
//     )

//   interface MyEnumHKT extends HKT5 {
//     readonly type: MyEnum<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   interface MyEnumType {
//     make<A, B, C, D, E>(
//       ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D] | [A, B, C, D, E]
//     ): MyEnum<A, B, C, D, E>
//   }

//   const MyEnum = makeEnum5<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
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
//           case 'e':
//             return MyEnum.d([this[0], this[1], this[2], this[3]])
//         }
//       },
//     }),
//     {
//       make<A, B, C, D, E>(
//         ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D] | [A, B, C, D, E]
//       ): MyEnum<A, B, C, D, E> {
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
//           case 5:
//             return MyEnum.e(args)
//         }
//       },
//     }
//   )

//   type Helper = MyEnum<unknown, unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3 | 4, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown, unknown]>,
//     prev: unknown
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//     t.deepEqual(v[4], payload[4])
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

//   const e = MyEnum.e(['hello', 3, 'world', true, 'foo']) as Helper
//   performCheck(
//     e,
//     'e',
//     ['hello', 3, 'world', true, 'foo'],
//     MyEnum.d(['hello', 3, 'world', true])
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

//   const make_e = MyEnum.make('hello', 3, 'world', false, 'foo') as Helper
//   performCheck(
//     make_e,
//     'e',
//     ['hello', 3, 'world', false, 'foo'],
//     MyEnum.d(['hello', 3, 'world', false])
//   )
// })

// test('enum with type', (t) => {
//   type MyEnum<A, B, C, D, E> =
//     | Case<'empty'>
//     | Case<'a', [A]>
//     | Case<'b', [A, B]>
//     | Case<'c', [A, B, C]>
//     | Case<'d', [A, B, C, D]>
//     | Case<'e', [A, B, C, D, E]>

//   interface MyEnumHKT extends HKT5 {
//     readonly type: MyEnum<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   interface MyEnumType {
//     make<A, B, C, D, E>(
//       ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D] | [A, B, C, D, E]
//     ): MyEnum<A, B, C, D, E>
//   }

//   const MyEnum = makeEnum5<MyEnumHKT, MyEnumType>({
//     make<A, B, C, D, E>(
//       ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D] | [A, B, C, D, E]
//     ): MyEnum<A, B, C, D, E> {
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
//         case 5:
//           return MyEnum.e(args)
//       }
//     },
//   })

//   type Helper = MyEnum<unknown, unknown, unknown, unknown, unknown> &
//     Record<0 | 1 | 2 | 3 | 4, unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<[unknown, unknown, unknown, unknown, unknown]>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v[0], payload[0])
//     t.deepEqual(v[1], payload[1])
//     t.deepEqual(v[2], payload[2])
//     t.deepEqual(v[3], payload[3])
//     t.deepEqual(v[4], payload[4])
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

//   const e = MyEnum.e(['hello', 3, 'world', true, 'foo']) as Helper
//   performCheck(e, 'e', ['hello', 3, 'world', true, 'foo'])

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

//   const make_e = MyEnum.make('hello', 3, 'world', false, 'foo') as Helper
//   performCheck(make_e, 'e', ['hello', 3, 'world', false, 'foo'])
// })

// test('fully optional object payload', (t) => {
//   type MyEnum<A, B, C, D, E> =
//     | Case<'main', { a?: A; b?: B; c?: C; d?: D; e?: E }>
//     | Case<'other'>

//   interface MyEnumHKT extends HKT5 {
//     readonly type: MyEnum<
//       this['_A'],
//       this['_B'],
//       this['_C'],
//       this['_D'],
//       this['_E']
//     >
//   }

//   const MyEnum = makeEnum5<MyEnumHKT>()

//   type Helper = MyEnum<unknown, unknown, unknown, unknown, unknown> &
//     Record<'a' | 'b' | 'c' | 'd' | 'e', unknown>

//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<Record<'a' | 'b' | 'c' | 'd' | 'e', unknown>>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v.a, payload.a)
//     t.deepEqual(v.b, payload.b)
//     t.deepEqual(v.c, payload.c)
//     t.deepEqual(v.d, payload.d)
//     t.deepEqual(v.e, payload.e)
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

//   const main_e = MyEnum.main({ e: false }) as Helper
//   performCheck(main_e, 'main', { e: false })

//   const main_all = MyEnum.main({
//     a: 2,
//     b: 'hello',
//     c: 'world',
//     d: true,
//     e: false,
//   }) as Helper
//   performCheck(main_all, 'main', {
//     a: 2,
//     b: 'hello',
//     c: 'world',
//     d: true,
//     e: false,
//   })
// })
