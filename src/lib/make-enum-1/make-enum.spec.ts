import test from 'ava'
import { Case } from '../case'
import { HKT } from '../hkt'
import { makeEnum1 } from './make-enum'

test('basic enum', (t) => {
  type MyEnum<A> = Case<'empty'> | Case<'a', [A]>

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  const MyEnum = makeEnum1<MyEnumHKT>()

  type Helper = MyEnum<unknown> & Record<0, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown]>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [])

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A> {
    prev(): MyEnum<A>
  }

  interface MyEnumProtoHKT extends HKT {
    readonly type: MyEnumProto<this['_A']>
  }

  type MyEnum<A> = MyEnumProto<A> & (Case<'empty'> | Case<'a', [A]>)

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  const MyEnum = makeEnum1<MyEnumHKT, MyEnumProtoHKT>((MyEnum) => ({
    prev() {
      switch (this.case) {
        case 'empty':
          return MyEnum.empty()
        case 'a':
          return MyEnum.empty()
      }
    },
  }))

  type Helper = MyEnum<unknown> & Record<0, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown]>,
    prev: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v.prev(), prev)
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [], MyEnum.empty())

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1], MyEnum.empty())
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A> {
    prev(): MyEnum<A>
  }

  interface MyEnumProtoHKT extends HKT {
    readonly type: MyEnumProto<this['_A']>
  }

  type MyEnum<A> = MyEnumProto<A> & (Case<'empty'> | Case<'a', [A]>)

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  interface MyEnumType {
    make<A>(...args: [] | [A]): MyEnum<A>
  }

  const MyEnum = makeEnum1<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
    (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
        }
      },
    }),
    {
      make<A>(...args: [] | [A]): MyEnum<A> {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
        }
      },
    }
  )

  type Helper = MyEnum<unknown> & Record<0, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown]>,
    prev: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v.prev(), prev)
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [], MyEnum.empty())

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1], MyEnum.empty())

  const make_empty = MyEnum.make() as Helper
  performCheck(make_empty, 'empty', [], MyEnum.empty())

  const make_a = MyEnum.make(1) as Helper
  performCheck(make_a, 'a', [1], MyEnum.empty())
})

test('enum with type', (t) => {
  type MyEnum<A> = Case<'empty'> | Case<'a', [A]>

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  interface MyEnumType {
    make<A>(...args: [] | [A]): MyEnum<A>
  }

  const MyEnum = makeEnum1<MyEnumHKT, MyEnumType>({
    make<A>(...args: [] | [A]): MyEnum<A> {
      switch (args.length) {
        case 0:
          return MyEnum.empty()
        case 1:
          return MyEnum.a(args)
      }
    },
  })

  type Helper = MyEnum<unknown> & Record<0, unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<[unknown]>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
  }

  const empty = MyEnum.empty() as Helper
  performCheck(empty, 'empty', [])

  const a = MyEnum.a([1]) as Helper
  performCheck(a, 'a', [1])

  const make_empty = MyEnum.make() as Helper
  performCheck(make_empty, 'empty', [])

  const make_a = MyEnum.make(1) as Helper
  performCheck(make_a, 'a', [1])
})
