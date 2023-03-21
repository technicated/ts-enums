import test from 'ava'
import { Case } from '../case'
import { HKT2 } from '../hkt'
import { makeEnum2 } from './make-enum'

test('basic enum', (t) => {
  type MyEnum<A, B> = Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum2<MyEnumHKT>()

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown, unknown]>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [])

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A, B> {
    prev(): MyEnum<A, B>
  }

  interface MyEnumProtoHKT extends HKT2 {
    readonly type: MyEnumProto<this['_A'], this['_B']>
  }

  type MyEnum<A, B> = MyEnumProto<A, B> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum2<MyEnumHKT, MyEnumProtoHKT>((MyEnum) => ({
    prev() {
      switch (this.case) {
        case 'empty':
          return MyEnum.empty()
        case 'a':
          return MyEnum.empty()
        case 'b':
          return MyEnum.a([this[0]])
      }
    },
  }))

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown, unknown]>,
    prev: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.prev(), prev)
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [], MyEnum.empty())

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1], MyEnum.empty())

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A, B> {
    prev(): MyEnum<A, B>
  }

  interface MyEnumProtoHKT extends HKT2 {
    readonly type: MyEnumProto<this['_A'], this['_B']>
  }

  type MyEnum<A, B> = MyEnumProto<A, B> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  interface MyEnumType {
    make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B>
  }

  const MyEnum = makeEnum2<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
    (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
          case 'b':
            return MyEnum.a([this[0]])
        }
      },
    }),
    {
      make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B> {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
          case 2:
            return MyEnum.b(args)
        }
      },
    }
  )

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown, unknown]>,
    prev: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.prev(), prev)
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [], MyEnum.empty())

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1], MyEnum.empty())

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

  const make_empty = MyEnum.make() as Helper
  performCheck(make_empty, 'empty', [], MyEnum.empty())

  const make_a = MyEnum.make(1) as Helper
  performCheck(make_a, 'a', [1], MyEnum.empty())

  const make_b = MyEnum.make(2, 'hello') as Helper
  performCheck(make_b, 'b', [2, 'hello'], MyEnum.a([2]))
})

test('enum with type', (t) => {
  type MyEnum<A, B> = Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  interface MyEnumType {
    make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B>
  }

  const MyEnum = makeEnum2<MyEnumHKT, MyEnumType>({
    make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B> {
      switch (args.length) {
        case 0:
          return MyEnum.empty()
        case 1:
          return MyEnum.a(args)
        case 2:
          return MyEnum.b(args)
      }
    },
  })

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown, unknown]>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [])

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello']) as Helper
  performCheck(b, 'b', [2, 'hello'])

  const make_empty = MyEnum.make() as Helper
  performCheck(make_empty, 'empty', [])

  const make_a = MyEnum.make(1) as Helper
  performCheck(make_a, 'a', [1])

  const make_b = MyEnum.make(2, 'hello') as Helper
  performCheck(make_b, 'b', [2, 'hello'])
})
