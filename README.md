# ts-enums

Sum types for TypeScript!

Have you ever wanted to be able to write something like this in TypeScript?

```typescript
// `enum` keyword was already taken 🤷
variant Maybe<T> {
  case none
  case some(T)

  static fromValue<T>(value: T): Maybe<NonNullable<T>> {
    return ((value !== null) && (value !== undefined))
      ? Maybe.some(value) // create an instance of `some` passing its argument
      : Maybe.none // create an instance of none by simply using its name
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    switch (this) {
      case none: return Maybe.none // nothing to do here
      case some(value): return Maybe.some(transform(value)) // `value` is bound to what's inside `this`, and is of type `T`
    }
    // no warnings / errors down there from the compiler because the `switch` is exhaustive
  }
```

Well, unfortunately this is not possible today... Maybe this can be introduced in TypeScript and compiled down to something in JavaScript, or it could be proposed as an Ecma feature, but surely it won't land in a couple of days!

This library tries to fill this gap, by introducing helper types and functions alongside a set of **_conventions_** to effectively use them. This will allow you to define your sum types / discriminated unions / tagged unions in TypeScript!

**IMPORTANT NOTE:** Please be aware that for the scope of this library, the term **enum** will be used to refer to discriminated unions and not to the basic enum feature that TypeScript provides.

That aside, let's start!

# Table of contents

Main topics:

* [Enum basics](#enum-basics)
* [Adding a payload](#adding-a-payload)
* [Adding a prototype](#adding-a-prototype)
  * [Recursive definition issue](#prototype-recursive-definition-issue)
* [Adding static methods](#adding-static-methods)
* [Using generics](#using-generics)

Utilities:

* [Cast](#cast)
* [cases](#cases)
* [CasesOf](todo)

Extra:

* [Conventions recap](#conventions-recap)
* [But why do I need enums?](#but-why-do-i-need-enums)
  * [Example #1 - Product item](#example-1---product-item)
  * [Example #2 - UI framework View Model](#example-2---ui-framework-view-model)
* [ts-pattern library](todo)

# Enum basics

[☝️ Back to TOC](#table-of-contents)

You can declare an enum by using a type alias (**_convention #1_**) and listing all of its cases using the `Case` helper type:

```typescript
type Color =
 | Case<'red'>
 | Case<'green'>
 | Case<'blue'>
```

`Case` is generic over the case name, which is the first type argument you pass in.

This is the "type definition part" of the enum, now you need to create the actual, real value that holds the cases constructors. For this, you use the `makeEnum` helper function and assign its result to a `const` named the same way as the type (this is **_convention #2_**).

```typescript
type Color =
 | Case<'red'>
 | Case<'green'>
 | Case<'blue'>

const Color = makeEnum<Color>()
```

The `makeEnum` function is generic, and you **must** pass the type alias definition as its type parameter so TypeScript can be able to offer autocompletion for you on `const Color` members.

And this is all it takes to create a simple enum! You can now instantiate it by using the case names as constructors:

```typescript
const r = Color.red() // .red is autocompleted, and r is of type `Color`
const g = Color.green() // .green is autocompleted, and g is of type `Color`
const b = Color.blue() // .blue is autocompleted, and b is of type `Color`
```

You can check the case of the enum value by inspecting its `case` property. You can do this whenever a boolean expression is required, and the type of the enum value will event be narrowed to the specific case in the subsequent scope (useful when you have a [payload](#adding-a-payload)):

```typescript
if (r.case === 'red') {
  console.log('It was red!')
} else {
  console.log('No red found...')
}
// prints "It was red!"

if (g.case === 'red') {
  console.log('It was red!')
} else {
  console.log('No red found...')
}
// prints "No red found..."
```

However, you get the strongest behavior when you use a `switch` statement:

```typescript
function makeColor(): Color { ... }

let n: number

let c = makeColor()

switch (c.case) {
  case 'red':
    n = 0
    break
  case 'green':
    n = 1
    break
  case 'blue':
    n = 2
    break
}

// you can use `n` here because the compiler can tell that it is initialized
console.log(n) // logs 0, 1 or 2

function isFavoriteColor(c: Color): boolean {
  switch (c.case) {
    case 'red': return true
    case 'green': return false
    case 'blue': return false
    // no need for a `default` case!
  }

  // no need for a `return` either! TypeScript will know that the function will return from one of the `switch` cases
}
```

Even better, if you add new cases to you enum the compiler will tell you that `n` is now uninitialized in some code paths and that `isFavoriteColor` does not return a value so you must either add `undefined` to the return type or handle all the missing cases.

# Adding a payload

[☝️ Back to TOC](#table-of-contents)

You add a payload to your enum by passing a second parameter to the `Case` type:

```typescript
type WithPayload =
  | Case<'none'> // will not carry a payload
  | Case<'primitive', number>
  | Case<'tuple', [string, boolean]>
  | Case<'object', Person>
  | Case<'array', Person[]>
```

You can access the payload on an instance of your enum using the `p` property. However, doing this outside of an `if` / `switch` / conditional will return a value whose type is _the union of the types of all the payloads_, since TypeScript cannot know the exact case of the enum instance.

```typescript
function makeEnumWithPayload(): WithPayload { ... }

const wp = makeEnumWithPayload()
const payload = wp.p
// `payload` is of type `unique symbol` | `number` | `[string, boolean]` | `Person` | `Person[]`
// What's about `unique symbol` you say? More on that later...

switch (wp.case) {
  case 'none':
    // nothing to unpack here
    console.log('is empty')
    break
  case 'primitive':
    // `wp.p` is of type `number`
    console.log('squared number is', wp.p * wp.p)
    break
  case 'tuple':
    // `wp.p` is of type `[string, boolean]`
    console.log('tuple values are', wp.p[0], wp.p[1])
    break
  case 'object':
    // `wp.p` is of type `Person`
    console.log('person name is', wp.p.name)
    break
  case 'array':
    // `wp.p` is of type `Person[]`
    console.log('people names are', wp.p.map(({ name }) => name).joined(', '))
    break
}
```

One last note: a payload-less enum is not actually "empty"! It does, in fact, contain a payload of value `unit`, which is a `Symbol` representing the absence of an actual, explicit payload. This is where the `unique symbol` from earlier came from! This `unit` is a constant value and doesn't add any extra information to the enum case, so it's like it doesn't exist (refer to _product types_ for further context).

`unit` and its type `Unit` are an implementation detail of the library and are mostly transparent to clients, but it's useful to know that the library has this little secret. The reason for its existence is to make the types of the library easier to define and deal with, in particular when creating conditional types it was easier to check for a `Unit` payload than to check if the `p` property existed or not.

# Adding a prototype

[☝️ Back to TOC](#table-of-contents)

You might want to add methods to your enum, like you do on objects. To do this, you perform two steps: first, you declare an interface to define the shape of the prototype, calling this interface `<MyEnumName>Proto` (**_convention #3_**), then you add this interface to the main type declaration and implement it using the first parameter of the `makeEnum` helper function:

```typescript
interface AnimalProto {
  makeNoise(): void  
}

type Animal = AnimalProto & (
  | Case<'dog'>
  | Case<'cat'>
  | Case<'duck'>
)

const Animal = makeEnum<Animal>({
  makeProto: () => ({
    // implement this method as a traditional function and not as an arrow function, so `this` will be bound to the instance of `Animal` on which this method is called
    makeNoise() {
      switch (this.case) {
        case 'dog':
          console.log('bark!')
          break
        case 'cat':
          console.log('meow!')
          break
        case 'duck':
          console.log('quack!')
          break
      }
    },
  }),
})

Animal.dog().makeNoise() // bark!
Animal.cat().makeNoise() // meow!
Animal.duck().makeNoise() // quack!
```

It is important to note that you need to use a function to create the prototype, instead of just specifying it as a plain object.

The reason has to to do with _generic parameters_, which we'll talk about in a subsequent section. In brief, when using generics, you cannot declare the prototype as an object because then you have no generic type(s) to pass to your generic enum type. By using a function instead, the library is able to sneak in the generic argument(s) for you!

## Prototype: recursive definition issue

[☝️ Back to TOC](#table-of-contents)

Defining a prototype this way brings an issue: if you need to define a method using the enum type itself (as a part of the signature or the method body), you will get the TypeScript error `"'your enum type' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer"`.

```typescript
interface AnimalProto {
  makeChild(): Animal
}

type Animal = AnimalProto & (
  | Case<'dog'>
  | Case<'cat'>
  | Case<'duck'>
)

// 'Animal' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer
const Animal = makeEnum<Animal>({
  makeProto: () => ({
    makeChild: () => ({
      switch (this.case) {
        case 'dog': return Animal.dog()
        case 'cat': return Animal.cat()
        case 'duck': return Animal.duck()
      }
    },
  })
})
```

Adding the return type to `makeChild` is trivial in the case of generic-less enums, but when generics are involved you would be missing the generic argument to pass to your generic enum. You can declare your own generic parameter, but the definition of the prototype will be a little bit obscured by all the notation. So, it's better to find another solution.

The solution is that you can receive a copy of the enum you are building as a parameter of the `makeProto` function, so that you can refer to that symbol instead of the value you are creating. It is **_convention #4_** to call this symbol with the same name of the enum.

```typescript
interface AnimalProto {
  makeChild(): Animal
}

type Animal = AnimalProto & (
  | Case<'dog'>
  | Case<'cat'>
  | Case<'duck'>
)

const Animal = makeEnum<Animal>({
  //          v here's the difference
  makeProto: (Animal) => ({
    makeChild() {
      // inside here, `Animal` now refers to the parameter of `makeProto` instead of the global `Animal` const
      switch (this.case) {
        case 'dog': return Animal.dog()
        case 'cat': return Animal.cat()
        case 'duck': return Animal.duck()
      }
    },
  }),
})
```

This is a little unfortunate, but is a very small price to pay to make everything work.

Finally, there is **_convention #5_**: you should omit the parameters and return types of the prototype methods from its implementation. TypeScript will infer these for you, and you'll be immediately warned if something is wrong should you change your enum definition!

# Adding static methods

[☝️ Back to TOC](#table-of-contents)

When you need to add static methods or properties to your enum, you also need to perform two steps, similar to how you add a prototype. First step: declare an interface with name `<MyEnumName>Type` (**_convention #6_**) containing all the desired methods / properties; step two: pass this interface as the second generic parameter to `makeEnum` and implement it using the first parameter of the function:

```typescript
type Color =
  | Case<'red'>
  | Case<'green'>
  | Case<'blue'>

interface ColorType {
  random(): Color
}

const Color = makeEnum<Color, ColorType>({
  type:  {
    random(): Color {
      if (Math.random() > 0.3) {
        return Color.red() // we prefer red!
      }

      return Math.random() < 0.5
        ? Color.green()
        : Color.blue()
    }
  }
})
```

[THIS IS EXPECTED TO CHANGE IN ORDER TO UNIFORM THE TWO INTERFACES] Defining the type has not the same issue of the [prototype declaration](#adding-a-prototype): you can directly refer to the enum type in the methods definition, so TypeScript can correctly reason about your types. This is true even for generic enums, since for static methods you are forced to specify the generic parameters (this is true even for "regular" classes). 

# Using generics

[☝️ Back to TOC](#table-of-contents)

The most powerful abstractions come from generics, and luckily TypeScript has them! However, to correctly integrate generics with `ts-enums`, you need to do an extra step to help the compiler digest and "pass down" the information about the generic types.

All the following examples will use a generic enum with a single generic parameter, but this library supports up to six of them (although I hope nobody will never need to utilize them 😅).

Let's translate the original `Maybe` example from the made-up `variant` syntax to this library's syntax. First the code, then the explanation - and for now we are going to omit the prototype and the static methods.

```typescript
type Maybe<T> =
  | Case<'none'>
  | Case<'some', T>

interface MaybeHKT extends HKT {
  readonly type: Maybe<this['_A']>
}

const Maybe = makeEnum1<MaybeHKT>()
```

The main differences here are the use of the helper function `makeEnum1` instead of `makeEnum` (note the trailing _1_) and the presence of the strange interface `MaybeHKT`.

First, the "overloaded" `makeEnum<n>` functions are needed in order for TypeScript to handle the correct number of generic type parameters, and there are seven variation of them (`makeEnum`, `makeEnum1`, ..., `makeEnum6`). The signature of all of them is identical, so modifying the number of generic type parameters used is a straightforward process - simply alter the function call.

For the second difference (`HKT`), we won't delve into the nitty-gritty higher-order functional-programming algebra-of-types details here (*), but we'll just going to understand what the `HKT` helper does for this library.

`HTK` simply **defers the resolution of generic parameters** within the enum type until you explicitly instantiate it. This approach ensures that TypeScript's type inference and code completion mechanisms work seamlessly.

_<small>(*) random blabbering, see [Bruce Richardson's answer on Quora](https://www.quora.com/How-are-higher-kinded-types-different-from-type-constructors-with-parametrized-generic-types) (terminology-heavy) or [the source for my implementation of this concept](https://dev.to/effect-ts/encoding-of-hkts-in-typescript-5c3) for more information.</small>_

By the way, this `HTK` stuff is only a three-liner, so I hope is not a deal breaker for adopting this library! Just faithfully define your extension of if as in the following snippet and enjoy:

```typescript
// example using `HKT3`, which has three generic parameters available for your enum type
interface MyEnumHKT extends HKT3 {
  readonly type MyEnum<this['_A'], this['_B'], this['_C']>
}
```

Let's finish by implementing the prototype and a static member for our generic enum - as you will see, the process remains identical to the non-generic case:

```typescript
interface MaybeProto<T> {
  map<U>(transform: (value: T) => U): Maybe<U>
}

type Maybe<T> = MaybeProto<T> & (
  | Case<'none'>
  | Case<'some', T>
)

interface MaybeHKT extends HKT {
  readonly type: Maybe<this['_A']>
}

interface MaybeType {
  fromValue<T>(value: T): Maybe<NonNullable<T>>
}

const Maybe = makeEnum1<MaybeHKT>({
  makeProto: (Maybe) => ({
    map(transform) {
      switch (this.case) {
        case 'none': return Maybe.none()
        case 'some': return Maybe.some(transform(this.p))
      }
    }
  }),
  type: {
    fromValue<T>(value: T): Maybe<NonNullable<T>> {
      return ((value !== null) && (value !== undefined))
        ? Maybe.some(value)
        : Maybe.none()
    },
  },
})
```

# Cast

[☝️ Back to TOC](#table-of-contents)

The `Cast` utility type allows you to manually narrow the type of an enum to a specific case. This can be useful, for example, to create type guards.

```typescript
type Hobby =
  | Case<'gardening', { hasGreenThumb: boolean }>
  | Case<'running', { milesPerDay: number }>
  | Case<'tv', { favoriteSeries: string }>

function isHealthyHobby(h: Hobby): h is Cast<Hobby, 'running'> {
  return h.case === 'running'
}

const hobby = ...

if (isHealthyHobby(hobby)) {
  // inside this block, `hobby.case` is 'running' and `hobby.p` is
  // `{ milesPerDay: number}`
  console.log(`Miles run per day: ${hobby.p.milesPerDay}!`)
}
```

# cases

[☝️ Back to TOC](#table-of-contents)

The `cases` utility is a Symbol that you can use to access all the case names of an enum. It maps a case name onto itself, so it can be used to avoid hard-coding case names in some part of the code. This is useful so that when / if the name is refactored you get a compile-time error instead of a (potential) runtime error.

```typescript
type TabBarRoute =
  | Case<'firstTab'>
  | Case<'secondTab'>
  | Case<'thirdTab'>

const routes: YourFavoriteFrameworkRoutes = [
  {
    // path: 'firstTab',
    path: TabBarRoute[cases].firstTab,
    component: FirstTabView,
  },
  {
    // path: 'secondTab',
    path: TabBarRoute[cases].secondTab,
    component: SecondTabView,
  },
  {
    // path: 'thirdTab',
    path: TabBarRoute[cases].thirdTab,
    component: ThirdTabView,
  },
]
```

# Conventions recap

[☝️ Back to TOC](#table-of-contents)

Here's a list of the conventions this library states for your convenience!

**_Convention #1_**: Declare your enum type using a _type alias_.

**_Convention #2_**: Assign the result of the `makeEnum` function to a `const` with the same name as the enum type.

**_Convention #3_**: When defining a prototype for your enum, name it `<EnumName>Proto`.

**_Convention #4_**: When using the enum copy inside the `makeProto` function (see [todo](#adding-a-prototype)), call the binding with the same name as the enum.

**_Convention #5_**: In the `makeProto` function, omit all parameters and return types from the implementation of the prototype methods.

**_Convention #6_**: When defining a type to hold static methods for your enum, name it `<EnumName>Type`.

# But why do I need enums?

[☝️ Back to TOC](#table-of-contents)

This is a valid question, _why do we even need enums_? If they are so important, why doesn't TypeScript (or rather JavaScript) offer them?

As a reminder, TypeScript _does_ offer enums, but these are not what we are talking about. TypeScript enums are like **C** enums, just a list of names to which numbers or string are attached to.

So, a more precise question could be, **why do we need discriminated unions**?

Discriminated unions are the dual of "standard" objects (*), and together they allow programmers to model data more accurately, eliminating invalid states at the type level.

_<small>(*) not only objects in the strict sense, but arrays and tuples are product types, too</small>_

While objects acts like the "multiplication" of the types of the properties they contain, discriminated unions act like the "sum" of the types they contain. An example will clarify this:

```typescript
type MealSize = 'small' | 'regular' | 'large' | 'xl'
// there are 4 possible values for an instance of `MealSize`

type Dessert = 'apple pie' | 'brownie' | 'cheesecake'
// there are 3 possible values for an instance of `Dessert`

interface Dinner {
  mainMealSize: MealSize
  dessert: Dessert
}

/**
 * How many different instances of `Dinner` can we create? Let's enumerate them:
 * 
 * { mainMealSize: 'small',   dessert: 'apple pie'  }
 * { mainMealSize: 'small',   dessert: 'brownie'    }
 * { mainMealSize: 'small',   dessert: 'cheesecake' }
 * { mainMealSize: 'regular', dessert: 'apple pie'  }
 * { mainMealSize: 'regular', dessert: 'brownie'    }
 * { mainMealSize: 'regular', dessert: 'cheesecake' }
 * { mainMealSize: 'large',   dessert: 'apple pie'  }
 * { mainMealSize: 'large',   dessert: 'brownie'    }
 * { mainMealSize: 'large',   dessert: 'cheesecake' }
 * { mainMealSize: 'xl',      dessert: 'apple pie'  }
 * { mainMealSize: 'xl',      dessert: 'brownie'    }
 * { mainMealSize: 'xl',      dessert: 'cheesecake' }
 *
 * There are 12 possible unique instances of `Dinner`, and guess you what - 4 * 3 = 12
 */

type OneShotFood =
  | Case<'meal', MealSize>
  | Case<'dessert', Dessert>

const OneShotFood = makeEnum<OneShotFood>()

/**
 * How many different instances of `OneShotFood` can we create? Let's enumerate them:
 * 
 * { case: 'meal',    p: 'small'      }
 * { case: 'meal',    p: 'regular'    }
 * { case: 'meal',    p: 'large'      }
 * { case: 'meal',    p: 'xl'         }
 * { case: 'dessert', p: 'apple pie'  }
 * { case: 'dessert', p: 'brownie'    }
 * { case: 'dessert', p: 'cheesecake' }
 * 
 * There are 7 possible unique instances of `OneShotFood`, and guess you what - 4 + 3 = 7
 */
```

I hope the examples explained what I meant! So, product types (object, arrays, ...) and sum types (proper enums / discriminated unions) are two faces of the same coin, and knowing both of them lets you model your data with more accuracy.

I will now provide some examples of suboptimal data modeling that only uses product types and an updated version that uses both product and sum types.

## Example #1 - Product item

[☝️ Back to TOC](#table-of-contents)

```typescript
// -- suboptimal way

class Product {
  // remember to put this to `false` if `isInStock` is `true`
  isInBackOrder: boolean
  isInStock: boolean
  name: string
  // remember to put this to `0` if `isInStock` is `false`
  quantity: number

  static inStock(name: string, quantity: number): Product {
    return new Product(name, true, quantity, false)
  }

  static outOfStock(name: string, isInBackOrder: boolean): Product {
    return new Product(name, true, 0, isInBackOrder)
  }

  // hide the constructor, create instances only through factory methods
  private constructor(
    name: string,
    isInStock: boolean,
    quantity: number,
    isInBackOrder: boolean
  ) {
    this.isInBackOrder = isInBackOrder
    this.isInStock = isInStock
    this.name = name
    this.quantity = quantity
  }

  reorder(): void {
    if (this.isInStock && this.quantity !== 0) {
      throw new Error('We were not out of stock!')
    }

    this.isInBackOrder = true
    // oops! forgot to switch `isInStock` to `false`
  }

  restock(quantity: number): void {
    this.quantity += quantity
    // oops! forgot to check and / or switch `isInStock` and / or `isInBackOrder`
  }

  sell(quantity: number): void {
    if (quantity > this.quantity) {
      throw new Error('Cannot sell more than you have!')
    }

    this.quantity -= quantity

    if (quantity === 0) {
      this.isInStock = false
    }
  }
}

// -- better way

interface StatusProto {
  get isInStock(): boolean
}

type Status =
  | Case<'inStock', { quantity: number }>
  | Case<'outOfStock', { isInBackOrder: boolean }>

const Status = makeEnum<Status>({
  makeProto: () => ({
    get isInStock() {
      switch (this.case) {
        case 'inStock': return true
        case 'outOfStock': return false
      }
    }
  }),
})

class Product {
  name: string
  status: Status

  get isInStock(): boolean {
    return this.status.isInStock
  }

  static inStock(name: string, quantity: number): Product {
    return new Product(name, Status.inStock({ quantity }))
  }

  static outOfStock(name: string, isInBackOrder: boolean): Product {
    return new Product(name, Status.outOfStock({ isInBackOrder }))
  }

  // no need to hide constructor, even if we provide convenience factory methods
  constructor(name: string, status: Status) {
    this.name = name
    this.status = status
  }

  reorder(): void {
    if (this.status.case === 'inStock' && this.status.quantity > 0) {
      throw new Error('We were not out of stock!')
    }

    this.status = Status.outOfStock({ isInBackOrder: true })
    // impossible to forget to switch status!
  }

  restock(quantity: number): void {
    const baseQuantity = this.status.case === 'inStock'
      ? this.status.quantity
      : 0

    this.status = Status.inStock({ quantity: baseQuantity + quantity })

    // impossible to forget to check `isInStock` or `isInBackOrder`!
  }

  restock_variant(quantity: number): void {
    let status: Status

    switch (this.status.case) {
      case 'inStock':
        status = Status.inStock({ quantity: this.status.quantity + quantity })
        break
      case 'outOfStock':
        status = Status.inStock({ quantity })
        break
    }

    this.status = status

    // impossible to forget to check `isInStock` or `isInBackOrder`!
  }

  sell(quantity: number): void {
    // this method might be a bit more verbose than before, but its intent is clearer. Given the fact that we were forced to check `this.status`'s case, we were also able to throw a better error if we were out of stock
    
    switch (this.status.case) {
      case 'inStock':
        const newQuantity = this.status.quantity - quantity

        if (newQuantity < 0) {
          throw new Error('Cannot sell more than you have!')
        }

        if (newQuantity === 0) {
          this.status = Status.outOfStock({ isInBackOrder: false })
        } else {
          this.status = Status.inStock({ quantity: newQuantity })
        }

        break
      case 'outOfStock':
        throw new Error('Cannot sell out-of-stock Product!')
    }
  }
}
```

## Example #2 - UI framework View Model

[☝️ Back to TOC](#table-of-contents)

```typescript
// -- suboptimal way

class ItemDetailViewModel {
  public isShowingDeleteAlert: boolean = false
  public isShowingEditModal: boolean = false
  public scratchItemForEditing: Item | null = null

  constructor(public item: Item) { }

  cancelItemDeletionButtonClicked(): void {
    this.isShowingDeleteAlert = false
    // we don't need to reset the "edit" states, right?
  }

  cancelItemEditingButtonClicked(): void {
    this.isShowingEditModal = false
    this.scratchItemForEditing = null
    // we don't need to reset the "delete" state, right?
  }

  confirmItemDeletionButtonClicked(): void { ... }
  
  confirmItemEditingButtonClicked(): void {
    this.item = this.scratchItemForEditing // are we sure this is not `null`?
    this.isShowingEditModal = false
    this.scratchItemForEditing = null
    // we don't need to reset the "delete" state, right?
  }

  deleteItemButtonClicked(): void {
    // remember to manually clear all invalid states
    this.isShowingDeleteAlert = true
    this.isShowingEditModal = false
    this.scratchItemForEditing = null
  }

  editItemButtonClicked(): void {
    // remember to manually clear all invalid states
    this.isShowingDeleteAlert = false
    this.isShowingEditModal = true
    this.scratchItemForEditing = deep_copy(this.item)
  }

  // this is tedious and prone to error, but is manageable. But what if we add other "navigation" statuses? We must manually audit all code and fix every method...
}

// -- better way

type Presentation =
  | Case<'deleteAlert'>
  | Case<'editModal', { scratchItem: Item }>

const Presentation = makeEnum<Presentation>()

class ItemDetailViewModel {
  public presentation: Presentation | null = null

  constructor(public item: Item) { }

  cancelItemDeletionButtonClicked(): void {
    this.presentation = null
  }

  cancelItemEditingButtonClicked(): void {
    this.presentation = null
  }

  confirmItemDeletionButtonClicked(): void { ... }
  
  confirmItemEditingButtonClicked(): void {
    if (this.presentation.case === 'editModal') {
      this.item = this.scratchItemForEditing
    } else {
      console.warn('Item editing confirmed while not in editing mode...')
    }

    this.presentation = null
  }

  deleteItemButtonClicked(): void {
    this.presentation = Presentation.deleteAlert()
  }

  editItemButtonClicked(): void {
    this.presentation = Presentation.editModal({
      scratchItemForEditing: deep_copy(this.item),
    })
  }
}
```

## Example #3 - Loading data

[☝️ Back to TOC](#table-of-contents)

```typescript
// -- suboptimal way

class DataLoader<Item> {
  private loadPromise: Promise<item[]> | null = null

  // how many invalid states can these variables represent?
  // error + items?
  // error + items + isLoading = true?
  // error + items + isSuccess = null?
  // isLoading = true + isSuccess != null?
  // no error + empty items + isSuccess = true? missing error or empty result?
  // etc...
  error: any
  items: Item[] = []
  isLoading: boolean = false
  isSuccess: boolean | null = null

  constructor(public url: string) { }

  async performLoad(): Promise<Item[]> {
    if (!this.isLoading) {      
      this.isLoading = true

      this.loadPromise = new Promise((resolve, reject) => {
          // load data from `this.url`

        if (there_was_error) {
          this.error = load_error
          this.isLoading = false
          this.isSuccess = false
          reject(load_error)
        } else {
          this.items = loaded_items
          this.isLoading = false
          this.isSuccess = true
          resolve(loaded_items)
        }
      })
    }

    return this.loadPromise
  }
}

// -- better way

type DataLoadingStatus<Item> =
  | Case<'idle'>
  | Case<'loading', Promise<Item[]>>
  | Case<'loaded', Item[]>
  | Case<'error', { error: any }>

interface DataLoadingStatusHKT extends HKT {
  readonly type: DataLoadingStatus<this['_A']>
}

const DataLoadingStatus = makeEnum1<DataLoadingStatusHKT>()

class DataLoader<Item> {
  loadStatus: DataLoadingStatus<Item> = DataLoadingStatus.idle()

  constructor(public url: string) { }

  async performLoad(): Promise<Item[]> {
    switch (this.loadStatus.case) {
      case 'idle':
        const loadPromise = new Promise((resolve, reject) => {
          // load data from `this.url`

          if (there_was_error) {
            this.loadStatus = DataLoadingStatus.error({ error: load_error })
          } else {
            this.loadStatus = DataLoadingStatus.loaded(loaded_items)
          }
        })

        this.loadStatus = DataLoadingStatus.loading(loadPromise)
        return loadPromise

      case 'loading':
        return this.loadStatus.p
      
      case 'loaded':
        return Promise.resolve(this.loadStatus.p)

      case 'error':
        return Promise.reject(this.loadStatus.p.error)
    }
  }
}
```
