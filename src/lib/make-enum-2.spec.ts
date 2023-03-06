import test from 'ava'
import { Case } from './case'
import { HKT2 } from './hkt'
import { makeEnum } from './make-enum-2'

test('basic enum', (t) => {
  type MyEnum<U, V> = Case<'a'> | Case<'b', { value: U }> | Case<'c', [U, V]>

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum<MyEnumHKT>()

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1 | 'value', unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)

  const b = MyEnum.b({ value: 42 }) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)

  const c = MyEnum.c([42, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 42)
  t.is(c[1], 'hello')
})

test('enum with proto', (t) => {
  interface MyEnumProto<U, V> {
    getBoth(): [U?, V?]
  }

  interface MyEnumProtoHKT extends HKT2 {
    readonly type: MyEnumProto<this['_A'], this['_B']>
  }

  type MyEnum<U, V> = MyEnumProto<U, V> &
    (Case<'a'> | Case<'b', { value: U }> | Case<'c', [U, V]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumProtoHKT>(() => ({
    getBoth() {
      switch (this.case) {
        case 'a':
          return []
        case 'b':
          return [this.value]
        case 'c':
          return [this[0], this[1]]
      }
    },
  }))

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1 | 'value', unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.deepEqual(a.getBoth(), [])

  const b = MyEnum.b({ value: 42 }) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)
  t.deepEqual(b.getBoth(), [42])

  const c = MyEnum.c([42, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 42)
  t.is(c[1], 'hello')
  t.deepEqual(c.getBoth(), [42, 'hello'])
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<U, V> {
    getBoth(): [U?, V?]
  }

  interface MyEnumProtoHKT extends HKT2 {
    readonly type: MyEnumProto<this['_A'], this['_B']>
  }

  type MyEnum<U, V> = MyEnumProto<U, V> &
    (Case<'a'> | Case<'b', { value: U }> | Case<'c', [U, V]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  interface MyEnumType {
    make<U, V>(...args: [] | [U] | [U, V]): MyEnum<U, V>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
    () => ({
      getBoth() {
        switch (this.case) {
          case 'a':
            return []
          case 'b':
            return [this.value]
          case 'c':
            return [this[0], this[1]]
        }
      },
    }),
    {
      make<U, V>(...args: [] | [U] | [U, V]): MyEnum<U, V> {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b({ value: args[0] })
          case 2:
            return MyEnum.c(args)
        }
      },
    }
  )

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1 | 'value', unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.deepEqual(a.getBoth(), [])

  const b = MyEnum.b({ value: 42 }) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)
  t.deepEqual(b.getBoth(), [42])

  const c = MyEnum.c([42, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 42)
  t.is(c[1], 'hello')
  t.deepEqual(c.getBoth(), [42, 'hello'])

  const make_a = MyEnum.make() as Helper
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a.value, undefined)
  t.is(make_a[0], undefined)
  t.is(make_a[1], undefined)
  t.deepEqual(make_a.getBoth(), [])

  const make_b = MyEnum.make(42) as Helper
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b.value, 42)
  t.is(make_b[0], undefined)
  t.is(make_b[1], undefined)
  t.deepEqual(make_b.getBoth(), [42])

  const make_c = MyEnum.make('hello', 42) as Helper
  t.false(Object.getOwnPropertyDescriptor(make_c, 'case')?.writable)
  t.is(make_c.case, 'c')
  t.is(make_c.value, undefined)
  t.is(make_c[0], 'hello')
  t.is(make_c[1], 42)
  t.deepEqual(make_c.getBoth(), ['hello', 42])
})

test('enum with type', (t) => {
  type MyEnum<U, V> = Case<'a'> | Case<'b', { value: U }> | Case<'c', [U, V]>

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  interface MyEnumType {
    make<U, V>(...args: [] | [U] | [U, V]): MyEnum<U, V>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumType>({
    make<U, V>(...args: [] | [U] | [U, V]): MyEnum<U, V> {
      switch (args.length) {
        case 0:
          return MyEnum.a()
        case 1:
          return MyEnum.b({ value: args[0] })
        case 2:
          return MyEnum.c(args)
      }
    },
  })

  type Helper = MyEnum<unknown, unknown> & Record<0 | 1 | 'value', unknown>

  const a = MyEnum.a() as Helper
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)

  const b = MyEnum.b({ value: 42 }) as Helper
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)

  const c = MyEnum.c([42, 'hello']) as Helper
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 42)
  t.is(c[1], 'hello')

  const make_a = MyEnum.make() as Helper
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a.value, undefined)
  t.is(make_a[0], undefined)
  t.is(make_a[1], undefined)

  const make_b = MyEnum.make(42) as Helper
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b.value, 42)
  t.is(make_b[0], undefined)
  t.is(make_b[1], undefined)

  const make_c = MyEnum.make('hello', 42) as Helper
  t.false(Object.getOwnPropertyDescriptor(make_c, 'case')?.writable)
  t.is(make_c.case, 'c')
  t.is(make_c.value, undefined)
  t.is(make_c[0], 'hello')
  t.is(make_c[1], 42)
})
