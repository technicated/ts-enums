/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Case } from './case'

let emptyCase: Case<'some'>

// @ts-expect-no-error
emptyCase = { case: 'some' }

// @ts-expect-error
emptyCase = { case: 'wrong' }

let caseWithObjectPayload: Case<'some', { id: number, name: string }>

// @ts-expect-no-error
caseWithObjectPayload = { case: 'some', id: 1, name: 'User' }

// @ts-expect-error
caseWithObjectPayload = { case: 'some' }

let caseWithArrayPayload: Case<'some', [number, string]>

// @ts-expect-no-error
caseWithArrayPayload = { case: 'some', '0': 1, '1': 'User' }

// @ts-expect-error
caseWithArrayPayload = { case: 'some' }
