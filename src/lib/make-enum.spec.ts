import test from 'ava'
import { Case } from './case'
import { makeEnum } from './make-enum'

test('basic enum', (t) => {
  type MyEnum =
    | Case<'a'>
    | Case<'b', { value: number }>
    | Case<'c', [string, number]>

  const MyEnum = makeEnum<MyEnum>()

  const a = MyEnum.a() as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)

  const b = MyEnum.b({ value: 42 }) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)

  const c = MyEnum.c(['hello', 42]) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(c[1], 42)
})

test('enum with proto', (t) => {
  interface MyEnumProto {
    self: this
    getNumber(): number
  }

  type MyEnum = MyEnumProto &
    (Case<'a'> | Case<'b', { value: number }> | Case<'c', [string, number]>)

  const MyEnum = makeEnum<MyEnum, MyEnumProto>(() => ({
    get self(): MyEnum {
      return this
    },
    getNumber() {
      switch (this.case) {
        case 'a':
          return -1
        case 'b':
          return this.value
        case 'c':
          return this[1] * this[1]
      }
    },
  }))

  const a = MyEnum.a() as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a.self, a)
  t.is(a.getNumber(), -1)

  const b = MyEnum.b({ value: 42 }) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)
  t.is(b.self, b)
  t.is(b.getNumber(), 42)

  const c = MyEnum.c(['hello', 42]) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(c[1], 42)
  t.is(c.self, c)
  t.is(c.getNumber(), 1764)
})

test('enum with proto and type', (t) => {
  interface MyEnumProto {
    self: this
    getNumber(): number
  }

  interface MyEnumType {
    make(...args: [] | [n: number] | [n: number, s: string]): MyEnum
  }

  type MyEnum = MyEnumProto &
    (Case<'a'> | Case<'b', { value: number }> | Case<'c', [string, number]>)

  const MyEnum = makeEnum<MyEnum, MyEnumProto, MyEnumType>(
    () => ({
      get self(): MyEnum {
        return this
      },
      getNumber() {
        switch (this.case) {
          case 'a':
            return -1
          case 'b':
            return this.value
          case 'c':
            return this[1] * this[1]
        }
      },
    }),
    {
      make(...args): MyEnum {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b({ value: args[0] })
          case 2:
            return MyEnum.c([args[1], args[0]])
        }
      },
    }
  )

  const a = MyEnum.a() as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a.self, a)
  t.is(a.getNumber(), -1)

  const b = MyEnum.b({ value: 42 }) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)
  t.is(b.self, b)
  t.is(b.getNumber(), 42)

  const c = MyEnum.c(['hello', 42]) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(c[1], 42)
  t.is(c.self, c)
  t.is(c.getNumber(), 1764)

  const make_a = MyEnum.make() as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a.value, undefined)
  t.is(make_a[0], undefined)
  t.is(make_a[1], undefined)
  t.is(make_a.self, make_a)
  t.is(make_a.getNumber(), -1)

  const make_b = MyEnum.make(42) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b.value, 42)
  t.is(make_b[0], undefined)
  t.is(make_b[1], undefined)
  t.is(make_b.self, make_b)
  t.is(make_b.getNumber(), 42)

  const make_c = MyEnum.make(42, 'hello') as MyEnum &
    Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_c, 'case')?.writable)
  t.is(make_c.case, 'c')
  t.is(make_c.value, undefined)
  t.is(make_c[0], 'hello')
  t.is(make_c[1], 42)
  t.is(make_c.self, make_c)
  t.is(make_c.getNumber(), 1764)
})

test('enum with type', (t) => {
  interface MyEnumType {
    make(...args: [] | [n: number] | [n: number, s: string]): MyEnum
  }

  type MyEnum =
    | Case<'a'>
    | Case<'b', { value: number }>
    | Case<'c', [string, number]>

  const MyEnum = makeEnum<MyEnum, MyEnumType>({
    make(...args): MyEnum {
      switch (args.length) {
        case 0:
          return MyEnum.a()
        case 1:
          return MyEnum.b({ value: args[0] })
        case 2:
          return MyEnum.c([args[1], args[0]])
      }
    },
  })

  const a = MyEnum.a() as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)

  const b = MyEnum.b({ value: 42 }) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)

  const c = MyEnum.c(['hello', 42]) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(c[1], 42)

  const make_a = MyEnum.make() as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_a, 'case')?.writable)
  t.is(make_a.case, 'a')
  t.is(make_a.value, undefined)
  t.is(make_a[0], undefined)
  t.is(make_a[1], undefined)

  const make_b = MyEnum.make(42) as MyEnum & Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_b, 'case')?.writable)
  t.is(make_b.case, 'b')
  t.is(make_b.value, 42)
  t.is(make_b[0], undefined)
  t.is(make_b[1], undefined)

  const make_c = MyEnum.make(42, 'hello') as MyEnum &
    Record<0 | 1 | 'value', unknown>
  t.false(Object.getOwnPropertyDescriptor(make_c, 'case')?.writable)
  t.is(make_c.case, 'c')
  t.is(make_c.value, undefined)
  t.is(make_c[0], 'hello')
  t.is(make_c[1], 42)
})
