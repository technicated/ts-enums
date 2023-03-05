import { HKT } from './hkt'

export type EnumShape = {
  readonly case: string
}

export type EnumHKTShape = HKT & { type: EnumShape }
export type ProtoHKTShape = HKT & { type: object }
