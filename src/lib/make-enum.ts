/* eslint-disable @typescript-eslint/ban-types */

export const makeEnum = (makeProto?: unknown, type?: unknown): unknown => {
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
