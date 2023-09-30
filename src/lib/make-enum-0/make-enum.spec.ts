import test, { ExecutionContext } from 'ava'
import { Case, cases } from '../case'
import { unit, Unit } from '../unit'
import { makeEnum } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Unit | Partial<Record<0 | 1 | 'value', unknown>>

interface MakePerformEqualityCheckFn {
  <Enum extends EnumShape, Args extends unknown[]>(
    t: ExecutionContext<unknown>,
    enumCtors: EnumCtors<Enum>,
    extra?: (v: Enum, ...args: Args) => void
  ): (
    v: Enum & { p: FullPayload },
    c: CasesOf<EnumCtors<Enum>>,
    payload: Exclude<FullPayload, Unit>,
    ...args: Args
  ) => void
}

const makePerformEqualityCheck: MakePerformEqualityCheckFn = (
  t,
  enumCtors,
  extra
) => {
  return (v, c, payload, ...args): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(enumCtors[cases][c], c)

    if (v.p !== unit) {
      t.deepEqual(v.p[0], payload[0])
      t.deepEqual(v.p[1], payload[1])
      t.deepEqual(v.p.value, payload.value)
    }

    t.true(!!extra || args.length === 0)
    extra?.(v, ...args)
  }
}

interface MakePerformOwnershipCheckFn {
  <Enum extends EnumShape, Args extends unknown[]>(
    t: ExecutionContext<unknown>,
    extra?: (v: Enum, ...args: Args) => void
  ): (
    v: Enum & { p: FullPayload },
    flags: [boolean, boolean, boolean],
    ...args: Args
  ) => void
}

const makePerformOwnershipCheck: MakePerformOwnershipCheckFn = (t, extra) => {
  return (v, flags, ...args): void => {
    t.true('case' in v)

    if (v.p !== unit) {
      t.is('value' in v.p, flags[0])
      t.is('0' in v.p, flags[1])
      t.is('1' in v.p, flags[2])
    }

    extra?.(v, ...args)
  }
}

test('basic enum', (t) => {
  type MyEnum =
    | Case<'a'>
    | Case<'b', { value: number }>
    | Case<'c', [string, number]>

  const MyEnum = makeEnum<MyEnum>()

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const a = MyEnum.a()
  performCheck(a, 'a', {})

  const b = MyEnum.b({ value: 42 })
  performCheck(b, 'b', { value: 42 })

  const c = MyEnum.c(['hello', 42])
  performCheck(c, 'c', ['hello', 42])
})

test('basic property owning', (t) => {
  type MyEnum =
    | Case<'a'>
    | Case<'b', { value: number }>
    | Case<'c', [string, number]>

  const MyEnum = makeEnum<MyEnum>()

  const performCheck = makePerformOwnershipCheck(t)

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

  const MyEnum = makeEnum<MyEnum>({
    makeProto: () => ({
      get self(): MyEnum {
        return this
      },
      getNumber() {
        switch (this.case) {
          case 'a':
            return -1
          case 'b':
            return this.p.value
          case 'c':
            return this.p[1] * this.p[1]
        }
      },
    }),
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum, (v, number) => {
    t.is(v.self, v)
    t.deepEqual(v.getNumber(), number)
  })

  const a = MyEnum.a()
  performCheck(a, 'a', {}, -1)

  const b = MyEnum.b({ value: 42 })
  performCheck(b, 'b', { value: 42 }, 42)

  const c = MyEnum.c(['hello', 42])
  performCheck(c, 'c', ['hello', 42], 1764)
})

test('property owning with proto', (t) => {
  interface MyEnumProto {
    self: this

    getNumber(): number
  }

  type MyEnum = MyEnumProto &
    (Case<'a'> | Case<'b', { value: number }> | Case<'c', [string, number]>)

  const MyEnum = makeEnum<MyEnum>({
    makeProto: () => ({
      get self(): MyEnum {
        return this
      },
      getNumber() {
        switch (this.case) {
          case 'a':
            return -1
          case 'b':
            return this.p.value
          case 'c':
            return this.p[1] * this.p[1]
        }
      },
    }),
  })

  const performCheck = makePerformOwnershipCheck(t, (v) => {
    t.true('self' in v)
    t.true('getNumber' in v)
  })

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

  const MyEnum = makeEnum<MyEnum, MyEnumType>({
    makeProto: () => ({
      get self(): MyEnum {
        return this
      },
      getNumber() {
        switch (this.case) {
          case 'a':
            return -1
          case 'b':
            return this.p.value
          case 'c':
            return this.p[1] * this.p[1]
        }
      },
    }),
    type: {
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
    },
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum, (v, number) => {
    t.is(v.self, v)
    t.deepEqual(v.getNumber(), number)
  })

  const a = MyEnum.a()
  performCheck(a, 'a', {}, -1)

  const b = MyEnum.b({ value: 42 })
  performCheck(b, 'b', { value: 42 }, 42)

  const c = MyEnum.c(['hello', 42])
  performCheck(c, 'c', ['hello', 42], 1764)

  const make_a = MyEnum.make()
  performCheck(make_a, 'a', {}, -1)

  const make_b = MyEnum.make(42)
  performCheck(make_b, 'b', { value: 42 }, 42)

  const make_c = MyEnum.make(42, 'hello')
  performCheck(make_c, 'c', ['hello', 42], 1764)
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

  const MyEnum = makeEnum<MyEnum, MyEnumType>({
    makeProto: () => ({
      get self(): MyEnum {
        return this
      },
      getNumber() {
        switch (this.case) {
          case 'a':
            return -1
          case 'b':
            return this.p.value
          case 'c':
            return this.p[1] * this.p[1]
        }
      },
    }),
    type: {
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
    },
  })

  const performCheck = makePerformOwnershipCheck(t, (v) => {
    t.true('self' in v)
    t.true('getNumber' in v)
  })

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
    type: {
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
    },
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const a = MyEnum.a()
  performCheck(a, 'a', {})

  const b = MyEnum.b({ value: 42 })
  performCheck(b, 'b', { value: 42 })

  const c = MyEnum.c(['hello', 42])
  performCheck(c, 'c', ['hello', 42])

  const make_a = MyEnum.make()
  performCheck(make_a, 'a', {})

  const make_b = MyEnum.make(42)
  performCheck(make_b, 'b', { value: 42 })

  const make_c = MyEnum.make(42, 'hello')
  performCheck(make_c, 'c', ['hello', 42])
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
    type: {
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
    },
  })

  const performCheck = makePerformOwnershipCheck(t)

  t.true('make' in MyEnum)

  const a = MyEnum.a()
  performCheck(a, [false, false, false])

  const b = MyEnum.b({ value: 42 })
  performCheck(b, [true, false, false])

  const c = MyEnum.c(['hello', 42])
  performCheck(c, [false, true, true])
})
