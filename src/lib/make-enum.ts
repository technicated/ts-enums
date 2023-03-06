import { Incr } from './type-arithmetic'
import { EnumShape } from './types'

type RecursiveCtorArgs<
  Obj extends object,
  Index extends number = 0
> = Obj extends Record<Index, infer V>
  ? [V, ...RecursiveCtorArgs<Omit<Obj, Index>, Incr<Index>>]
  : []

type EnumCtorArgs<
  Enum extends EnumShape,
  Case extends Enum['case'],
  Proto extends object
> = Enum & { _: unknown; case: Case } extends infer _T
  ? { _: unknown } extends Omit<_T, 'case' | keyof Proto>
    ? []
    : 0 extends keyof Omit<_T, 'case' | '_' | keyof Proto>
    ? [RecursiveCtorArgs<Omit<_T, 'case'>>]
    : [Omit<_T, 'case' | '_' | keyof Proto>]
  : never

type EnumCtors<Enum extends EnumShape, Proto extends object> = {
  [Case in Enum['case']]: (...args: EnumCtorArgs<Enum, Case, Proto>) => Enum
}

export function makeEnum<Enum extends EnumShape, Proto extends object = never>(
  makeProto: (e: EnumCtors<Enum, Proto>) => Proto & ThisType<Enum>
): EnumCtors<Enum, Proto> {
  const protoWrapper: { proto?: Proto } = {}

  const proxy = new Proxy(protoWrapper, {
    get({ proto }: { proto: never }, prop) {
      if (prop in proto) {
        return proto[prop]
      }

      return (payload: object) =>
        Object.setPrototypeOf(
          Object.defineProperty({ ...payload }, 'case', {
            configurable: false,
            enumerable: true,
            value: prop,
            writable: false,
          }),
          proto
        )
    },
  }) as EnumCtors<Enum, Proto>

  protoWrapper.proto = makeProto(proxy)
  return proxy
}
