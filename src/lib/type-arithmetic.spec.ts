// noinspection JSUnusedAssignment

import test from 'ava'
import { Add, BuildTuple, Length } from './type-arithmetic'

test('Length', (t) => {
  let zeroLength: Length<[]>
  let oneLength: Length<[unknown]>
  let twoLength: Length<[unknown, unknown]>

  // @ts-expect-no-error
  zeroLength = 0

  // @ts-expect-error: must be 1
  oneLength = 0

  // @ts-expect-error: must be 2
  twoLength = 0

  // @ts-expect-error: must be 0
  zeroLength = 1

  // @ts-expect-no-error
  oneLength = 1

  // @ts-expect-error: must be 2
  twoLength = 1

  // @ts-expect-error: must be 0
  zeroLength = 2

  // @ts-expect-error: must be 1
  oneLength = 2

  // @ts-expect-no-error
  twoLength = 2

  t.truthy(zeroLength)
  t.truthy(oneLength)
  t.truthy(twoLength)
})

test('BuildTuple', (t) => {
  let zeroLength: BuildTuple<0>
  let oneLength: BuildTuple<1>
  let twoLength: BuildTuple<2>

  // @ts-expect-no-error
  zeroLength = []

  // @ts-expect-error: must be 1
  oneLength = []

  // @ts-expect-error: must be 2
  twoLength = []

  // @ts-expect-error: must be 0
  zeroLength = [undefined]

  // @ts-expect-no-error
  oneLength = [undefined]

  // @ts-expect-error: must be 2
  twoLength = [undefined]

  // @ts-expect-error: must be 0
  zeroLength = [undefined, undefined]

  // @ts-expect-error: must be 1
  oneLength = [undefined, undefined]

  // @ts-expect-no-error
  twoLength = [undefined, undefined]

  t.truthy(zeroLength)
  t.truthy(oneLength)
  t.truthy(twoLength)
})

test('add', (t) => {
  let zero: Add<0, 0>
  let one_a: Add<0, 1>
  let one_b: Add<1, 0>
  let two: Add<1, 1>

  // @ts-expect-no-error
  zero = 0

  // @ts-expect-error: must be 0
  zero = 1

  // @ts-expect-error: must be 0
  zero = 2

  // @ts-expect-error: must be 1
  one_a = 0

  // @ts-expect-no-error
  one_a = 1

  // @ts-expect-error: must be 1
  one_a = 2

  // @ts-expect-error: must be 1
  one_b = 0

  // @ts-expect-no-error
  one_b = 1

  // @ts-expect-error: must be 1
  one_b = 2

  // @ts-expect-error: must be 2
  two = 0

  // @ts-expect-error: must be 2
  two = 1

  // @ts-expect-no-error
  two = 2

  t.truthy(zero)
  t.truthy(one_a)
  t.truthy(one_b)
  t.truthy(two)
})
