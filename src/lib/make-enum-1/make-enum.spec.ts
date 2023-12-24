import test, { ExecutionContext } from 'ava'
import { Case, cases } from '../case'
import { HKT } from '../hkt'
import { unit, Unit } from '../unit'
import { makeEnum1 } from './make-enum'
import { CasesOf, EnumCtors, EnumShape } from './types'

type FullPayload = Unit | Partial<Record<0, unknown>>

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
    }

    t.true(!!extra || args.length === 0)
    extra?.(v, ...args)
  }
}

test('basic enum', (t) => {
  type MyEnum<A> = Case<'empty'> | Case<'a', [A]>

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  const MyEnum = makeEnum1<MyEnumHKT>()

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])
})

test('enum with proto', (t) => {
  interface MyEnumProto<A> {
    prev(): MyEnum<A>
  }

  type MyEnum<A> = MyEnumProto<A> & (Case<'empty'> | Case<'a', [A]>)

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  const MyEnum = makeEnum1<MyEnumHKT>({
    makeProto: (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
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
})

test('enum with proto and type', (t) => {
  interface MyEnumProto<A> {
    prev(): MyEnum<A>
  }

  type MyEnum<A> = MyEnumProto<A> & (Case<'empty'> | Case<'a', [A]>)

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  interface MyEnumType {
    make<A>(...args: [] | [A]): MyEnum<A>
  }

  const MyEnum = makeEnum1<MyEnumHKT, MyEnumType>({
    makeProto: (MyEnum) => ({
      prev() {
        switch (this.case) {
          case 'empty':
            return MyEnum.empty()
          case 'a':
            return MyEnum.empty()
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

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {}, MyEnum.empty())

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1], MyEnum.empty())
})

test('enum with type', (t) => {
  type MyEnum<A> = Case<'empty'> | Case<'a', [A]>

  interface MyEnumHKT extends HKT {
    readonly type: MyEnum<this['_A']>
  }

  interface MyEnumType {
    make<A>(...args: [] | [A]): MyEnum<A>
  }

  const MyEnum = makeEnum1<MyEnumHKT, MyEnumType>({
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.empty()
          case 1:
            return MyEnum.a(args)
        }
      },
    }),
  })

  const performCheck = makePerformEqualityCheck(t, MyEnum)

  const empty = MyEnum.empty()
  performCheck(empty, 'empty', {})

  const a = MyEnum.a([1])
  performCheck(a, 'a', [1])

  const make_empty = MyEnum.make()
  performCheck(make_empty, 'empty', {})

  const make_a = MyEnum.make(1)
  performCheck(make_a, 'a', [1])
})

test('nested enums', (t) => {
  type Color<A> = Case<'red', A> | Case<'green', [A]> | Case<'blue', { a: A }>

  interface ColorHKT extends HKT {
    readonly type: Color<this['_A']>
  }

  const Color = makeEnum1<ColorHKT>()

  type Wrapper<A> = Case<'none'> | Case<'some', Color<A>>

  interface WrapperHKT extends HKT {
    readonly type: Wrapper<this['_A']>
  }

  const Wrapper = makeEnum1<WrapperHKT>()

  t.deepEqual(Wrapper.some(Color.red(1)), {
    case: 'some',
    p: { case: 'red', p: 1 },
  })

  t.deepEqual(Wrapper.some(Color.green([1])), {
    case: 'some',
    p: { case: 'green', p: [1] },
  })

  t.deepEqual(Wrapper.some(Color.blue({ a: 1 })), {
    case: 'some',
    p: { case: 'blue', p: { a: 1 } },
  })
})

test('weird generics', (t) => {
  interface MaybeProto<T> {
    map<U>(transform: (value: T) => U): Maybe<U>
  }

  type Maybe<T> = MaybeProto<T> & (Case<'none'> | Case<'some', T>)

  interface MaybeHKT extends HKT {
    readonly type: Maybe<this['_A']>
  }

  interface MaybeType {
    fromValue<T>(value: T): Maybe<NonNullable<T>>
  }

  const Maybe = makeEnum1<MaybeHKT, MaybeType>({
    makeProto: (Maybe) => ({
      map(transform) {
        switch (this.case) {
          case 'none':
            return Maybe.none()
          case 'some':
            return Maybe.some(transform(this.p))
        }
      },
    }),
    makeType: (Maybe) => ({
      fromValue(value) {
        return value ? Maybe.some(value) : Maybe.none()
      },
    }),
  })

  t.like(Maybe.none(), { case: 'none', p: unit })
  t.like(Maybe.some(42), { case: 'some', p: 42 })
})

test('CasePath', (t) => {
  type Container<A> =
    | Case<'value', A>
    | Case<'array', [A]>
    | Case<'object', { a: A }>

  interface ContainerHKT extends HKT {
    readonly type: Container<this['_A']>
  }

  const Container = makeEnum1<ContainerHKT>()

  const value = Container.value(42)
  const array = Container.array([42])
  const object = Container.object({ a: 42 })

  const cp1 = Container<number>('value')
  const cp2 = Container<number>('array')
  const cp3 = Container<number>('object')

  t.deepEqual(cp1.extract(value), { value: 42 })
  t.deepEqual(cp1.extract(array), undefined)
  t.deepEqual(cp1.extract(object), undefined)

  t.deepEqual(cp2.extract(value), undefined)
  t.deepEqual(cp2.extract(array), { value: [42] })
  t.deepEqual(cp2.extract(object), undefined)

  t.deepEqual(cp3.extract(value), undefined)
  t.deepEqual(cp3.extract(array), undefined)
  t.deepEqual(cp3.extract(object), { value: { a: 42 } })

  t.deepEqual(cp1.embed(-1), Container.value(-1))
  t.deepEqual(cp2.embed([-1]), Container.array([-1]))
  t.deepEqual(cp3.embed({ a: -1 }), Container.object({ a: -1 }))
})

test('CasePath modification', (t) => {
  type Container<A> = Case<'primitive', number> | Case<'object', { a: A }>

  interface ContainerHKT extends HKT {
    readonly type: Container<this['_A']>
  }

  const Container = makeEnum1<ContainerHKT>()

  t.deepEqual(
    Container('primitive').modify(Container.primitive(42), (n) => n * n),
    Container.primitive(1764)
  )

  t.deepEqual(
    Container('object').modify(Container.object({ a: 'value' }), ({ a }) => ({
      a: a + '!',
    })),
    Container.object({ a: 'value!' })
  )

  t.deepEqual(
    Container('object').modify(Container.object({ a: 'value' }), (obj) => {
      obj.a += '!'
    }),
    Container.object({ a: 'value!' })
  )
})
