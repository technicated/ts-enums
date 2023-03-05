export interface HKT {
  readonly _A?: unknown
  readonly type?: unknown
}

export type Kind<T extends HKT, A> = (T & { _A: A })['type']
