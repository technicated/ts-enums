import test, { ExecutionContext } from 'ava'
import { Case, cases, payload as payloadSymbol } from '../case'
import { makeEnum } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Partial<Record<0 | 1 | 'value', unknown>>

const makePerformEqualityCheck = <Enum extends EnumShape>(
  t: ExecutionContext<unknown>,
  MyEnum: EnumCtors<Enum>
) => {
  return (
    v: EnumShape & FullPayload,
    c: CasesOf<typeof MyEnum>,
    payload: FullPayload
  ) => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)

    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)

    const p = v[payloadSymbol] as FullPayload
    t.deepEqual(p[0], payload[0])
    t.deepEqual(p[1], payload[1])
    t.deepEqual(p.value, payload.value)
  }
}

const makePerformOwnershipCheck = (t: ExecutionContext<unknown>) => {
  return <Enum extends EnumShape>(
    v: Enum,
    flags: [boolean, boolean, boolean]
  ) => {
    t.true('case' in v)

    t.is('value' in v, flags[0])
    t.is('0' in v, flags[1])
    t.is('1' in v, flags[2])

    const keys = Object.keys(v[payloadSymbol] as FullPayload)
    t.is(keys.includes('value'), flags[0])
    t.is(keys.includes('0'), flags[1])
    t.is(keys.includes('1'), flags[2])
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
    proto: {
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
    },
  })

  type Helper = MyEnum & FullPayload

  const performCheck = (
    v: Helper,
    c: CasesOf<typeof MyEnum>,
    payload: Partial<Record<0 | 1 | 'value', unknown>>,
    number: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)

    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)

    const p = v[payloadSymbol] as Helper
    t.deepEqual(p[0], payload[0])
    t.deepEqual(p[1], payload[1])
    t.deepEqual(p.value, payload.value)

    t.is(v.self, v)
    t.deepEqual(v.getNumber(), number)
  }

  // const performCheck = makePerformEqualityCheck(t, MyEnum, (v) => {
  //   t.is(v.self, v)
  //   t.deepEqual(v.getNumber(), number)
  // })

  const a = MyEnum.a()
  performCheck(a, 'a', {}, -1)

  const b = MyEnum.b({ value: 42 })
  performCheck(b, 'b', { value: 42 }, 42)

  const c = MyEnum.c(['hello', 42])
  performCheck(c, 'c', { 0: 'hello', 1: 42 }, 1764)
})

test('property owning with proto', (t) => {
  interface MyEnumProto {
    self: this

    getNumber(): number
  }

  type MyEnum = MyEnumProto &
    (Case<'a'> | Case<'b', { value: number }> | Case<'c', [string, number]>)

  const MyEnum = makeEnum<MyEnum>({
    proto: {
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
    },
  })

  const performCheck = (
    v: MyEnum,
    flags: [boolean, boolean, boolean]
  ): void => {
    t.true('case' in v)
    t.true('self' in v)
    t.true('getNumber' in v)
    const keys = Object.keys(v)
    t.is(keys.includes('value'), flags[0])
    t.is(keys.includes('0'), flags[1])
    t.is(keys.includes('1'), flags[2])
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

  const MyEnum = makeEnum<MyEnum, MyEnumType>({
    proto: {
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
    },
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

  type Helper = MyEnum & Record<0 | 1 | 'value', unknown>

  const performCheck = (
    v: Helper,
    c: CasesOf<typeof MyEnum>,
    payload: Partial<Record<0 | 1 | 'value', unknown>>,
    number: unknown
  ): void => {
    t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
    t.is(v.case, c)
    t.is(MyEnum[cases][c], c)

    t.deepEqual(v[0], payload[0])
    t.deepEqual(v[1], payload[1])
    t.deepEqual(v.value, payload.value)

    const p = v[payloadSymbol] as Helper
    t.deepEqual(p[0], payload[0])
    t.deepEqual(p[1], payload[1])
    t.deepEqual(p.value, payload.value)

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

// test('property owning with proto and type', (t) => {
//   interface MyEnumProto {
//     self: this
//
//     getNumber(): number
//   }
//
//   interface MyEnumType {
//     make(...args: [] | [n: number] | [n: number, s: string]): MyEnum
//   }
//
//   type MyEnum = MyEnumProto &
//     (Case<'a'> | Case<'b', { value: number }> | Case<'c', [string, number]>)
//
//   const MyEnum = makeEnum<MyEnum, MyEnumType>({
//     proto: {
//       get self(): MyEnum {
//         return this
//       },
//       getNumber() {
//         switch (this.case) {
//           case 'a':
//             return -1
//           case 'b':
//             return this.payload.value
//           case 'c':
//             return this.payload[1] * this.payload[1]
//         }
//       },
//     },
//     type: {
//       make(...args): MyEnum {
//         switch (args.length) {
//           case 0:
//             return MyEnum.a()
//           case 1:
//             return MyEnum.b({ value: args[0] })
//           case 2:
//             return MyEnum.c([args[1], args[0]])
//         }
//       },
//     },
//   })
//
//   const performCheck = (
//     v: MyEnum,
//     flags: [boolean, boolean, boolean]
//   ): void => {
//     t.true('case' in v)
//     t.true('self' in v)
//     t.true('getNumber' in v)
//     const keys = Object.keys(v.payload)
//     t.is(keys.includes('value'), flags[0])
//     t.is(keys.includes('0'), flags[1])
//     t.is(keys.includes('1'), flags[2])
//   }
//
//   t.true('make' in MyEnum)
//
//   const a = MyEnum.a()
//   performCheck(a, [false, false, false])
//
//   const b = MyEnum.b({ value: 42 })
//   performCheck(b, [true, false, false])
//
//   const c = MyEnum.c(['hello', 42])
//   performCheck(c, [false, true, true])
// })
//
// test('enum with type', (t) => {
//   interface MyEnumType {
//     make(...args: [] | [n: number] | [n: number, s: string]): MyEnum
//   }
//
//   type MyEnum =
//     | Case<'a'>
//     | Case<'b', { value: number }>
//     | Case<'c', [string, number]>
//
//   const MyEnum = makeEnum<MyEnum, MyEnumType>({
//     type: {
//       make(...args): MyEnum {
//         switch (args.length) {
//           case 0:
//             return MyEnum.a()
//           case 1:
//             return MyEnum.b({ value: args[0] })
//           case 2:
//             return MyEnum.c([args[1], args[0]])
//         }
//       },
//     },
//   })
//
//   type Helper = MyEnum & { payload: Record<0 | 1 | 'value', unknown> }
//
//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<Record<0 | 1 | 'value', unknown>>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v.payload[0], payload[0])
//     t.deepEqual(v.payload[1], payload[1])
//     t.deepEqual(v.payload.value, payload.value)
//   }
//
//   const a = MyEnum.a() as Helper
//   performCheck(a, 'a', {})
//
//   const b = MyEnum.b({ value: 42 }) as Helper
//   performCheck(b, 'b', { value: 42 })
//
//   const c = MyEnum.c(['hello', 42]) as Helper
//   performCheck(c, 'c', { 0: 'hello', 1: 42 })
//
//   const make_a = MyEnum.make() as Helper
//   performCheck(make_a, 'a', {})
//
//   const make_b = MyEnum.make(42) as Helper
//   performCheck(make_b, 'b', { value: 42 })
//
//   const make_c = MyEnum.make(42, 'hello') as Helper
//   performCheck(make_c, 'c', { 0: 'hello', 1: 42 })
// })
//
// test('property owning with type', (t) => {
//   interface MyEnumType {
//     make(...args: [] | [n: number] | [n: number, s: string]): MyEnum
//   }
//
//   type MyEnum =
//     | Case<'a'>
//     | Case<'b', { value: number }>
//     | Case<'c', [string, number]>
//
//   const MyEnum = makeEnum<MyEnum, MyEnumType>({
//     type: {
//       make(...args): MyEnum {
//         switch (args.length) {
//           case 0:
//             return MyEnum.a()
//           case 1:
//             return MyEnum.b({ value: args[0] })
//           case 2:
//             return MyEnum.c([args[1], args[0]])
//         }
//       },
//     },
//   })
//
//   const performCheck = (
//     v: MyEnum,
//     flags: [boolean, boolean, boolean]
//   ): void => {
//     t.true('case' in v)
//     const keys = Object.keys(v.payload)
//     t.is(keys.includes('value'), flags[0])
//     t.is(keys.includes('0'), flags[1])
//     t.is(keys.includes('1'), flags[2])
//   }
//
//   t.true('make' in MyEnum)
//
//   const a = MyEnum.a()
//   performCheck(a, [false, false, false])
//
//   const b = MyEnum.b({ value: 42 })
//   performCheck(b, [true, false, false])
//
//   const c = MyEnum.c(['hello', 42])
//   performCheck(c, [false, true, true])
// })
//
// test('fully optional object payload', (t) => {
//   type MyEnum = Case<'main', { a?: number; b?: string }> | Case<'other'>
//
//   const MyEnum = makeEnum<MyEnum>()
//
//   type Helper = MyEnum & { payload: Record<'a' | 'b', unknown> }
//
//   const performCheck = (
//     v: Helper,
//     c: CasesOf<typeof MyEnum>,
//     payload: Partial<Record<'a' | 'b', unknown>>
//   ): void => {
//     t.false(Object.getOwnPropertyDescriptor(v, 'case')?.writable)
//     t.is(v.case, c)
//     t.is(MyEnum[cases][c], c)
//     t.deepEqual(v.payload.a, payload.a)
//     t.deepEqual(v.payload.b, payload.b)
//   }
//
//   const main = MyEnum.main({}) as Helper
//   performCheck(main, 'main', {})
//
//   const main_a = MyEnum.main({ a: 42 }) as Helper
//   performCheck(main_a, 'main', { a: 42 })
//
//   const main_b = MyEnum.main({ b: 'hello world' }) as Helper
//   performCheck(main_b, 'main', { b: 'hello world' })
//
//   const main_ab = MyEnum.main({ a: 42, b: 'hello world' }) as Helper
//   performCheck(main_ab, 'main', { a: 42, b: 'hello world' })
// })
