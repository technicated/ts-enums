export type CaseName<Name extends string> = { readonly case: Name }

export type Case<Name extends string, Payload = never> = [Payload] extends [
  never
]
  ? CaseName<Name>
  : CaseName<Name> & { readonly p: Payload }

export const cases: unique symbol = Symbol('ts-enums: Enum cases list')

export type Cast<
  Enum extends { readonly case: string },
  C extends Enum['case']
> = Enum & CaseName<C>
