import { cases } from './case'
import { unit } from './unit'

export const makeEnum = ({
  makeProto,
  makeType,
}: {
  makeProto?: (enumProxy: object) => object
  makeType?: (enumProxy: object) => object
} = {}) => {
  const protoWrapper: { proto: object } = { proto: {} }
  const typeWrapper: { type: object } = { type: {} }

  const result = new Proxy(typeWrapper, {
    get({ type }: { type: Record<string | symbol, unknown> }, prop) {
      if (prop in type) {
        return type[prop]
      }

      if (prop === cases) {
        return new Proxy({}, { get: (_: unknown, prop) => prop })
      }

      return (...args: [payload?: unknown]) => {
        const obj = Object.defineProperties(
          {},
          {
            case: {
              configurable: false,
              enumerable: true,
              value: prop,
              writable: false,
            },
            p: {
              configurable: false,
              enumerable: true,
              value: args.length ? args[0] : unit,
              writable: false,
            },
          }
        )

        return Object.setPrototypeOf(obj, protoWrapper.proto)
      }
    },
    has({ type }: { type: Record<string | symbol, unknown> }, prop): boolean {
      return prop in type
    },
  })

  if (makeProto) {
    protoWrapper.proto = makeProto(result)
  }

  if (makeType) {
    typeWrapper.type = makeType(result)
  }

  return result
}
