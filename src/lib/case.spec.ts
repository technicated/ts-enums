// noinspection JSUnusedAssignment

import test from 'ava'
import { Case } from './case'

test('empty case', (t) => {
  let emptyCase: Case<'some'>

  // @ts-expect-no-error
  emptyCase = { case: 'some' }

  // @ts-expect-error: no payload should be passed to empty case
  emptyCase = { case: 'some', value: 42 }

  // @ts-expect-error: case value is not compatible with declaration
  emptyCase = { case: 'wrong' }

  t.truthy(emptyCase)
})

test('case with object payload', (t) => {
  let caseWithObjectPayload: Case<'some', { id: number; name: string }>

  // @ts-expect-no-error
  caseWithObjectPayload = { case: 'some', id: 1, name: 'User' }

  // @ts-expect-error: wrong payload types
  caseWithObjectPayload = { case: 'some', id: 'xyz', name: 42 }

  // @ts-expect-error: missing payload
  caseWithObjectPayload = { case: 'some' }

  t.truthy(caseWithObjectPayload)
})

test('case with array payload', (t) => {
  let caseWithArrayPayload: Case<'some', [number, string]>

  // @ts-expect-no-error
  caseWithArrayPayload = { case: 'some', '0': 1, '1': 'User' }

  // @ts-expect-no-error
  caseWithArrayPayload = { case: 'some', 0: 1, 1: 'User' }

  // @ts-expect-error: wrong payload types
  caseWithArrayPayload = { case: 'some', '0': 'User', '1': 42 }

  // @ts-expect-error: incompetent payload
  caseWithArrayPayload = { case: 'some', 0: 1 }

  // @ts-expect-error: extra payload value
  caseWithArrayPayload = { case: 'some', 0: 1, 1: 'User', 2: false }

  // @ts-expect-error: missing payload
  caseWithArrayPayload = { case: 'some' }

  t.truthy(caseWithArrayPayload)
})
