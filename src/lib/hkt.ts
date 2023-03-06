export interface HKT {
  readonly _A?: unknown
  readonly type?: unknown
}

export interface HKT2 extends HKT {
  readonly _B?: unknown
}

export interface HKT3 extends HKT2 {
  readonly _C?: unknown
}

export interface HKT4 extends HKT3 {
  readonly _D?: unknown
}

export interface HKT5 extends HKT4 {
  readonly _E?: unknown
}

export interface HKT6 extends HKT5 {
  readonly _F?: unknown
}

export type Kind<T extends HKT, A> = (T & { _A: A })['type']
export type Kind2<T extends HKT2, A, B> = (T & { _A: A; _B: B })['type']
export type Kind3<T extends HKT3, A, B, C> = (T & {
  _A: A
  _B: B
  _C: C
})['type']
export type Kind4<T extends HKT4, A, B, C, D> = (T & {
  _A: A
  _B: B
  _C: C
  _D: D
})['type']
export type Kind5<T extends HKT5, A, B, C, D, E> = (T & {
  _A: A
  _B: B
  _C: C
  _D: D
  _E: E
})['type']
export type Kind6<T extends HKT6, A, B, C, D, E, F> = (T & {
  _A: A
  _B: B
  _C: C
  _D: D
  _E: E
  _F: F
})['type']
