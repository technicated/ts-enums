/* eslint-disable @typescript-eslint/ban-types */

import { cases } from './case'

export const makeEnum = ({
  makeProto,
  type,
}: {
  makeProto?: Function
  type?: object
} = {}) => {
  const proto = makeProto ? makeProto() : {}

  return new Proxy(type || {}, {
    get(type: Record<string | symbol, unknown>, prop) {
      if (prop in type) {
        return type[prop]
      }

      if (prop === cases) {
        return new Proxy({}, { get: (_: unknown, prop) => prop })
      }

      return (...args: [payload?: unknown]) => {
        const obj = Object.defineProperty({}, 'case', {
          configurable: false,
          enumerable: true,
          value: prop,
          writable: false,
        })

        if (args.length) {
          Object.defineProperty(obj, 'p', {
            configurable: false,
            enumerable: true,
            value: args[0],
            writable: false,
          })
        }

        return Object.setPrototypeOf(obj, proto)
      }
    },
  })
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
