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
  class MyEnumProto<A, B> {
    prev(this: MyEnum<A, B>): MyEnum<A, B> {
      switch (this.case) {
        case 'empty':
          return MyEnum.empty()
        case 'a':
          return MyEnum.empty()
        case 'b':
          return MyEnum.a([this.p[0]])
      }
    }
  }

  type MyEnum<A, B> = MyEnumProto<A, B> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  const MyEnum = makeEnum2<MyEnumHKT>({ proto: MyEnumProto })

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
  class MyEnumProto<A, B> {
    prev(this: MyEnum<A, B>): MyEnum<A, B> {
      switch (this.case) {
        case 'empty':
          return MyEnum.empty()
        case 'a':
          return MyEnum.empty()
        case 'b':
          return MyEnum.a([this.p[0]])
      }
    }
  }

  type MyEnum<A, B> = MyEnumProto<A, B> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]>)

  interface MyEnumHKT extends HKT2 {
    readonly type: MyEnum<this['_A'], this['_B']>
  }

  class MyEnumType {
    make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B> {
      switch (args.length) {
        case 0:
          return MyEnum.empty()
        case 1:
          return MyEnum.a(args)
        case 2:
          return MyEnum.b(args)
      }
    }
  }

  const MyEnum = makeEnum2<MyEnumHKT, MyEnumType>({
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

  class MyEnumType {
    make<A, B>(...args: [] | [A] | [A, B]): MyEnum<A, B> {
      switch (args.length) {
        case 0:
          return MyEnum.empty()
        case 1:
          return MyEnum.a(args)
        case 2:
          return MyEnum.b(args)
      }
    }
  }

  const MyEnum = makeEnum2<MyEnumHKT, MyEnumType>({ type: MyEnumType })

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

test('weird generics', (t) => {
  class MaybeProto<A, B> {
    map<Y, Z>(
      this: Maybe<A, B>,
      tx_a: (value: A) => Y,
      tx_b: (value: B) => Z
    ): Maybe<Y, Z> {
      switch (this.case) {
        case 'none':
          return Maybe.none()
        case 'someA':
          return Maybe.someA(tx_a(this.p))
        case 'someB':
          return Maybe.someB(tx_b(this.p))
      }
    }
  }

  type Maybe<A, B> = MaybeProto<A, B> &
    (Case<'none'> | Case<'someA', A> | Case<'someB', B>)

  interface MaybeHKT extends HKT2 {
    readonly type: Maybe<this['_A'], this['_B']>
  }

  class MaybeType {
    fromValues<A, B>(
      values?: { a: A } | { b: B }
    ): Maybe<NonNullable<A>, NonNullable<B>> {
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
      return Maybe.none()
    }
  }

  const Maybe = makeEnum2<MaybeHKT, MaybeType>({
    proto: MaybeProto,
    type: MaybeType,
  })

  t.like(Maybe.fromValues(), { case: 'none', p: unit })
  t.like(Maybe.fromValues({ a: 42 }), { case: 'someA', p: 42 })
  t.like(Maybe.fromValues({ b: 'hello' }), { case: 'someB', p: 'hello' })
})

test('CasePath', (t) => {
  type Container<A, B> =
    | Case<'value', A | B>
    | Case<'array', [A, B]>
    | Case<'object', { a: A; b: B }>

  interface ContainerHKT extends HKT2 {
    readonly type: Container<this['_A'], this['_B']>
  }

  const Container = makeEnum2<ContainerHKT>()

  const value = Container.value<number, string>(42)
  const array = Container.array([2, 'hello'])
  const object = Container.object({ a: 2, b: 'hello' })

  const cp1 = Container<number, string>('value')
  const cp2 = Container<number, string>('array')
  const cp3 = Container<number, string>('object')

  t.deepEqual(cp1.extract(value), { value: 42 })
  t.deepEqual(cp1.extract(array), undefined)
  t.deepEqual(cp1.extract(object), undefined)

  t.deepEqual(cp2.extract(value), undefined)
  t.deepEqual(cp2.extract(array), { value: [2, 'hello'] })
  t.deepEqual(cp2.extract(object), undefined)

  t.deepEqual(cp3.extract(value), undefined)
  t.deepEqual(cp3.extract(array), undefined)
  t.deepEqual(cp3.extract(object), { value: { a: 2, b: 'hello' } })

  t.deepEqual(cp1.embed(-1), Container.value<number, string>(-1))
  t.deepEqual(cp2.embed([-1, 'hi']), Container.array([-1, 'hi']))
  t.deepEqual(
    cp3.embed({ a: -1, b: 'hi' }),
    Container.object({ a: -1, b: 'hi' })
  )
})

test('CasePath modification', (t) => {
  type Container<A, B> =
    | Case<'primitive', number>
    | Case<'object', { a: A; b: B }>

  interface ContainerHKT extends HKT2 {
    readonly type: Container<this['_A'], this['_B']>
  }

  const Container = makeEnum2<ContainerHKT>()

  t.deepEqual(
    Container('primitive').modify(Container.primitive(42), (n) => n * n),
    Container.primitive(1764)
  )

  t.deepEqual(
    Container('object').modify(Container.object({ a: 'a', b: 'b' }), (obj) => ({
      ...obj,
      a: obj.a + '!',
    })),
    Container.object({ a: 'a!', b: 'b' })
  )

  t.deepEqual(
    Container('object').modify(Container.object({ a: 'a', b: 'b' }), (obj) => {
      obj.b += '!'
    }),
    Container.object({ a: 'a', b: 'b!' })
  )
})
