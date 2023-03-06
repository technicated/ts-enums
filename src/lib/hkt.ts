export interface HKT {
  readonly _A?: unknown
  readonly type?: unknown
}

export type Kind<T extends HKT, A> = (T & { _A: A })['type']

export interface HKT2 {
  readonly _A?: unknown
  readonly _B?: unknown
  readonly type?: unknown
}

export type Kind2<T extends HKT2, A, B> = (T & { _A: A; _B: B })['type']
