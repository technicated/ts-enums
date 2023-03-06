/* eslint-disable @typescript-eslint/ban-types */

import { Incr } from './type-arithmetic'

type ProcessArrayPayload<
  Payload extends unknown[],
  Index extends number = 0
> = Payload extends [infer H, ...infer T]
  ? Record<Index, H> & ProcessArrayPayload<T, Incr<Index>>
  : {}

type ProcessPayload<Payload extends object> = Payload extends unknown[]
  ? ProcessArrayPayload<Payload>
  : Payload

export type Case<Name extends string, Payload extends object = {}> = {
  readonly case: Name
} & ProcessPayload<Payload>
