import { EnumShape } from './case'

export function thisHelper<T extends EnumShape>(value: unknown): T {
  return value as T
}
