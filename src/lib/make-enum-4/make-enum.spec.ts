import test, { ExecutionContext } from 'ava'
import { Case, cases } from '../case'
import { HKT4 } from '../hkt'
import { unit, Unit } from '../unit'
import { makeEnum4 } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Unit | Partial<Record<0 | 1 | 2 | 3, unknown>>

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
    }

    t.true(!!extra || args.length === 0)
    extra?.(v, ...args)
  }
}

test('basic enum', (t) => {
  type MyEnum<A, B, C, D> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>
    | Case<'d', [A, B, C, D]>

  interface MyEnumHKT extends HKT4 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  const MyEnum = makeEnum4<MyEnumHKT>()

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
})

test('enum with proto', (t) => {
  class MyEnumProto<A, B, C, D> {
    prev(this: MyEnum<A, B, C, D>): MyEnum<A, B, C, D> {
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
      }
    }
  }

  type MyEnum<A, B, C, D> = MyEnumProto<A, B, C, D> &
    (
      | Case<'empty'>
      | Case<'a', [A]>
      | Case<'b', [A, B]>
      | Case<'c', [A, B, C]>
      | Case<'d', [A, B, C, D]>
    )

  interface MyEnumHKT extends HKT4 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  const MyEnum = makeEnum4<MyEnumHKT>({ proto: MyEnumProto })

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
})

test('enum with proto and type', (t) => {
  class MyEnumProto<A, B, C, D> {
    prev(this: MyEnum<A, B, C, D>): MyEnum<A, B, C, D> {
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
      }
    }
  }

  type MyEnum<A, B, C, D> = MyEnumProto<A, B, C, D> &
    (
      | Case<'empty'>
      | Case<'a', [A]>
      | Case<'b', [A, B]>
      | Case<'c', [A, B, C]>
      | Case<'d', [A, B, C, D]>
    )

  interface MyEnumHKT extends HKT4 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  class MyEnumType {
    make<A, B, C, D>(
      ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D]
    ): MyEnum<A, B, C, D> {
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
      }
    }
  }

  const MyEnum = makeEnum4<MyEnumHKT, MyEnumType>({
    proto: MyEnumProto,
    type: MyEnumType,
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
})

test('enum with type', (t) => {
  type MyEnum<A, B, C, D> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>
    | Case<'d', [A, B, C, D]>

  interface MyEnumHKT extends HKT4 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  class MyEnumType {
    make<A, B, C, D>(
      ...args: [] | [A] | [A, B] | [A, B, C] | [A, B, C, D]
    ): MyEnum<A, B, C, D> {
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
      }
    }
  }

  const MyEnum = makeEnum4<MyEnumHKT, MyEnumType>({ type: MyEnumType })

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
})

test('nested enums', (t) => {
  type Color<A, B, C, D> =
    | Case<'red', A | B | C | D>
    | Case<'green', [A, B, C, D]>
    | Case<'blue', { a: A; b: B; c: C; d: D }>

  interface ColorHKT extends HKT4 {
    readonly type: Color<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  const Color = makeEnum4<ColorHKT>()

  type Wrapper<A, B, C, D> = Case<'none'> | Case<'some', Color<A, B, C, D>>

  interface WrapperHKT extends HKT4 {
    readonly type: Wrapper<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  const Wrapper = makeEnum4<WrapperHKT>()

  t.deepEqual(Wrapper.some(Color.red(1)), {
    case: 'some',
    p: { case: 'red', p: 1 },
  })

  t.deepEqual(Wrapper.some(Color.green([1, 2, 3, 4])), {
    case: 'some',
    p: { case: 'green', p: [1, 2, 3, 4] },
  })

  t.deepEqual(
    Wrapper.some(Color.blue({ a: 'hello', b: 3, c: 'world', d: true })),
    {
      case: 'some',
      p: { case: 'blue', p: { a: 'hello', b: 3, c: 'world', d: true } },
    }
  )
})

test('weird generics', (t) => {
  class MaybeProto<A, B, C, D> {
    map<W, X, Y, Z>(
      this: Maybe<A, B, C, D>,
      tx_a: (value: A) => W,
      tx_b: (value: B) => X,
      tx_c: (value: C) => Y,
      tx_d: (value: D) => Z
    ): Maybe<W, X, Y, Z> {
      switch (this.case) {
        case 'none':
          return Maybe.none()
        case 'someA':
          return Maybe.someA(tx_a(this.p))
        case 'someB':
          return Maybe.someB(tx_b(this.p))
        case 'someC':
          return Maybe.someC(tx_c(this.p))
        case 'someD':
          return Maybe.someD(tx_d(this.p))
      }
    }
  }

  type Maybe<A, B, C, D> = MaybeProto<A, B, C, D> &
    (
      | Case<'none'>
      | Case<'someA', A>
      | Case<'someB', B>
      | Case<'someC', C>
      | Case<'someD', D>
    )

  interface MaybeHKT extends HKT4 {
    readonly type: Maybe<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  class MaybeType {
    fromValues<A, B, C, D>(
      values?: { a: A } | { b: B } | { c: C } | { d: D }
    ): Maybe<NonNullable<A>, NonNullable<B>, NonNullable<C>, NonNullable<D>> {
      if (
        values &&
        'a' in values &&
        values.a !== null &&
        values.a !== undefined
      )
        return Maybe.someA(values.a)
      if (
        values &&
        'b' in values &&
        values.b !== null &&
        values.b !== undefined
      )
        return Maybe.someB(values.b)
      if (
        values &&
        'c' in values &&
        values.c !== null &&
        values.c !== undefined
      )
        return Maybe.someC(values.c)
      if (
        values &&
        'd' in values &&
        values.d !== null &&
        values.d !== undefined
      )
        return Maybe.someD(values.d)
      return Maybe.none()
    }
  }

  const Maybe = makeEnum4<MaybeHKT, MaybeType>({
    proto: MaybeProto,
    type: MaybeType,
  })

  t.like(Maybe.fromValues(), { case: 'none', p: unit })
  t.like(Maybe.fromValues({ a: 'hello' }), { case: 'someA', p: 'hello' })
  t.like(Maybe.fromValues({ b: 3 }), { case: 'someB', p: 3 })
  t.like(Maybe.fromValues({ c: 'world' }), { case: 'someC', p: 'world' })
  t.like(Maybe.fromValues({ d: true }), { case: 'someD', p: true })
})

test('CasePath', (t) => {
  type Container<A, B, C, D> =
    | Case<'value', A | B | C | D>
    | Case<'array', [A, B, C, D]>
    | Case<'object', { a: A; b: B; c: C; d: D }>

  interface ContainerHKT extends HKT4 {
    readonly type: Container<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  const Container = makeEnum4<ContainerHKT>()

  const value = Container.value<string, number, string, boolean>(42)
  const array = Container.array(['hello', 3, 'world', false])
  const object = Container.object({ a: 'hello', b: 3, c: 'world', d: false })

  const cp1 = Container<string, number, string, boolean>('value')
  const cp2 = Container<string, number, string, boolean>('array')
  const cp3 = Container<string, number, string, boolean>('object')

  t.deepEqual(cp1.extract(value), { value: 42 })
  t.deepEqual(cp1.extract(array), undefined)
  t.deepEqual(cp1.extract(object), undefined)

  t.deepEqual(cp2.extract(value), undefined)
  t.deepEqual(cp2.extract(array), { value: ['hello', 3, 'world', false] })
  t.deepEqual(cp2.extract(object), undefined)

  t.deepEqual(cp3.extract(value), undefined)
  t.deepEqual(cp3.extract(array), undefined)
  t.deepEqual(cp3.extract(object), {
    value: { a: 'hello', b: 3, c: 'world', d: false },
  })

  t.deepEqual(
    cp1.embed(-1),
    Container.value<string, number, string, boolean>(-1)
  )
  t.deepEqual(
    cp2.embed(['hi', -1, 'hi', false]),
    Container.array(['hi', -1, 'hi', false])
  )
  t.deepEqual(
    cp3.embed({ a: 'hi', b: -1, c: 'hi', d: false }),
    Container.object({ a: 'hi', b: -1, c: 'hi', d: false })
  )
})

test('CasePath modification', (t) => {
  type Container<A, B, C, D> =
    | Case<'primitive', number>
    | Case<'object', { a: A; b: B; c: C; d: D }>

  interface ContainerHKT extends HKT4 {
    readonly type: Container<this['_A'], this['_B'], this['_C'], this['_D']>
  }

  const Container = makeEnum4<ContainerHKT>()

  t.deepEqual(
    Container('primitive').modify(Container.primitive(42), (n) => n * n),
    Container.primitive(1764)
  )

  t.deepEqual(
    Container('object').modify(
      Container.object({ a: 'a', b: 'b', c: 'c', d: 'd' }),
      (obj) => ({ ...obj, a: obj.a + '!' })
    ),
    Container.object({ a: 'a!', b: 'b', c: 'c', d: 'd' })
  )

  t.deepEqual(
    Container('object').modify(
      Container.object({ a: 'a', b: 'b', c: 'c', d: 'd' }),
      (obj) => {
        obj.d += '!'
      }
    ),
    Container.object({ a: 'a', b: 'b', c: 'c', d: 'd!' })
  )
})
