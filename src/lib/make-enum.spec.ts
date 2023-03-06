import test from 'ava'
import { Case } from './case'
import { makeEnum } from './make-enum'

test('boh', (t) => {
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

  const a = MyEnum.a() as MyEnum & Record<string, unknown>
  t.false(Object.getOwnPropertyDescriptor(a, 'case')?.writable)
  t.is(a.case, 'a')
  t.is(a.value, undefined)
  t.is(a[0], undefined)
  t.is(a[1], undefined)
  t.is(a.self, a)
  t.is(a.getNumber(), -1)

  const b = MyEnum.b({ value: 42 }) as MyEnum & Record<string, unknown>
  t.false(Object.getOwnPropertyDescriptor(b, 'case')?.writable)
  t.is(b.case, 'b')
  t.is(b.value, 42)
  t.is(b[0], undefined)
  t.is(b[1], undefined)
  t.is(b.self, b)
  t.is(b.getNumber(), 42)

  const c = MyEnum.c(['hello', 42]) as MyEnum & Record<string, unknown>
  t.false(Object.getOwnPropertyDescriptor(c, 'case')?.writable)
  t.is(c.case, 'c')
  t.is(c.value, undefined)
  t.is(c[0], 'hello')
  t.is(c[1], 42)
  t.is(c.self, c)
  t.is(c.getNumber(), 1764)
})
