import test from 'ava'
import { Case } from '../case'
import { makeEnum } from './make-enum'

test('basic enum', (t) => {
  type MyEnum =
    | Case<'a'>
    | Case<'b', { value: number }>
    | Case<'c', [string, number]>

  const MyEnum = makeEnum<MyEnum>()

  type Helper = MyEnum & Record<0 | 1 | 'value', unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<Record<0 | 1 | 'value', unknown>>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)
  }

  const a = MyEnum.a() as Helper
  performCheck(a, 'a', {})

  const b = MyEnum.b({ value: 42 }) as Helper
  performCheck(b, 'b', { value: 42 })

  const c = MyEnum.c(['hello', 42]) as Helper
  performCheck(c, 'c', { 0: 'hello', 1: 42 })
})

test('basic property owning', (t) => {
  type MyEnum =
    | Case<'a'>
    | Case<'b', { value: number }>
    | Case<'c', [string, number]>

  const MyEnum = makeEnum<MyEnum>()

  const performCheck = (
    v: MyEnum,
    flags: [boolean, boolean, boolean]
  ): void => {
    t.true('case' in v)
    t.is('value' in v, flags[0])
    t.is('0' in v, flags[1])
    t.is('1' in v, flags[2])
  }

  const a = MyEnum.a()
  performCheck(a, [false, false, false])

  const b = MyEnum.b({ value: 42 })
  performCheck(b, [true, false, false])

  const c = MyEnum.c(['hello', 42])
  performCheck(c, [false, true, true])
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

  type Helper = MyEnum & Record<0 | 1 | 'value', unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<Record<0 | 1 | 'value', unknown>>,
    number: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)
    t.is(v.self, v)
    t.deepEqual(v.getNumber(), number)
  }

  const a = MyEnum.a() as Helper
  performCheck(a, 'a', {}, -1)

  const b = MyEnum.b({ value: 42 }) as Helper
  performCheck(b, 'b', { value: 42 }, 42)

  const c = MyEnum.c(['hello', 42]) as Helper
  performCheck(c, 'c', { 0: 'hello', 1: 42 }, 1764)
})

test('property owning with proto', (t) => {
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

  const performCheck = (
    v: MyEnum,
    flags: [boolean, boolean, boolean]
  ): void => {
    t.true('case' in v)
    t.true('self' in v)
    t.true('getNumber' in v)
    t.is('value' in v, flags[0])
    t.is('0' in v, flags[1])
    t.is('1' in v, flags[2])
  }

  const a = MyEnum.a()
  performCheck(a, [false, false, false])

  const b = MyEnum.b({ value: 42 })
  performCheck(b, [true, false, false])

  const c = MyEnum.c(['hello', 42])
  performCheck(c, [false, true, true])
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

  type Helper = MyEnum & Record<0 | 1 | 'value', unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<Record<0 | 1 | 'value', unknown>>,
    number: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)
    t.is(v.self, v)
    t.deepEqual(v.getNumber(), number)
  }

  const a = MyEnum.a() as Helper
  performCheck(a, 'a', {}, -1)

  const b = MyEnum.b({ value: 42 }) as Helper
  performCheck(b, 'b', { value: 42 }, 42)

  const c = MyEnum.c(['hello', 42]) as Helper
  performCheck(c, 'c', { 0: 'hello', 1: 42 }, 1764)

  const make_a = MyEnum.make() as Helper
  performCheck(make_a, 'a', {}, -1)

  const make_b = MyEnum.make(42) as Helper
  performCheck(make_b, 'b', { value: 42 }, 42)

  const make_c = MyEnum.make(42, 'hello') as Helper
  performCheck(make_c, 'c', { 0: 'hello', 1: 42 }, 1764)
})

test('property owning with proto and type', (t) => {
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

  const performCheck = (
    v: MyEnum,
    flags: [boolean, boolean, boolean]
  ): void => {
    t.true('case' in v)
    t.true('self' in v)
    t.true('getNumber' in v)
    t.is('value' in v, flags[0])
    t.is('0' in v, flags[1])
    t.is('1' in v, flags[2])
  }

  t.true('make' in MyEnum)

  const a = MyEnum.a()
  performCheck(a, [false, false, false])

  const b = MyEnum.b({ value: 42 })
  performCheck(b, [true, false, false])

  const c = MyEnum.c(['hello', 42])
  performCheck(c, [false, true, true])
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

  type Helper = MyEnum & Record<0 | 1 | 'value', unknown>

  const performCheck = (
    v: Helper,
    c: string,
    payload: Partial<Record<0 | 1 | 'value', unknown>>
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)
  }

  const a = MyEnum.a() as Helper
  performCheck(a, 'a', {})

  const b = MyEnum.b({ value: 42 }) as Helper
  performCheck(b, 'b', { value: 42 })

  const c = MyEnum.c(['hello', 42]) as Helper
  performCheck(c, 'c', { 0: 'hello', 1: 42 })

  const make_a = MyEnum.make() as Helper
  performCheck(make_a, 'a', {})

  const make_b = MyEnum.make(42) as Helper
  performCheck(make_b, 'b', { value: 42 })

  const make_c = MyEnum.make(42, 'hello') as Helper
  performCheck(make_c, 'c', { 0: 'hello', 1: 42 })
})

test('property owning with type', (t) => {
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

  const performCheck = (
    v: MyEnum,
    flags: [boolean, boolean, boolean]
  ): void => {
    t.true('case' in v)
    t.is('value' in v, flags[0])
    t.is('0' in v, flags[1])
    t.is('1' in v, flags[2])
  }

  t.true('make' in MyEnum)

  const a = MyEnum.a()
  performCheck(a, [false, false, false])

  const b = MyEnum.b({ value: 42 })
  performCheck(b, [true, false, false])

  const c = MyEnum.c(['hello', 42])
  performCheck(c, [false, true, true])
})
