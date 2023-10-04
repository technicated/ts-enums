import fs from 'fs'

function generateTypesFile(arity: number): void {
  if (arity < 0) {
    throw new Error('Bad arity < 0')
  }

  const isGeneric = arity !== 0
  const n = arity === 1 ? '' : `${arity}`
  const typeParams = Array.from({ length: arity }, (_, i) => `T${i}`)

  const genericClause = (...args: string[]): string => {
    const result = [...args, ...typeParams]
    return result.length ? `<${result.join(', ')}>` : ''
  }

  const Enum = {
    toString: () => isGeneric ? 'EnumHKT' : 'Enum',
    case: isGeneric ? `EnumHKT['type']['case']` : `Enum['case']`,
    kind: isGeneric ? `Kind${n}${genericClause('EnumHKT')}` : 'Enum',
    subject: isGeneric ? `EnumHKT['type']` : 'Enum',
  }

  const template = `import { EnumShape as BaseEnumShape, cases, Cast } from '../case'
${isGeneric ? `import { HKT${n}, Kind${n} } from '../hkt'` : ''}
import { Unit } from '../unit'

export type EnumShape = ${isGeneric ? `HKT${n} & { readonly type: BaseEnumShape }` : 'BaseEnumShape'}

type CasesOfEnum<${Enum} extends EnumShape> = {
  [Case in ${Enum['case']}]: Case
}

// this has to be a separated type or \`EnumCtors\` will not work!
type EnumCtorArgs
  ${genericClause(
    `${Enum} extends EnumShape`,
    `Case extends ${Enum['case']}`
  )}
= [Cast<${Enum.kind}, Case>['p']]

export type EnumCtors<${Enum} extends EnumShape> = {
  [Case in ${Enum['case']}]: ${genericClause()}(
    // this has to be this weird check in order for TS to not complain in some edge cases
    //  like the presence of \`NonNullable<*>\`
    ...args: Cast<${Enum.kind}, Case>['p'] extends Unit
      ? Partial<EnumCtorArgs${genericClause(`${Enum}`, 'Case')}>
      : EnumCtorArgs${genericClause(`${Enum}`, 'Case')}
  ) => ${Enum.kind}
} & Record<typeof cases, CasesOfEnum<${Enum}>>

type MakeProtoFn<${Enum} extends EnumShape, EnumType extends object> = ${genericClause()}(
  Enum: [EnumType] extends [never]
    ? EnumCtors<${Enum}>
    : EnumCtors<${Enum}> & EnumType
) => ThisType<${Enum.kind}> & Omit<${Enum.kind}, 'case' | 'p'>

export type MakeEnumFnArgs<
  ${Enum} extends EnumShape,
  EnumType extends object = never
> = [EnumType] extends [never]
  ? ${Enum.subject} & { _: unknown } extends infer _T
    ? keyof Omit<_T, 'case' | 'p'> extends '_'
      ? []
      : [{ makeProto: MakeProtoFn<${Enum}, EnumType> }]
    : never
  : ${Enum.subject} & { _: unknown } extends infer _T
  ? keyof Omit<_T, 'case' | 'p'> extends '_'
    ? [{ type: EnumType }]
    : [{ makeProto: MakeProtoFn<${Enum}, EnumType>; type: EnumType }]
  : never

export type CasesOf<Ctors> = Ctors extends EnumCtors<infer ${Enum}>
  ? ${Enum.case}
  : never
`

  const fileName = `src/lib/subdir/make-enum-${arity}/types.ts`
  fs.writeFileSync(fileName, template)
}

function generateMakeEnumFile(arity: number): void {
  if (arity < 0) {
    throw new Error('Bad arity < 0')
  }

  const template = `import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape, EnumType extends object = never>(
    ...args: MakeEnumFnArgs<Enum, EnumType>
  ): [EnumType] extends [never] ? EnumCtors<Enum> : EnumType & EnumCtors<Enum>
}

export const makeEnum${arity === 0 ? '' : arity} = base.makeEnum as MakeEnumFn
`

  const fileName = `src/lib/subdir/make-enum-${arity}/make-enum.ts`
  fs.writeFileSync(fileName, template)
}

if (!fs.existsSync('src/lib/subdir')) {
  fs.mkdirSync('src/lib/subdir')
}

// Generate files for arities 1 to N
const N = 6 // Set N to the maximum arity you want to generate
for (let arity = 0; arity <= N; arity++) {
  if (!fs.existsSync(`src/lib/subdir/make-enum-${arity}`)) {
    fs.mkdirSync(`src/lib/subdir/make-enum-${arity}`)
  }

  generateTypesFile(arity)
  generateMakeEnumFile(arity)
}
