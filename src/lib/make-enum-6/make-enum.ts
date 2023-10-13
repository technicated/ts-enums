import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape, EnumType extends object = never>(
    ...args: MakeEnumFnArgs<Enum, EnumType>
  ): [EnumType] extends [never] ? EnumCtors<Enum> : EnumType & EnumCtors<Enum>
}

export const makeEnum6 = base.makeEnum as MakeEnumFn
