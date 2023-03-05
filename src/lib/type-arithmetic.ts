export type Length<T extends unknown[]> = T extends { length: infer L extends number } ? L : never

type BuildTuple<L extends number, T extends unknown[] = []> = T extends { length: L } ? T : BuildTuple<L, [...T, unknown]>

export type Add<A extends number, B extends number> = Length<[...BuildTuple<A>, ...BuildTuple<B>]>

export type Incr<A extends number> = Add<A, 1>
