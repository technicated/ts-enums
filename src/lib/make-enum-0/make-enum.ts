import * as base from '../make-enum'
import { EnumCtors, EnumShape, MakeEnumFnArgs } from './types'

interface MakeEnumFn {
  <Enum extends EnumShape, EnumType extends object = never>(
    ...args: MakeEnumFnArgs<Enum, EnumType>
  ): [EnumType] extends [never] ? EnumCtors<Enum> : EnumType & EnumCtors<Enum>
}

/**
 * Create an enum given a specific shape and an optional definition.
 *
 * This is the main variant of the `makeEnum` family of functions of the
 * `ts-enums` library, creating enums which are not generic. You must supply at
 * least one generic parameter to it, representing your enum type definition
 * (cases + optional prototype), and an optional second generic parameter
 * representing other static properties and methods.
 *
 * The `makeEnum` function automatically detects the "flavour" of your enum and
 * asks you to supply the prototype and / or the type implementation when
 * needed.
 *
 * There are some conventions when declaring and using an enum, so please refer
 * to the README for further information.
 *
 * You use the `makeEnum` function like the following:
 *
 * ```typescript
 * // Enum with no prototype and no statics
 * type Shape =
 *   | Case<'circle', { radius: number }>
 *   | Case<'rectangle', { width: number, height: number }>
 *   | Case<'square', { side: number }>
 *
 * const Shape = makeEnum<Shape>()
 * var s = Shape.circle({ radius: 20 })
 * s = Shape.rectangle({ width: 400, height: 300 })
 *
 * // Enum with prototype and no statics
 * interface ShapeProto {
 *   area(): number
 * }
 *
 * type Shape = ShapeProto & (
 *   | Case<'circle', { radius: number }>
 *   | Case<'rectangle', { width: number, height: number }>
 *   | Case<'square', { side: number }>
 * )
 *
 * const Shape = makeEnum<Shape>({
 *   makeProto: () => ({
 *     area() {
 *       switch (this.case) {
 *         case 'circle': return Math.PI * this.p.radius ** 2
 *         case 'rectangle': return this.p.width * this.p.height
 *         case 'square': return this.p.side ** 2
 *       }
 *     },
 *   }),
 * })
 *
 * var s = Shape.circle({ radius: 20 })
 * console.log(s.area()) // prints something like 1256.637...
 * s = Shape.rectangle({ width: 400, height: 300 })
 * console.log(s.area()) // prints 120000
 *
 * // Enum with no prototype and statics
 * interface ShapeType {
 *   fromConfig(...args: [number, number?]): Shape
 * }
 *
 * type Shape =
 *   | Case<'circle', { radius: number }>
 *   | Case<'rectangle', { width: number, height: number }>
 *   | Case<'square', { side: number }>
 *
 * const Shape = makeEnum<Shape, ShapeType>({
 *   makeType: (Shape) => ({
 *     fromConfig(...args) {
 *       const [a, b] = args
 *
 *       if (b === undefined) {
 *         return Shape.circle({ radius: a })
 *       } else if (a === b) {
 *         return Shape.square({ side: a })
 *       } else {
 *         return Shape.rectangle({ width: a, height: b })
 *       }
 *     },
 *   }),
 * })
 *
 * var s = Shape.fromConfig(20)
 * console.log(s) // will be a circle
 * s = Shape.fromConfig(20, 20)
 * console.log(s) // will be a square
 * s = Shape.fromConfig(20, 30)
 * console.log(s) // will be a rectangle
 * ```
 */
export const makeEnum = base.makeEnum as MakeEnumFn

const asd = makeEnum<null>()
