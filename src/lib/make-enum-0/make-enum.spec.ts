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
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b({ value: args[0] })
          case 2:
            return MyEnum.c([args[1], args[0]])
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
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b({ value: args[0] })
          case 2:
            return MyEnum.c([args[1], args[0]])
        }
      },
    }),
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
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b({ value: args[0] })
          case 2:
            return MyEnum.c([args[1], args[0]])
        }
      },
    }),
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
    makeType: (MyEnum) => ({
      make(...args) {
        switch (args.length) {
          case 0:
            return MyEnum.a()
          case 1:
            return MyEnum.b({ value: args[0] })
          case 2:
            return MyEnum.c([args[1], args[0]])
        }
      },
    }),
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

test('nested enums', (t) => {
  type Color = Case<'red'> | Case<'green'> | Case<'blue'>
  const Color = makeEnum<Color>()

  type Wrapper = Case<'none'> | Case<'some', Color>
  const Wrapper = makeEnum<Wrapper>()

  t.deepEqual(Wrapper.some(Color.red()), {
    case: 'some',
    p: { case: 'red', p: unit },
  })

  t.deepEqual(Wrapper.some(Color.green()), {
    case: 'some',
    p: { case: 'green', p: unit },
  })

  t.deepEqual(Wrapper.some(Color.blue()), {
    case: 'some',
    p: { case: 'blue', p: unit },
  })
})

test('CasePath', (t) => {
  type Container =
    | Case<'a_number', number>
    | Case<'a_string', string>
    | Case<'another_number', number>

  const Container = makeEnum<Container>()

  const aNumber = Container.a_number(42)
  const aString = Container.a_string('hello world')
  const anotherNumber = Container.another_number(999)

  //const cp1 = Container[casePath]('a_number')
  const cp1 = Container('a_number')
  //const cp2 = Container[casePath]('a_string')
  const cp2 = Container('a_string')
  //const cp3 = Container[casePath]('another_number')
  const cp3 = Container('another_number')

  t.deepEqual(cp1.extract(aNumber), { value: 42 })
  t.deepEqual(cp1.extract(aString), undefined)
  t.deepEqual(cp1.extract(anotherNumber), undefined)

  t.deepEqual(cp2.extract(aNumber), undefined)
  t.deepEqual(cp2.extract(aString), { value: 'hello world' })
  t.deepEqual(cp2.extract(anotherNumber), undefined)

  t.deepEqual(cp3.extract(aNumber), undefined)
  t.deepEqual(cp3.extract(aString), undefined)
  t.deepEqual(cp3.extract(anotherNumber), { value: 999 })

  t.deepEqual(cp1.embed(-1), Container.a_number(-1))
  t.deepEqual(cp2.embed('hi!'), Container.a_string('hi!'))
  t.deepEqual(cp3.embed(-1), Container.another_number(-1))
})

test('CasePath concatenation', (t) => {
  type Base = Case<'value1', string> | Case<'value2', number>
  const Base = makeEnum<Base>()

  type Parent = Case<'base', Base> | Case<'other', boolean>
  const Parent = makeEnum<Parent>()

  const cp1 = Parent('base').appending(Base('value1'))
  const cp2 = Parent('base').appending(Base('value2'))

  t.deepEqual(cp1.extract(Parent.base(Base.value1('hello'))), {
    value: 'hello',
  })
  t.deepEqual(cp1.extract(Parent.base(Base.value2(42))), undefined)
  t.deepEqual(cp1.extract(Parent.other(true)), undefined)

  t.deepEqual(cp2.extract(Parent.base(Base.value1('hello'))), undefined)
  t.deepEqual(cp2.extract(Parent.base(Base.value2(42))), { value: 42 })
  t.deepEqual(cp2.extract(Parent.other(true)), undefined)

  t.deepEqual(cp1.embed('hi'), Parent.base(Base.value1('hi')))
  t.deepEqual(cp2.embed(-1), Parent.base(Base.value2(-1)))

  type SuperParent = Case<'parent', Parent> | Case<'other'>
  const SuperParent = makeEnum<SuperParent>()

  const cp3 = SuperParent('parent').appending(cp1)

  t.deepEqual(
    cp3.extract(SuperParent.parent(Parent.base(Base.value1('hello')))),
    { value: 'hello' }
  )
  t.deepEqual(
    cp3.embed('hi'),
    SuperParent.parent(Parent.base(Base.value1('hi')))
  )
})

test('CasePath modification', (t) => {
  interface User {
    name: string
  }

  type Container = Case<'primitive', number> | Case<'object', User>

  const Container = makeEnum<Container>()

  t.deepEqual(
    Container('primitive').modify(Container.primitive(42), (n) => n * n),
    Container.primitive(1764)
  )

  t.deepEqual(
    Container('object').modify(Container.object({ name: 'name' }), (user) => ({
      name: user.name + '!',
    })),
    Container.object({ name: 'name!' })
  )

  t.deepEqual(
    Container('object').modify(Container.object({ name: 'name' }), (user) => {
      user.name += '!'
    }),
    Container.object({ name: 'name!' })
  )
})
