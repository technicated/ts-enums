import test from 'ava'
import { Case } from './case'
import { HKT } from './hkt'
import { makeEnum } from './make-enum-1'

test('basic enum', (t) => {
  type MyEnum<T> = Case<'a'> | Case<'b', { value: T }> | Case<'c', [T]>

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  const MyEnum = makeEnum<MyEnumHKT>()

  const a = MyEnum.a() as MyEnum<number> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)

  const b = MyEnum.b({ value: 42 }) as MyEnum<number> &
    Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)

  const c = MyEnum.c(['hello']) as MyEnum<string> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
})

test('enum with proto', (t) => {
  interface MyEnumProto<T> {
    getValue(): T | undefined
  }

  interface MyEnumProtoHKT extends HKT {
    readonly type: MyEnumProto<this['_A']>
  }

  type MyEnum<T> = MyEnumProto<T> &
    (Case<'a'> | Case<'b', { value: T }> | Case<'c', [T]>)

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumProtoHKT>(() => ({
    getValue() {
      switch (this.case) {
        case 'a':
          return undefined
        case 'b':
          return this.value
        case 'c':
          return this[0]
      }
    },
  }))

  const a = MyEnum.a() as MyEnum<unknown> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a.getValue(), undefined)

  const b = MyEnum.b({ value: 42 }) as MyEnum<number> &
    Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(a.getValue(), undefined)

  const c = MyEnum.c(['hello']) as MyEnum<string> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(a.getValue(), undefined)
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<T> {
    getValue(): T | undefined
  }

  interface MyEnumProtoHKT extends HKT {
    readonly type: MyEnumProto<this['_A']>
  }

  type MyEnum<T> = MyEnumProto<T> &
    (Case<'a'> | Case<'b', { value: T }> | Case<'c', [T]>)

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  interface MyEnumType {
    make<T>(value?: T): MyEnum<T>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumProtoHKT, MyEnumType>(
    () => ({
      getValue() {
        switch (this.case) {
          case 'a':
            return undefined
          case 'b':
            return this.value
          case 'c':
            return this[0]
        }
      },
    }),
    {
      make<T>(value: T | undefined): MyEnum<T> {
        return value ? MyEnum.b({ value }) : MyEnum.a()
      },
    }
  )

  const a = MyEnum.a() as MyEnum<unknown> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a.getValue(), undefined)

  const b = MyEnum.b({ value: 42 }) as MyEnum<number> &
    Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(a.getValue(), undefined)

  const c = MyEnum.c(['hello']) as MyEnum<string> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(a.getValue(), undefined)

  const make_a = MyEnum.make() as MyEnum<unknown> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a.value, undefined)
  t.is(make_a[0], undefined)
  t.is(make_a.getValue(), undefined)

  const make_b = MyEnum.make(42) as MyEnum<unknown> &
    Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b.value, 42)
  t.is(make_b[0], undefined)
  t.is(make_b.getValue(), 42)
})

test('enum with type', (t) => {
  type MyEnum<T> = Case<'a'> | Case<'b', { value: T }> | Case<'c', [T]>

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  interface MyEnumType {
    make<T>(value?: T): MyEnum<T>
  }

  const MyEnum = makeEnum<MyEnumHKT, MyEnumType>({
    make<T>(value: T | undefined): MyEnum<T> {
      return value ? MyEnum.b({ value }) : MyEnum.a()
    },
  })

  const a = MyEnum.a() as MyEnum<unknown> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)

  const b = MyEnum.b({ value: 42 }) as MyEnum<number> &
    Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)

  const c = MyEnum.c(['hello']) as MyEnum<string> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')

  const make_a = MyEnum.make() as MyEnum<unknown> & Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a.value, undefined)
  t.is(make_a[0], undefined)

  const make_b = MyEnum.make(42) as MyEnum<unknown> &
    Record<0 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b.value, 42)
  t.is(make_b[0], undefined)
})
