import test, { ExecutionContext } from 'ava'
import { Case, casePath, cases } from '../case'
import { HKT3 } from '../hkt'
import { unit, Unit } from '../unit'
import { makeEnum3 } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Unit | Partial<Record<0 | 1 | 2, unknown>>

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
    }

    t.true(!!extra || args.length === 0)
    extra?.(v, ...args)
  }
}

test('basic enum', (t) => {
  type MyEnum<A, B, C> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  const MyEnum = makeEnum3<MyEnumHKT>()

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])

  const b = MyEnum.b([2, 'hello'])
  performCheck(b, 'b', [2, 'hello'])

  const c = MyEnum.c(['hello', 3, 'world'])
  performCheck(c, 'c', ['hello', 3, 'world'])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A, B, C> {
    prev(): MyEnum<A, B, C>
  }

  type MyEnum<A, B, C> = MyEnumProto<A, B, C> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]> | Case<'c', [A, B, C]>)

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  const MyEnum = makeEnum3<MyEnumHKT>({
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
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A, B, C> {
    prev(): MyEnum<A, B, C>
  }

  type MyEnum<A, B, C> = MyEnumProto<A, B, C> &
    (Case<'empty'> | Case<'a', [A]> | Case<'b', [A, B]> | Case<'c', [A, B, C]>)

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  interface MyEnumType {
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C>
  }

  const MyEnum = makeEnum3<MyEnumHKT, MyEnumType>({
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
        }
      },
    }),
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
          case 2:
            return MyEnum.b(args)
          case 3:
            return MyEnum.c(args)
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

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {}, MyEnum.empty())

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1], MyEnum.empty())

  const make_b = MyEnum.make(2, 'hello')
  performCheck(make_b, 'b', [2, 'hello'], MyEnum.a([2]))

  const make_c = MyEnum.make('hello', 3, 'world')
  performCheck(make_c, 'c', ['hello', 3, 'world'], MyEnum.b(['hello', 3]))
})

test('enum with type', (t) => {
  type MyEnum<A, B, C> =
    | Case<'empty'>
    | Case<'a', [A]>
    | Case<'b', [A, B]>
    | Case<'c', [A, B, C]>

  interface MyEnumHKT extends HKT3 {
    readonly type: MyEnum<this['_A'], this['_B'], this['_C']>
  }

  interface MyEnumType {
    make<A, B, C>(...args: [] | [A] | [A, B] | [A, B, C]): MyEnum<A, B, C>
  }

  const MyEnum = makeEnum3<MyEnumHKT, MyEnumType>({
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
          case 2:
            return MyEnum.b(args)
          case 3:
            return MyEnum.c(args)
        }
      },
    }),
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

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {})

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1])

  const make_b = MyEnum.make(2, 'hello')
  performCheck(make_b, 'b', [2, 'hello'])

  const make_c = MyEnum.make('hello', 3, 'world')
  performCheck(make_c, 'c', ['hello', 3, 'world'])
})

test('nested enums', (t) => {
  type Color<A, B, C> =
    | Case<'red', A | B | C>
    | Case<'green', [A, B, C]>
    | Case<'blue', { a: A; b: B; c: C }>

  interface ColorHKT extends HKT3 {
    readonly type: Color<this['_A'], this['_B'], this['_C']>
  }

  const Color = makeEnum3<ColorHKT>()

  type Wrapper<A, B, C> = Case<'none'> | Case<'some', Color<A, B, C>>

  interface WrapperHKT extends HKT3 {
    readonly type: Wrapper<this['_A'], this['_B'], this['_C']>
  }

  const Wrapper = makeEnum3<WrapperHKT>()

  t.deepEqual(Wrapper.some(Color.red(1)), {
    case: 'some',
    p: { case: 'red', p: 1 },
  })

  t.deepEqual(Wrapper.some(Color.green([1, 2, 3])), {
    case: 'some',
    p: { case: 'green', p: [1, 2, 3] },
  })

  t.deepEqual(Wrapper.some(Color.blue({ a: 'hello', b: 3, c: 'world' })), {
    case: 'some',
    p: { case: 'blue', p: { a: 'hello', b: 3, c: 'world' } },
  })
})

test('weird generics', (t) => {
  interface MaybeProto<A, B, C> {
    map<X, Y, Z>(
      tx_a: (value: A) => X,
      tx_b: (value: B) => Y,
      tx_c: (value: C) => Z
    ): Maybe<X, Y, Z>
  }

  type Maybe<A, B, C> = MaybeProto<A, B, C> &
    (Case<'none'> | Case<'someA', A> | Case<'someB', B> | Case<'someC', C>)

  interface MaybeHKT extends HKT3 {
    readonly type: Maybe<this['_A'], this['_B'], this['_C']>
  }

  interface MaybeType {
    fromValues<A, B, C>(
      values?: { a: A } | { b: B } | { c: C }
    ): Maybe<NonNullable<A>, NonNullable<B>, NonNullable<C>>
  }

  const Maybe = makeEnum3<MaybeHKT, MaybeType>({
    makeProto: (Maybe) => ({
      map(tx_a, tx_b, tx_c) {
        switch (this.case) {
          case 'none':
            return Maybe.none()
          case 'someA':
            return Maybe.someA(tx_a(this.p))
          case 'someB':
            return Maybe.someB(tx_b(this.p))
          case 'someC':
            return Maybe.someC(tx_c(this.p))
        }
      },
    }),
    makeType: (Maybe) => ({
      fromValues(values) {
        if (values && 'a' in values && values.a) return Maybe.someA(values.a)
        if (values && 'b' in values && values.b) return Maybe.someB(values.b)
        if (values && 'c' in values && values.c) return Maybe.someC(values.c)
        return Maybe.none()
      },
    }),
  })

  t.like(Maybe.fromValues(), { case: 'none', p: unit })
  t.like(Maybe.fromValues({ a: 42 }), { case: 'someA', p: 42 })
  t.like(Maybe.fromValues({ b: 'hello' }), { case: 'someB', p: 'hello' })
  t.like(Maybe.fromValues({ c: 'world' }), { case: 'someC', p: 'world' })
})

test('CasePath', (t) => {
  type Container<A, B, C> =
    | Case<'value', A | B | C>
    | Case<'array', [A, B, C]>
    | Case<'object', { a: A; b: B; c: C }>

  interface ContainerHKT extends HKT3 {
    readonly type: Container<this['_A'], this['_B'], this['_C']>
  }

  const Container = makeEnum3<ContainerHKT>()

  const value = Container.value<number, string, boolean>(42)
  const array = Container.array([42, 'hello', true])
  const object = Container.object({ a: 42, b: 'hello', c: true })

  const cp1 = Container[casePath]('value').params<number, string, boolean>()
  const cp2 = Container[casePath]('array').params<number, string, boolean>()
  const cp3 = Container[casePath]('object').params<number, string, boolean>()

  t.deepEqual(cp1.extract(value), { value: 42 })
  t.deepEqual(cp1.extract(array), undefined)
  t.deepEqual(cp1.extract(object), undefined)

  t.deepEqual(cp2.extract(value), undefined)
  t.deepEqual(cp2.extract(array), { value: [42, 'hello', true] })
  t.deepEqual(cp2.extract(object), undefined)

  t.deepEqual(cp3.extract(value), undefined)
  t.deepEqual(cp3.extract(array), undefined)
  t.deepEqual(cp3.extract(object), { value: { a: 42, b: 'hello', c: true } })

  t.deepEqual(cp1.embed(-1), Container.value<number, string, boolean>(-1))
  t.deepEqual(cp2.embed([-1, 'hi', false]), Container.array([-1, 'hi', false]))
  t.deepEqual(
    cp3.embed({ a: -1, b: 'hi', c: false }),
    Container.object({ a: -1, b: 'hi', c: false })
  )
})
