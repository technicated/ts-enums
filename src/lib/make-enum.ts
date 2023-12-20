import { Case, CasePath, cases, EnumShape } from './case'
import { unit } from './unit'

function opt<U, V>(
  value: NonNullable<U> | undefined,
  fn: (a: NonNullable<U>) => V
): V | undefined {
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

type MakeCasePathFn = {
  (enumCase: string): CasePath<EnumShape, unknown>
}

export const makeEnum = ({
  makeProto,
  makeType,
}: {
  makeProto?: (enumProxy: object) => object
  makeType?: (enumProxy: object) => Record<string | symbol, unknown>
} = {}) => {
  const protoWrapper: { proto: object } = { proto: {} }
  const typeWrapper: { type: Record<string | symbol, unknown> } = { type: {} }

  const makeCasePath: MakeCasePathFn = (enumCase) =>
    CasePathImpl.from(
      result as Record<string, (payload: unknown) => EnumShape>,
      enumCase
    )

  const result: object = new Proxy(makeCasePath, {
    get(_, prop) {
      const { type } = typeWrapper

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
    has(_, prop): boolean {
      return prop in typeWrapper.type
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
