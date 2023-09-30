/* eslint-disable @typescript-eslint/ban-types */

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

export const makeEnumOld = (makeProto?: unknown, type?: unknown): unknown => {
  const protoWrapper: { proto: object } = { proto: {} }

  const actualMakeProto = (
    typeof makeProto === 'object' ? undefined : makeProto
  ) as Function | undefined

  const actualType = typeof makeProto === 'object' ? makeProto : type

  const proxy = new Proxy(actualType || {}, {
    get(type: Record<string | symbol, unknown>, prop) {
      if (prop in type) {
        return type[prop]
      }

      if (prop === cases) {
        return new Proxy({}, { get: (_: unknown, prop) => prop })
      }

      return (payload: object) =>
        Object.setPrototypeOf(
          Object.defineProperty({ ...payload }, 'case', {
            configurable: false,
            enumerable: true,
            value: prop,
            writable: false,
          }),
          protoWrapper.proto
        )
    },
  })

  protoWrapper.proto = actualMakeProto ? actualMakeProto(proxy) : {}
  return proxy
}
