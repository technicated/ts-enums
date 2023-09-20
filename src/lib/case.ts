/* eslint-disable @typescript-eslint/ban-types */

import { Incr } from './type-arithmetic'
import { Unit } from './unit'

export const payload: unique symbol = Symbol('Enum payload value')
export type Payload = typeof payload

type ProcessArrayPayload<
  Payload extends unknown[],
  Index extends number = 0
> = Payload extends [infer H, ...infer T]
  ? Record<Index, H> & ProcessArrayPayload<T, Incr<Index>>
  : {}

type ProcessPayload<Payload> = Payload extends
  | bigint
  | boolean
  | null
  | number
  | string
  | symbol
  | undefined
  ? { payload: Payload }
  : Payload extends unknown[]
  ? ProcessArrayPayload<Payload>
  : Payload

export type Case<Name extends string, Payload = Unit> = {
  readonly case: Name
  readonly [payload]: Payload
} & ProcessPayload<Payload>

export const cases: unique symbol = Symbol('Enum cases list')

export type Cast<
  Enum extends { readonly case: string },
  C extends Enum['case']
> = Enum & { readonly case: C }
