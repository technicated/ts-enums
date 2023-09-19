import { Unit } from './unit'

// type ProcessArrayPayload<
//   Payload extends unknown[],
//   Index extends number = 0
// > = Payload extends [infer H, ...infer T]
//   ? Record<Index, H> & ProcessArrayPayload<T, Incr<Index>>
//   : {}

// type ProcessPayload<Payload extends object> = Payload extends unknown[]
//   ? ProcessArrayPayload<Payload>
//   : Payload

export type Case<Name extends string, Payload = Unit> = {
  readonly case: Name
  readonly payload: Payload
}

export const cases: unique symbol = Symbol('Enum cases list')

export type Cast<
  Enum extends { readonly case: string },
  C extends Enum['case']
> = Enum & { readonly case: C }
