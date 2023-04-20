import test from 'ava'
import { Case, cases } from '../case'
import { HKT3 } from '../hkt'
import { makeEnum3 } from './make-enum'
import { CasesOf } from './types'

test('basic enum', (t) => {
  type MyEnum<A, B, C> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  const MyEnum = makeEnum3<MyEnumHKT>()

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const performCheck = (
    v: Helper,
    c: CasesOf<typeof MyEnum>,
    payload: Partial<[unknown, unknown, unknown]>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v[2], payload[2])
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [])

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'])

  const c = MyEnum.c(['hello', 3, 'world']) as Helper
  performCheck(c, 'c', ['hello', 3, 'world'])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A, B, C> {
    prev(): MyEnum<A, B, C>
  }

  interface MyEnumProtoHKT extends HKT3 {
    readonly type: MyEnumProto<this['_A'], this['_B'], this['_C']>
  }

  type MyEnum<A, B, C> = MyEnumProto<A, B, C> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]> | Case<'c', [A, B, C]>)

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  const MyEnum = makeEnum3<MyEnumHKT, MyEnumProtoHKT>((MyEnum) => ({
    prev() {
      switch (this.case) {
        case 'empty':
          return MyEnum.empty()
        case 'a':
          return MyEnum.empty()
        case 'b':
          return MyEnum.a([this[0]])
        case 'c':
          return MyEnum.b([this[0], this[1]])
      }
    },
  }))

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const performCheck = (
    v: Helper,
    c: CasesOf<typeof MyEnum>,
    payload: Partial<[unknown, unknown, unknown]>,
    prev: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v[2], payload[2])
    t.deepEqual(v.prev(), prev)
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [], MyEnum.empty())

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1], MyEnum.empty())

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

  const c = MyEnum.c(['hello', 3, 'world']) as Helper
  performCheck(c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A, B, C> {
    prev(): MyEnum<A, B, C>
  }

  interface MyEnumProtoHKT extends HKT3 {
    readonly type: MyEnumProto<this['_A'], this['_B'], this['_C']>
  }

  type MyEnum<A, B, C> = MyEnumProto<A, B, C> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]> | Case<'c', [A, B, C]>)

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  interface MyEnumType {
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C>
  }

  const MyEnum = makeEnum3<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
    (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
          case 'b':
            return MyEnum.a([this[0]])
          case 'c':
            return MyEnum.b([this[0], this[1]])
        }
      },
    }),
    {
      make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C> {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
          case 2:
            return MyEnum.b(args)
          case 3:
            return MyEnum.c(args)
        }
      },
    }
  )

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const performCheck = (
    v: Helper,
    c: CasesOf<typeof MyEnum>,
    payload: Partial<[unknown, unknown, unknown]>,
    prev: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v[2], payload[2])
    t.deepEqual(v.prev(), prev)
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [], MyEnum.empty())

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1], MyEnum.empty())

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

  const c = MyEnum.c(['hello', 3, 'world']) as Helper
  performCheck(c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

  const make_empty = MyEnum.make() as Helper
  performCheck(make_empty, 'empty', [], MyEnum.empty())

  const make_a = MyEnum.make(1) as Helper
  performCheck(make_a, 'a', [1], MyEnum.empty())

  const make_b = MyEnum.make(2, 'hello') as Helper
  performCheck(make_b, 'b', [2, 'hello'], MyEnum.a([2]))

  const make_c = MyEnum.make('hello', 3, 'world') as Helper
  performCheck(make_c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))
})

test('enum with type', (t) => {
  type MyEnum<A, B, C> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  interface MyEnumType {
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C>
  }

  const MyEnum = makeEnum3<MyEnumHKT, MyEnumType>({
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C> {
      switch (args.length) {
        case 0:
          return MyEnum.empty()
        case 1:
          return MyEnum.a(args)
        case 2:
          return MyEnum.b(args)
        case 3:
          return MyEnum.c(args)
      }
    },
  })

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const performCheck = (
    v: Helper,
    c: CasesOf<typeof MyEnum>,
    payload: Partial<[unknown, unknown, unknown]>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v[2], payload[2])
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [])

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'])

  const c = MyEnum.c(['hello', 3, 'world']) as Helper
  performCheck(c, 'c', ['hello', 3, 'world'])

  const make_empty = MyEnum.make() as Helper
  performCheck(make_empty, 'empty', [])

  const make_a = MyEnum.make(1) as Helper
  performCheck(make_a, 'a', [1])

  const make_b = MyEnum.make(2, 'hello') as Helper
  performCheck(make_b, 'b', [2, 'hello'])

  const make_c = MyEnum.make('hello', 3, 'world') as Helper
  performCheck(make_c, 'c', ['hello', 3, 'world'])
})
