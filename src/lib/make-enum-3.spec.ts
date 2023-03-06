import test from 'ava'
import { Case } from './case'
import { HKT3 } from './hkt'
import { makeEnum } from './make-enum-3'

test('basic enum', (t) => {
  type MyEnum<A, B, C> =
    | Case<'a'>
    | Case<'b', [A]>
    | Case<'c', [A, B]>
    | Case<'d', [A, B, C]>

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  const MyEnum = makeEnum<MyEnumHKT>()

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a[2], undefined)

  const b = MyEnum.b([1]) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b[0], 1)
  t.is(b[1], undefined)
  t.is(b[2], undefined)

  const c = MyEnum.c([2, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c[0], 2)
  t.is(c[1], 'hello')
  t.is(c[2], undefined)

  const d = MyEnum.d(['hello', 3, 'world']) as Helper
  t.false(Object.getOwnPropertyDescriptor(d, 'case')?.writable)
  t.is(d.case, 'd')
  t.is(d[0], 'hello')
  t.is(d[1], 3)
  t.is(d[2], 'world')
})

test('enum with proto', (t) => {
  interface MyEnumProto<A, B, C> {
    prev(): MyEnum<A, B, C>
  }

  interface MyEnumProtoHKT extends HKT3 {
    readonly type: MyEnumProto<this['_A'], this['_B'], this['_C']>
  }

  type MyEnum<A, B, C> = MyEnumProto<A, B, C> &
    (Case<'a'> | Case<'b', [A]> | Case<'c', [A, B]> | Case<'d', [A, B, C]>)

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumProtoHKT>((MyEnum) => ({
    prev() {
      switch (this.case) {
        case 'a':
          return MyEnum.a()
        case 'b':
          return MyEnum.a()
        case 'c':
          return MyEnum.b([this[0]])
        case 'd':
          return MyEnum.c([this[0], this[1]])
      }
    },
  }))

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a[2], undefined)
  t.deepEqual(a.prev(), MyEnum.a())

  const b = MyEnum.b([1]) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b[0], 1)
  t.is(b[1], undefined)
  t.is(b[2], undefined)
  t.deepEqual(b.prev(), MyEnum.a())

  const c = MyEnum.c([2, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c[0], 2)
  t.is(c[1], 'hello')
  t.is(c[2], undefined)
  t.deepEqual(c.prev(), MyEnum.b([2]))

  const d = MyEnum.d(['hello', 3, 'world']) as Helper
  t.false(Object.getOwnPropertyDescriptor(d, 'case')?.writable)
  t.is(d.case, 'd')
  t.is(d[0], 'hello')
  t.is(d[1], 3)
  t.is(d[2], 'world')
  t.deepEqual(d.prev(), MyEnum.c(['hello', 3]))
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A, B, C> {
    prev(): MyEnum<A, B, C>
  }

  interface MyEnumProtoHKT extends HKT3 {
    readonly type: MyEnumProto<this['_A'], this['_B'], this['_C']>
  }

  type MyEnum<A, B, C> = MyEnumProto<A, B, C> &
    (Case<'a'> | Case<'b', [A]> | Case<'c', [A, B]> | Case<'d', [A, B, C]>)

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  interface MyEnumType {
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
    (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'a':
            return MyEnum.a()
          case 'b':
            return MyEnum.a()
          case 'c':
            return MyEnum.b([this[0]])
          case 'd':
            return MyEnum.c([this[0], this[1]])
        }
      },
    }),
    {
      make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C> {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b(args)
          case 2:
            return MyEnum.c(args)
          case 3:
            return MyEnum.d(args)
        }
      },
    }
  )

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a[2], undefined)
  t.deepEqual(a.prev(), MyEnum.a())

  const b = MyEnum.b([1]) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b[0], 1)
  t.is(b[1], undefined)
  t.is(b[2], undefined)
  t.deepEqual(b.prev(), MyEnum.a())

  const c = MyEnum.c([2, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c[0], 2)
  t.is(c[1], 'hello')
  t.is(c[2], undefined)
  t.deepEqual(c.prev(), MyEnum.b([2]))

  const d = MyEnum.d(['hello', 3, 'world']) as Helper
  t.false(Object.getOwnPropertyDescriptor(d, 'case')?.writable)
  t.is(d.case, 'd')
  t.is(d[0], 'hello')
  t.is(d[1], 3)
  t.is(d[2], 'world')
  t.deepEqual(d.prev(), MyEnum.c(['hello', 3]))

  const make_a = MyEnum.make() as Helper
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a[0], undefined)
  t.is(make_a[1], undefined)
  t.is(make_a[2], undefined)
  t.deepEqual(make_a.prev(), MyEnum.a())

  const make_b = MyEnum.make(1) as Helper
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b[0], 1)
  t.is(make_b[1], undefined)
  t.is(make_b[2], undefined)
  t.deepEqual(make_b.prev(), MyEnum.a())

  const make_c = MyEnum.make(2, 'hello') as Helper
  t.false(Object.getOwnPropertyDescriptor(make_c, 'case')?.writable)
  t.is(make_c.case, 'c')
  t.is(make_c[0], 2)
  t.is(make_c[1], 'hello')
  t.is(make_c[2], undefined)
  t.deepEqual(make_c.prev(), MyEnum.b([2]))

  const make_d = MyEnum.make('hello', 3, 'world') as Helper
  t.false(Object.getOwnPropertyDescriptor(make_d, 'case')?.writable)
  t.is(make_d.case, 'd')
  t.is(make_d[0], 'hello')
  t.is(make_d[1], 3)
  t.is(make_d[2], 'world')
  t.deepEqual(make_d.prev(), MyEnum.c(['hello', 3]))
})

test('enum with type', (t) => {
  type MyEnum<A, B, C> =
    | Case<'a'>
    | Case<'b', [A]>
    | Case<'c', [A, B]>
    | Case<'d', [A, B, C]>

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  interface MyEnumType {
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumType>({
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C> {
      switch (args.length) {
        case 0:
          return MyEnum.a()
        case 1:
          return MyEnum.b(args)
        case 2:
          return MyEnum.c(args)
        case 3:
          return MyEnum.d(args)
      }
    },
  })

  type Helper = MyEnum<unknown, unknown, unknown> & Record<0 | 1 | 2, unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a[2], undefined)

  const b = MyEnum.b([1]) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b[0], 1)
  t.is(b[1], undefined)
  t.is(b[2], undefined)

  const c = MyEnum.c([2, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c[0], 2)
  t.is(c[1], 'hello')
  t.is(c[2], undefined)

  const d = MyEnum.d(['hello', 3, 'world']) as Helper
  t.false(Object.getOwnPropertyDescriptor(d, 'case')?.writable)
  t.is(d.case, 'd')
  t.is(d[0], 'hello')
  t.is(d[1], 3)
  t.is(d[2], 'world')

  const make_a = MyEnum.make() as Helper
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a[0], undefined)
  t.is(make_a[1], undefined)
  t.is(make_a[2], undefined)

  const make_b = MyEnum.make(1) as Helper
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b[0], 1)
  t.is(make_b[1], undefined)
  t.is(make_b[2], undefined)

  const make_c = MyEnum.make(2, 'hello') as Helper
  t.false(Object.getOwnPropertyDescriptor(make_c, 'case')?.writable)
  t.is(make_c.case, 'c')
  t.is(make_c[0], 2)
  t.is(make_c[1], 'hello')
  t.is(make_c[2], undefined)

  const make_d = MyEnum.make('hello', 3, 'world') as Helper
  t.false(Object.getOwnPropertyDescriptor(make_d, 'case')?.writable)
  t.is(make_d.case, 'd')
  t.is(make_d[0], 'hello')
  t.is(make_d[1], 3)
  t.is(make_d[2], 'world')
})
