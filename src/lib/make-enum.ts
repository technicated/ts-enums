import { cases } from './case'
import { unit } from './unit'

export const makeEnum = ({
  makeProto,
  type,
}: {
  makeProto?: (enumProxy: object) => object
  type?: object
} = {}) => {
  const protoWrapper: { proto: object } = { proto: {} }

  const result = new Proxy(type || {}, {
    get(type: Record<string | symbol, unknown>, prop) {
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
  })

  if (makeProto) {
    protoWrapper.proto = makeProto(result)
  }

  return result
}
