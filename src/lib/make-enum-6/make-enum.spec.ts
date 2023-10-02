import test, { ExecutionContext } from 'ava'
import { Case, cases } from '../case'
import { HKT6 } from '../hkt'
import { unit, Unit } from '../unit'
import { makeEnum6 } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Unit | Partial<Record<0 | 1 | 2 | 3 | 4 | 5, unknown>>

interface MakePerformEqualityCheckFn {
  <Enum extends EnumShape, Args extends unknown[]>(
    t: ExecutionContext<unknown>,
    enumCtors: EnumCtors<Enum>,
    extra?: (v: Enum['type'], ...args: Args) => void
  ): (
    v: Enum['type'] & { p: FullPayload },
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
      t.deepEqual(v.p[2], payload[2])
      t.deepEqual(v.p[3], payload[3])
      t.deepEqual(v.p[4], payload[4])
      t.deepEqual(v.p[5], payload[5])
    }

    t.true(!!extra || args.length === 0)
    extra?.(v, ...args)
  }
}

test('basic enum', (t) => {
  type MyEnum<A, B, C, D, E, F> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>
    | Case<'d', [A, B, C, D]>
    | Case<'e', [A, B, C, D, E]>
    | Case<'f', [A, B, C, D, E, F]>

  interface MyEnumHKT extends HKT6 {
    readonly type: MyEnum<
      this['_A'],
      this['_B'],
      this['_C'],
      this['_D'],
      this['_E'],
      this['_F']
    >
  }

  const MyEnum = makeEnum6<MyEnumHKT>()

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'])

  const c = MyEnum.c(['hello', 3, 'world'])
  performCheck(c, 'c', ['hello', 3, 'world'])

  const d = MyEnum.d(['hello', 3, 'world', true])
  performCheck(d, 'd', ['hello', 3, 'world', true])

  const e = MyEnum.e(['hello', 3, 'world', true, 'foo'])
  performCheck(e, 'e', ['hello', 3, 'world', true, 'foo'])

  const f = MyEnum.f(['hello', 3, 'world', true, 'foo', { name: 'User' }])
  performCheck(f, 'f', ['hello', 3, 'world', true, 'foo', { name: 'User' }])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A, B, C, D, E, F> {
    prev(): MyEnum<A, B, C, D, E, F>
  }

  type MyEnum<A, B, C, D, E, F> = MyEnumProto<A, B, C, D, E, F> &
    (
      | Case<'empty'>
      | Case<'a', [A]>
      | Case<'b', [A, B]>
      | Case<'c', [A, B, C]>
      | Case<'d', [A, B, C, D]>
      | Case<'e', [A, B, C, D, E]>
      | Case<'f', [A, B, C, D, E, F]>
    )

  interface MyEnumHKT extends HKT6 {
    readonly type: MyEnum<
      this['_A'],
      this['_B'],
      this['_C'],
      this['_D'],
      this['_E'],
      this['_F']
    >
  }

  const MyEnum = makeEnum6<MyEnumHKT>({
    makeProto: (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
          case 'b':
            return MyEnum.a([this.p[0]])
          case 'c':
            return MyEnum.b([this.p[0], this.p[1]])
          case 'd':
            return MyEnum.c([this.p[0], this.p[1], this.p[2]])
          case 'e':
            return MyEnum.d([this.p[0], this.p[1], this.p[2], this.p[3]])
          case 'f':
            return MyEnum.e([
              this.p[0],
              this.p[1],
              this.p[2],
              this.p[3],
              this.p[4],
            ])
        }
      },
    }),
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum, (v, prev) => {
    t.deepEqual(v.prev(), prev)
  })

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {}, MyEnum.empty())

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1], MyEnum.empty())

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

  const c = MyEnum.c(['hello', 3, 'world'])
  performCheck(c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

  const d = MyEnum.d(['hello', 3, 'world', true])
  performCheck(
    d,
    'd',
    ['hello', 3, 'world', true],
    MyEnum.c(['hello', 3, 'world'])
  )

  const e = MyEnum.e(['hello', 3, 'world', true, 'foo'])
  performCheck(
    e,
    'e',
    ['hello', 3, 'world', true, 'foo'],
    MyEnum.d(['hello', 3, 'world', true])
  )

  const f = MyEnum.f(['hello', 3, 'world', true, 'foo', { name: 'User' }])
  performCheck(
    f,
    'f',
    ['hello', 3, 'world', true, 'foo', { name: 'User' }],
    MyEnum.e(['hello', 3, 'world', true, 'foo'])
  )
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A, B, C, D, E, F> {
    prev(): MyEnum<A, B, C, D, E, F>
  }

  type MyEnum<A, B, C, D, E, F> = MyEnumProto<A, B, C, D, E, F> &
    (
      | Case<'empty'>
      | Case<'a', [A]>
      | Case<'b', [A, B]>
      | Case<'c', [A, B, C]>
      | Case<'d', [A, B, C, D]>
      | Case<'e', [A, B, C, D, E]>
      | Case<'f', [A, B, C, D, E, F]>
    )

  interface MyEnumHKT extends HKT6 {
    readonly type: MyEnum<
      this['_A'],
      this['_B'],
      this['_C'],
      this['_D'],
      this['_E'],
      this['_F']
    >
  }

  interface MyEnumType {
    make<A, B, C, D, E, F>(
      ...args:
        | []
        | [A]
        | [A, B]
        | [A, B, C]
        | [A, B, C, D]
        | [A, B, C, D, E]
        | [A, B, C, D, E, F]
    ): MyEnum<A, B, C, D, E, F>
  }

  const MyEnum = makeEnum6<MyEnumHKT, MyEnumType>({
    makeProto: (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
          case 'b':
            return MyEnum.a([this.p[0]])
          case 'c':
            return MyEnum.b([this.p[0], this.p[1]])
          case 'd':
            return MyEnum.c([this.p[0], this.p[1], this.p[2]])
          case 'e':
            return MyEnum.d([this.p[0], this.p[1], this.p[2], this.p[3]])
          case 'f':
            return MyEnum.e([
              this.p[0],
              this.p[1],
              this.p[2],
              this.p[3],
              this.p[4],
            ])
        }
      },
    }),
    type: {
      make<A, B, C, D, E, F>(
        ...args:
          | []
          | [A]
          | [A, B]
          | [A, B, C]
          | [A, B, C, D]
          | [A, B, C, D, E]
          | [A, B, C, D, E, F]
      ): MyEnum<A, B, C, D, E, F> {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
          case 2:
            return MyEnum.b(args)
          case 3:
            return MyEnum.c(args)
          case 4:
            return MyEnum.d(args)
          case 5:
            return MyEnum.e(args)
          case 6:
            return MyEnum.f(args)
        }
      },
    },
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum, (v, prev) => {
    t.deepEqual(v.prev(), prev)
  })

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {}, MyEnum.empty())

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1], MyEnum.empty())

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'], MyEnum.a([2]))

  const c = MyEnum.c(['hello', 3, 'world'])
  performCheck(c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

  const d = MyEnum.d(['hello', 3, 'world', true])
  performCheck(
    d,
    'd',
    ['hello', 3, 'world', true],
    MyEnum.c(['hello', 3, 'world'])
  )

  const e = MyEnum.e(['hello', 3, 'world', true, 'foo'])
  performCheck(
    e,
    'e',
    ['hello', 3, 'world', true, 'foo'],
    MyEnum.d(['hello', 3, 'world', true])
  )

  const f = MyEnum.f(['hello', 3, 'world', true, 'foo', { name: 'User' }])
  performCheck(
    f,
    'f',
    ['hello', 3, 'world', true, 'foo', { name: 'User' }],
    MyEnum.e(['hello', 3, 'world', true, 'foo'])
  )

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {}, MyEnum.empty())

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1], MyEnum.empty())

  const make_b = MyEnum.make(2, 'hello')
  performCheck(make_b, 'b', [2, 'hello'], MyEnum.a([2]))

  const make_c = MyEnum.make('hello', 3, 'world')
  performCheck(make_c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))

  const make_d = MyEnum.make('hello', 3, 'world', false)
  performCheck(
    make_d,
    'd',
    ['hello', 3, 'world', false],
    MyEnum.c(['hello', 3, 'world'])
  )

  const make_e = MyEnum.make('hello', 3, 'world', false, 'foo')
  performCheck(
    make_e,
    'e',
    ['hello', 3, 'world', false, 'foo'],
    MyEnum.d(['hello', 3, 'world', false])
  )

  const make_f = MyEnum.make('hello', 3, 'world', false, 'foo', {
    name: 'User',
  })
  performCheck(
    make_f,
    'f',
    ['hello', 3, 'world', false, 'foo', { name: 'User' }],
    MyEnum.e(['hello', 3, 'world', false, 'foo'])
  )
})

test('enum with type', (t) => {
  type MyEnum<A, B, C, D, E, F> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>
    | Case<'d', [A, B, C, D]>
    | Case<'e', [A, B, C, D, E]>
    | Case<'f', [A, B, C, D, E, F]>

  interface MyEnumHKT extends HKT6 {
    readonly type: MyEnum<
      this['_A'],
      this['_B'],
      this['_C'],
      this['_D'],
      this['_E'],
      this['_F']
    >
  }

  interface MyEnumType {
    make<A, B, C, D, E, F>(
      ...args:
        | []
        | [A]
        | [A, B]
        | [A, B, C]
        | [A, B, C, D]
        | [A, B, C, D, E]
        | [A, B, C, D, E, F]
    ): MyEnum<A, B, C, D, E, F>
  }

  const MyEnum = makeEnum6<MyEnumHKT, MyEnumType>({
    type: {
      make<A, B, C, D, E, F>(
        ...args:
          | []
          | [A]
          | [A, B]
          | [A, B, C]
          | [A, B, C, D]
          | [A, B, C, D, E]
          | [A, B, C, D, E, F]
      ): MyEnum<A, B, C, D, E, F> {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
          case 2:
            return MyEnum.b(args)
          case 3:
            return MyEnum.c(args)
          case 4:
            return MyEnum.d(args)
          case 5:
            return MyEnum.e(args)
          case 6:
            return MyEnum.f(args)
        }
      },
    },
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'])

  const c = MyEnum.c(['hello', 3, 'world'])
  performCheck(c, 'c', ['hello', 3, 'world'])

  const d = MyEnum.d(['hello', 3, 'world', true])
  performCheck(d, 'd', ['hello', 3, 'world', true])

  const e = MyEnum.e(['hello', 3, 'world', true, 'foo'])
  performCheck(e, 'e', ['hello', 3, 'world', true, 'foo'])

  const f = MyEnum.f(['hello', 3, 'world', true, 'foo', { name: 'User' }])
  performCheck(f, 'f', ['hello', 3, 'world', true, 'foo', { name: 'User' }])

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {})

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1])

  const make_b = MyEnum.make(2, 'hello')
  performCheck(make_b, 'b', [2, 'hello'])

  const make_c = MyEnum.make('hello', 3, 'world')
  performCheck(make_c, 'c', ['hello', 3, 'world'])

  const make_d = MyEnum.make('hello', 3, 'world', false)
  performCheck(make_d, 'd', ['hello', 3, 'world', false])

  const make_e = MyEnum.make('hello', 3, 'world', false, 'foo')
  performCheck(make_e, 'e', ['hello', 3, 'world', false, 'foo'])

  const make_f = MyEnum.make('hello', 3, 'world', false, 'foo', {
    name: 'User',
  })
  performCheck(make_f, 'f', [
    'hello',
    3,
    'world',
    false,
    'foo',
    { name: 'User' },
  ])
})

test('nested enums', (t) => {
  type Color<A, B, C, D, E, F> =
    | Case<'red', A | B | C | D | E | F>
    | Case<'green', [A, B, C, D, E, F]>
    | Case<'blue', { a: A; b: B; c: C; d: D; e: E; f: F }>

  interface ColorHKT extends HKT6 {
    readonly type: Color<
      this['_A'],
      this['_B'],
      this['_C'],
      this['_D'],
      this['_E'],
      this['_F']
    >
  }

  const Color = makeEnum6<ColorHKT>()

  type Wrapper<A, B, C, D, E, F> =
    | Case<'none'>
    | Case<'some', Color<A, B, C, D, E, F>>

  interface WrapperHKT extends HKT6 {
    readonly type: Wrapper<
      this['_A'],
      this['_B'],
      this['_C'],
      this['_D'],
      this['_E'],
      this['_F']
    >
  }

  const Wrapper = makeEnum6<WrapperHKT>()

  t.deepEqual(Wrapper.some(Color.red(1)), {
    case: 'some',
    p: { case: 'red', p: 1 },
  })

  t.deepEqual(Wrapper.some(Color.green([1, 2, 3, 4, 5, 6])), {
    case: 'some',
    p: { case: 'green', p: [1, 2, 3, 4, 5, 6] },
  })

  t.deepEqual(
    Wrapper.some(
      Color.blue({
        a: 'hello',
        b: 3,
        c: 'world',
        d: true,
        e: 'foo',
        f: { name: 'User' },
      })
    ),
    {
      case: 'some',
      p: {
        case: 'blue',
        p: {
          a: 'hello',
          b: 3,
          c: 'world',
          d: true,
          e: 'foo',
          f: { name: 'User' },
        },
      },
    }
  )
})
