import test, { ExecutionContext } from 'ava'
import { Case, cases } from '../case'
import { HKT2 } from '../hkt'
import { unit, Unit } from '../unit'
import { makeEnum2 } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Unit | Partial<Record<0 | 1, unknown>>

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
    }

    t.true(!!extra || args.length === 0)
    extra?.(v, ...args)
  }
}

test('basic enum', (t) => {
  type MyEnum<A, B> = Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum2<MyEnumHKT>()

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A, B> {
    prev(): MyEnum<A, B>
  }

  type MyEnum<A, B> = MyEnumProto<A, B> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum2<MyEnumHKT>({
    makeProto: (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
          case 'b':
            return MyEnum.a([this.p[0]])
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
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A, B> {
    prev(): MyEnum<A, B>
  }

  type MyEnum<A, B> = MyEnumProto<A, B> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  interface MyEnumType {
    make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B>
  }

  const MyEnum = makeEnum2<MyEnumHKT, MyEnumType>({
    makeProto: (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
          case 'b':
            return MyEnum.a([this.p[0]])
        }
      },
    }),
    type: {
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

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {}, MyEnum.empty())

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1], MyEnum.empty())

  const make_b = MyEnum.make(2, 'hello')
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
    type: {
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
    },
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'])

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {})

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1])

  const make_b = MyEnum.make(2, 'hello')
  performCheck(make_b, 'b', [2, 'hello'])
})

test('nested enums', (t) => {
  type Color<A, B> =
    | Case<'red', A | B>
    | Case<'green', [A, B]>
    | Case<'blue', { a: A; b: B }>

  interface ColorHKT extends HKT2 {
    readonly type: Color<this['_A'], this['_B']>
  }

  const Color = makeEnum2<ColorHKT>()

  type Wrapper<A, B> = Case<'none'> | Case<'some', Color<A, B>>

  interface WrapperHKT extends HKT2 {
    readonly type: Wrapper<this['_A'], this['_B']>
  }

  const Wrapper = makeEnum2<WrapperHKT>()

  t.deepEqual(Wrapper.some(Color.red(1)), {
    case: 'some',
    p: { case: 'red', p: 1 },
  })

  t.deepEqual(Wrapper.some(Color.green([1, 2])), {
    case: 'some',
    p: { case: 'green', p: [1, 2] },
  })

  t.deepEqual(Wrapper.some(Color.blue({ a: 1, b: 'hello' })), {
    case: 'some',
    p: { case: 'blue', p: { a: 1, b: 'hello' } },
  })
})
