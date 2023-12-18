import { Case, CasePath, casePath, cases, EnumShape } from './case'
import { unit } from './unit'

function opt<A, T>(
  value: NonNullable<A> | undefined,
  fn: (a: NonNullable<A>) => T
): T | undefined {
  return value !== undefined ? fn(value) : undefined
}

class CasePathImpl<Root extends EnumShape, Value> {
  static from<Root extends Case<string, Value>, Value>(
    enumCtors: Record<Root['case'], (payload: Value) => Root>,
    enumCase: Root['case']
  ): CasePathImpl<Root, Value> {
    return new CasePathImpl(
      (root) => (root.case === enumCase ? { value: root.p } : undefined),
      (value) => enumCtors[enumCase](value)
    )
  }

  private constructor(
    public readonly extract: (root: Root) => { value: Value } | undefined,
    public readonly embed: (value: Value) => Root
  ) {}

  appending<Root extends EnumShape, Value extends EnumShape, Leaf>(
    this: CasePath<Root, Value>,
    other: CasePath<Value, Leaf>
  ): CasePathImpl<Root, Leaf> {
    return new CasePathImpl(
      (root) => opt(this.extract(root), ({ value }) => other.extract(value)),
      (value) => this.embed(other.embed(value))
    )
  }

  params() {
    return this
  }
}

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
    get({ type }: { type: Record<string | symbol, unknown> }, prop, proxy) {
      if (prop in type) {
        return type[prop]
      }

      if (prop === casePath) {
        return (
          enumCase: string
        ): CasePath<EnumShape, unknown> & { params: unknown } =>
          CasePathImpl.from(proxy, enumCase)
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
