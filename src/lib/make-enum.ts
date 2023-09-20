import { cases, payload as payloadSymbol } from './case'
import { unit } from './unit'

export const makeEnum = (args?: { proto?: object; type?: object }): unknown => {
  const proto = args?.proto || {}
  const type = args?.type || {}

  return new Proxy(type, {
    get(type: Record<string | symbol, unknown>, prop: string | symbol) {
      if (prop === cases) {
        return new Proxy({}, { get: (_: unknown, prop) => prop })
      }

      if (prop in type) {
        return type[prop]
      }

      return (...args: [unknown?]) => {
        const payload = args.length ? args[0] : unit

        const isObject = typeof payload === 'object' && payload !== null

        return Object.defineProperties(
          Object.setPrototypeOf(isObject ? { ...payload } : { payload }, proto),
          {
            case: {
              configurable: false,
              enumerable: true,
              value: prop,
              writable: false,
            },
            [payloadSymbol]: {
              configurable: false,
              enumerable: true,
              value: payload,
              writable: false,
            },
          }
        )
      }
    },
  })
}

// export const makeEnum = (makeProto?: unknown, type?: unknown): unknown => {
//   const protoWrapper: { proto: object } = { proto: {} }
//
//   const actualMakeProto = (
//     typeof makeProto === 'object' ? undefined : makeProto
//   ) as Function | undefined
//
//   const actualType = typeof makeProto === 'object' ? makeProto : type
//
//   const proxy = new Proxy(actualType || {}, {
//     get(type: Record<string | symbol, unknown>, prop) {
//       if (prop in type) {
//         return type[prop]
//       }
//
//       if (prop === cases) {
//         return new Proxy({}, { get: (_: unknown, prop) => prop })
//       }
//
//       return (payload: object) =>
//         Object.setPrototypeOf(
//           Object.defineProperty({ ...payload }, 'case', {
//             configurable: false,
//             enumerable: true,
//             value: prop,
//             writable: false,
//           }),
//           protoWrapper.proto
//         )
//     },
//   })
//
//   protoWrapper.proto = actualMakeProto ? actualMakeProto(proxy) : {}
//   return proxy
// }
