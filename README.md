<h1 align="center">ts-enums</h1>

<p align="center">Sum types for TypeScript!</p>

<p align="center">
  <img src="https://img.shields.io/npm/dm/@technicated/ts-enums.svg" alt="downloads" height="18">
  <img src="https://img.shields.io/badge/compatibility-TypeScript 4.0%2B-blue" alt="compatibility" height="18">
  <img src="https://img.shields.io/npm/l/%40technicated%2Fts-enums" alt="MIT license" height="18">
</p>

<br>

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

# Installation

```shell
npm install @technicated/ts-enums
```

# Compatibility

Although it is built using `typescript: ^4.8`, the library should be compatible with any version of TypeScript from 4.0 upwards.

The specific TypeScript development version is required solely for testing. In particular, some tests rely on the enhancements made to the `NonNullable` helper type, as explained in more detail in the [official TypeScript 4.8 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-4-8/#improved-intersection-reduction-union-compatibility-and-narrowing).

# Table of contents

Main topics

* [Enum basics](#enum-basics)
* [Adding a payload](#adding-a-payload)
* [Adding a prototype](#adding-a-prototype)
  * [Getters and setters](#prototype-getters-and-setters)
* [Adding static methods](#adding-static-methods)
* [Using generics](#using-generics)
* [Plain Old JavaScript Objects](#plain-old-javascript-objects)

Utilities

* [Cast](#cast)
* [cases](#cases)
* [CasesOf](#casesof)
* [Choice](#choice)
* [CasePath](#casepath)

Extras

* [Conventions recap](#conventions-recap)
* [Known issues](#known-issues)
* [But why do I need enums?](#but-why-do-i-need-enums)
  * [Example #1 - Product item](#example-1---product-item)
  * [Example #2 - UI framework View Model](#example-2---ui-framework-view-model)
  * [Example #3 - Loading data](#example-3---loading-data)
* [ts-pattern library](#ts-pattern-library)

# Main topics

## Enum basics

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

You can check the case of the enum value by inspecting its `case` property. You can do this whenever a boolean expression is required, and the type of the enum value will even be narrowed to the specific case in the subsequent scope (this is more useful when you have a [payload](#adding-a-payload)):

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

  // no need for a `return` either! TypeScript will know that the function will
  // return from one of the `switch` cases
}
```

Even better, if you add new cases to you enum the compiler will tell you that `n` is now uninitialized in some code paths and that `isFavoriteColor` does not return a value so you must either add `undefined` to the return type or handle all the missing cases.

## Adding a payload

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

The payload can be any type you want, with no restrictions, and you can access it on an instance of your enum using the `p` property. However, doing this outside of an `if` / `switch` / conditional will return a value whose type is _the union of the types of all the payloads_, since TypeScript cannot know the exact case of the enum instance.

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
    console.log('people names are', wp.p.map(({ name }) => name).join(', '))
    break
}
```

One last note: a payload-less enum is not actually "empty"! It does, in fact, contain a payload of value `unit`, which is a `Symbol` representing the absence of an actual, explicit payload. This is where the `unique symbol` from earlier came from! This `unit` is a constant value and doesn't add any extra information to the enum case, so it's like it doesn't exist.

`unit` and its type `Unit` are an implementation detail of the library and are mostly transparent to clients, but it's useful to know that the library has this little secret. The reason for its existence is to make the types of the library easier to define and deal with, in particular when creating conditional types it was easier to check for a `Unit` payload than to check if the `p` property existed or not.

## Adding a prototype

[☝️ Back to TOC](#table-of-contents)

You might want to add methods to your enum, like you do on objects. To do this, you perform two steps: first, you declare a class to define the prototype, calling this class `<MyEnumName>Proto` (**_convention #3_**), then you use the class (as a type) to augment the base definition of your Enum and pass the class reference to first parameter of the `makeEnum` helper function:

```typescript
class AnimalProto {
  // Why the need for `this: Animal`? This is explained later
  makeNoise(this: Animal): void {
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
  }
}

// use the class as a type to augment the basic enum shape
//            vvvvvvvvvvv
type Animal = AnimalProto & (
  | Case<'dog'>
  | Case<'cat'>
  | Case<'duck'>
)

const Animal = makeEnum<Animal>({
  proto: AnimalProto, // pass the class to `makeEnum`
})

Animal.dog().makeNoise() // bark!
Animal.cat().makeNoise() // meow!
Animal.duck().makeNoise() // quack!
```

It is important to note that you need to specify the `this` type of every method of the prototype class as `this: <MyEnumName>`. This is because the library will create an instance of the prototype class and set it as, well, the prototype for every instance of the enum that you create, so `this` will always be bound to that instance.

Doing this for every method can be a minor annoyance, but one that overall makes the library easier to use, addressing old issues like the need to use the function `makeProto` to create the prototype object (that was also separated from the type) and the recursive definition issue, which happened when you had a method return a value of your enum type and required the library to pass a copy of the enum constructors to the `makeProto` function.

### Prototype: getters and setters

[☝️ Back to TOC](#table-of-contents)

Unfortunately, at the moment TypeScript does not allow programmers to specify the type of `this` in getters and setters, so the suggestion is to always use methods when defining the prototype class.

However, the library provides a workaround for these times when using a getter / setter is more ergonomic or actually required: the `thisHelper` function can be used to force the type of `this` inside getters and setters.

```typescript
class ContainerProto {
  get area(): number {
    const self = thisHelper<Container>(this)

    switch (self.case) {
      case 'circle':
        return 3.14 * self.p.radius * self.p.radius
      case 'rectangle':
        return self.p.side1 * self.p.side2
      case 'square':
        return self.p.side * self.p.side
    }
  }
}

type Container = ContainerProto & (
  | Case<'circle', { radius: number }>
  | Case<'rectangle', { side1: number; side2: number }>
  | Case<'square', { side: number }>
)

const Container = makeEnum<Container>({ proto: ContainerProto })

Container.circle({ radius: 10 }).area
// output: 314
Container.rectangle({ side1: 10, side2: 20 }).area
// output: 200
Container.square({ side: 10 }).area
// output: 100
```

Please note that in the future TypeScript may allow `this` to be specified in getters and setters, rendering this trick useless.

## Adding static methods

[☝️ Back to TOC](#table-of-contents)

When you need to add static methods or properties to your enum, you also need to perform two steps, similar to how you add a prototype. First step: declare an interface with name `<MyEnumName>Type` (**_convention #4_**) containing all the desired methods / properties; step two: pass this interface as the second generic parameter to `makeEnum` and implement it using the first parameter of the function:

```typescript
type Color =
  | Case<'red'>
  | Case<'green'>
  | Case<'blue'>

class ColorType {
  random(): Color {
    if (random() > 0.3) {
      return Color.red() // we prefer red!
    }

    return random() < 0.5 ? Color.green() : Color.blue()
  }
}

const Color = makeEnum<Color, ColorType>({ type: ColorType })

Color.random()
// one of Color.red(), Color.green(), Color.blue()
```

Defining the type works in the same way as [defining the prototype](#adding-a-prototype): use a function to declare it and receive a copy of the enum you are building as a parameter of the `makeType` function. As per **_convention #4_** call this symbol with the same name of the enum.

## Using generics

[☝️ Back to TOC](#table-of-contents)

The most powerful abstractions come from generics, and luckily TypeScript has support for them! However, to correctly integrate generics with `ts-enums`, you need to do an extra step to help the compiler digest and "pass down" the information about the generic types.

All the following examples will use a generic enum with a single generic parameter, but this library supports up to six of them (although I hope nobody will ever need to utilize them 😅).

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

By the way, this `HTK` stuff is only a three-liner, so I hope is not a deal breaker for adopting this library! Just faithfully define your extension of `HTK<n>` as in the following snippet and enjoy:

```typescript
// example using `HKT3`, which has three generic parameters available for your enum type
interface MyEnumHKT extends HKT3 {
  readonly type MyEnum<this['_A'], this['_B'], this['_C']>
}
```

Now, let's finish by implementing the prototype and a static member for our generic enum - as you will see, the process remains identical to the non-generic case:

```typescript
class MaybeProto<T> {
  map<U>(this: Maybe<T>, transform: (value: T) => U): Maybe<U> {
    switch (this.case) {
      case 'none':
        return Maybe.none()
      case 'some':
        return Maybe.some(transform(this.p))
    }
  }
}

type Maybe<T> = MaybeProto<T> & (
  | Case<'none'>
  | Case<'some', T>
)

interface MaybeHKT extends HKT {
  readonly type: Maybe<this['_A']>
}

class MaybeType {
  fromValue<T>(value: T): Maybe<NonNullable<T>> {
    return value !== null && value !== undefined
      ? Maybe.some(value)
      : Maybe.none()
  }
}

const Maybe = makeEnum1<MaybeHKT, MaybeType>({
  proto: MaybeProto,
  type: MaybeType,
})
```

## Plain Old JavaScript Objects

[☝️ Back to TOC](#table-of-contents)

Sometimes, you just need to create an object with a specific shape, without creating a class. You can use the tools of this library for this use case, too, and in different "flavours".

**Option #1:** Declare a basic enum with no prototype or static methods (`type` + `const`), and use it in your POJO. Create instances using the case constructors.

```typescript
type UserStatus =
  | Case<'active', { verificationDate: Date }>
  | Case<'blocked', { asOfDate: Date }>
  | Case<'notVerified'>

const UserStatus = makeEnum<UserStatus>()

interface User {
  email: string
  status: UserStatus
}

function registerUser(email: string): User {
  return { email, status: UserStatus.notVerified() }
}

function verifyUser(user: User): User {
  return {
    ...user,
    status: UserStatus.active({ verificationDate: new Date() })
  }
}

function blockUser(user: User): User {
  return {
    ...user,
    status: UserStatus.blocked({ asOfDate: new Date() })
  }
}
```

**Option #2:** Declare a basic enum with no prototype or static methods (only `type`, no `const`), and use it in your POJO. Create instances by using a literal. This is not an ideal choice since you must directly deal with `unit`.

```typescript
type UserStatus =
  | Case<'active', { verificationDate: Date }>
  | Case<'blocked', { asOfDate: Date }>
  | Case<'notVerified'>

interface User {
  email: string
  status: UserStatus
}

function registerUser(email: string): User {
  return {
    email,
    status: { case: 'notVerified', p: unit }, // if you create instances manually, you must manually pass `unit`
  }
}

function verifyUser(user: User): User {
  return {
    ...user,
    status: { case: 'active', p: { verificationDate: new Date() } }
  }
}

function blockUser(user: User): User {
  return {
    ...user,
    status: { case: 'blocked', p: { asOfDate: new Date() } }
  }
}
```

**Option #3:** Declare a basic enum inline with your type definition and create instances by using a literal. This is _still_ not an ideal choice since you must directly deal with `unit`.

```typescript
interface User {
  email: string
  status:
    | Case<'active', { verificationDate: Date }>
    | Case<'blocked', { asOfDate: Date }>
    | Case<'notVerified'>
}

function registerUser(email: string): User {
  return {
    email,
    status: { case: 'notVerified', p: unit }, // if you create instances manually, you must manually pass `unit`
  }
}

function verifyUser(user: User): User {
  return {
    ...user,
    status: { case: 'active', p: { verificationDate: new Date() } }
  }
}

function blockUser(user: User): User {
  return {
    ...user,
    status: { case: 'blocked', p: { asOfDate: new Date() } }
  }
}
```

**Option #4:** Declare a basic enum inline with your type definition by using the helper type `Choice` instead of `Case` and create instances by using a literal. This allows you to emit `unit` for payload-less enums.

```typescript
interface User {
  email: string
  status:
    | Choice<'active', { verificationDate: Date }>
    | Choice<'blocked', { asOfDate: Date }>
    | Choice<'notVerified'>
}

function registerUser(email: string): User {
  return {
    email,
    status: { case: 'notVerified' }, // no need to deal with `unit`
  }
}

function verifyUser(user: User): User {
  return {
    ...user,
    status: { case: 'active', p: { verificationDate: new Date() } }
  }
}

function blockUser(user: User): User {
  return {
    ...user,
    status: { case: 'blocked', p: { asOfDate: new Date() } }
  }
}
```

# Utilities

## Cast

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

## cases

[☝️ Back to TOC](#table-of-contents)

The `cases` utility is a Symbol that you can use to access all the case names of an enum. It maps a case name onto itself, so it can be used to avoid hard-coding case names in some part of the code. This is useful so that when / if the name is refactored you get a compile-time error instead of a (potential) runtime error.

```typescript
type TabBarRoute =
  | Case<'firstTab'>
  | Case<'secondTab'>
  | Case<'thirdTab'>

const TabBarRoute = makeEnum<TabBarRoute>()

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

## CasesOf

[☝️ Back to TOC](#table-of-contents)

The `CasesOf` utility type allows you to get a union type containing the names of all the cases of an enum. This can be useful to constrain the input or output types of your functions to only refer a specific enum cases.

It's worth noting that you could achieve the same result by indexing your enum type with the `'case'` key. However, this approach becomes cumbersome with generic enums, as you must specify all the generic types even if they are not needed for this operation. This might not be a big deal, but the code will still read pretty strange.

```typescript
type Result<Success, Failure> =
  | Case<'success', Success>
  | Case<'failure', Failure>

interface ResultHKT extends HKT2 {
  readonly type: Result<this['_A'], this['_B']>
}

const Result = makeEnum2<ResultHKT>()

function matchesCase(
  r: Result<unknown, unknown>,
  c: CasesOf<typeof Result>
  // compare to:
  // c: Result<any, any>['case']
  // c: Result<unknown, unknown>['case']
  // c: Result<number, User>['case']
): boolean {
  return r.case === c
}

const flag = matchesCase(result, 'success')
// `flag` is `boolean`

const err = matchesCase(result, 'wrong')
// Argument of type '"wrong"' is not assignable to parameter of type
// '"success" | "failure"'.

function extract<
  R extends Result<unknown, unknown>,
  C extends CasesOf<typeof Result>
>(r: R, c: C): Cast<R, C>['p'] | undefined { ... }

const r: Result<number, string> = ...
const n = extract(r, 'success')
// `n` is `number`
const f = extract(r, 'failure')
// `f` is `string`
```

## Choice

[☝️ Back to TOC](#table-of-contents)

The `Choice` helper type works like `Case`, but does not assign a `Unit` payload to empty cases; instead, they remain empty. This can be useful when declaring POJOs, to avoid passing needless information around.

```typescript
type Color =
  | Case<'red'>
  | Case<'green'>
  | Case<'blue'>

const r: Color = { case: 'red', p: unit }
const g: Color = { case: 'green', p: unit }
const b: Color = { case: 'blue', p: unit }

type Color =
  | Choice<'red'>
  | Choice<'green'>
  | Choice<'blue'>

// no need for `unit`
const r: Color = { case: 'red' }
const g: Color = { case: 'green' }
const b: Color = { case: 'blue' }
```

## CasePath

[☝️ Back to TOC](#table-of-contents)

`CasePath`s are a way to navigate and modify enums in a type-safe manner, providing a structured approach to working with specific cases and their payloads.

```typescript
type Result<Success, Failure> =
  | Case<'success', Success>
  | Case<'failure', Failure>

interface ResultHKT extends HKT2 {
  readonly type: Result<this['_A'], this['_B']>
}

const Result = makeEnum2<ResultHKT>()
const successPath = Result<number, string>('success')
successPath.extract(Result.success(42))
// { value: 42 }
successPath.extract(Result.failure('bad'))
// undefined
```

Case Paths can be used to `extract` a payload from an enum, or to `embed` a value inside an enum case.

```typescript
const extractionResult = successPath.extract(enumInstance)
// { value: 42 }
const newEnumInstance = successPath.embed(extractionResult.value)
// { case: 'success', p: 42 }
```

The `extract` function returns a result of type `{ value: Payload } | undefined`, to allow developers to discriminate wether the extraction of the given `value` was successful or it failed. This is because in the exceptional case in which `Payload` were to be `undefined`, having a return value of `Payload | undefined` would be ambiguous.

In some cases you want to perform the two operations one after another, so there's another function `modify` to perform just that:

```typescript
const newEnumInstance = successPath.modify(enumInstance, (n) => n * n)
// { case: 'success', p: 1764 }
```

You can return the updated value from the update function, or you can modify the payload in place, for example to update only a property.

Case Paths can also be combined to work with nested enums:

```typescript
type Base =
  | Case<'value1', string>
  | Case<'value2', number>

const Base = makeEnum<Base>()

type Parent =
  | Case<'base', Base>
  | Case<'other', boolean>

const Parent = makeEnum<Parent>()

const casePath = Parent('base').appending(Base('value1'))

casePath.extract(Parent.base(Base.value1('hello')))
// { value: 'hello' }
```

Case Paths are closely related to **lenses**, a functional programming concept. Both Case Paths and lenses provide a way to focus on and modify parts of a larger structure. While lenses are a more general concept, Case Paths are specifically tailored for working with enums in this library.

Case Paths' main use is as tools inside a library, to allow developers to modularize their code by encapsulating the logic for working with specific cases of their enums.

For example:

```typescript
type ConfigurationOption =
  | Case<'networkSettings', { url: string; timeout: number }>
  | Case<'displaySettings', { theme: string; fontSize: number }>
  | Case<'loggingSettings', { logLevel: string; enableDebug: boolean }>

const ConfigurationOption = makeEnum<ConfigurationOption>()

class Configuration {
  constructor(public readonly options: ConfigurationOption[]) { }
  
  updateSettings<Value>(
    path: CasePath<ConfigurationOption, Value>,
    update: (original: Value) => Value
  ): void {
    for (let i = 0; i < this.options.length; i += 1) {
      const extracted = path.extract(this.options[i])
      
      if (extracted) {
        this.options[i] = path.embed(update(extracted.value))
        break
      }
    }
  }
}

const initialConfig = new Configuration([
  ConfigurationOption.networkSettings({
    url: 'https://example.com',
    timeout: 30000,
  }),
  ConfigurationOption.displaySettings({ theme: 'Light', fontSize: 16 }),
  ConfigurationOption.loggingSettings({
    logLevel: 'Info',
    enableDebug: false,
  }),
])

initialConfig.updateSettings(
  ConfigurationOption('networkSettings'),
  ({ url }) => ({ url, timeout: 20000 })
)

initialConfig.updateSettings(
  ConfigurationOption('loggingSettings'),
  ({ logLevel }) => ({ logLevel, enableDebug: true })
)

// `initialConfig` is
// options: [
//   {
//     case: 'networkSettings',
//     p: { url: 'https://example.com', timeout: 20000 },
//                                               ~~~~~
//                               difference here ^
//   },
//   {
//     case: 'displaySettings',
//     p: { theme: 'Light', fontSize: 16 },
//   },
//   {
//     case: 'loggingSettings',
//     p: { logLevel: 'Info', enableDebug: true },
//                                         ~~~~
//                         difference here ^
//   },
// ]
```


# Extras

## Conventions recap

[☝️ Back to TOC](#table-of-contents)

Here's a list of the conventions this library states for your convenience!

**_Convention #1_**: Declare your enum type using a _type alias_.

**_Convention #2_**: Assign the result of the `makeEnum` function to a `const` with the same name as the enum type.

**_Convention #3_**: When defining a prototype for your enum, name it `<EnumName>Proto`.

**_Convention #4_**: When defining a type to hold static methods for your enum, name it `<EnumName>Type`.

## Known issues

[☝️ Back to TOC](#table-of-contents)

At the moment there is one minor issue with the library.

Currently TypeScript does not allow developers to specify the type of  `this` inside getters and setters, so when defining accessors in your enum prototype you might face some issues. For now, until TypeScript adds this feature, the suggestion is to only use methods inside the enum prototype.

However, if you need or prefer to use getters or setters, you can use a little helper this library provides to force the type of `this`. See the section on [getters and setters](#prototype-getters-and-setters) for more information about this.

## But why do I need enums?

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

### Example #1 - Product item

[☝️ Back to TOC](#table-of-contents)

This example shows that modeling properties for different states all together requires you to define default "zero" values for them, and also requires careful management of data to avoid putting the object in an invalid state. The enum version does not have this problems and also allow you to be more specific in a particular case.

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

// ... you didn't even notice that the implementation of `static outOfStock()`
// has an error, did you? It passes `true` to the `isInStock` parameter!

// -- better way

class StatusProto {
  get isInStock(): boolean {
    switch (thisHelper<Status>(this).case) {
      case 'inStock':
        return true
      case 'outOfStock':
        return false
    }
  }
}

type Status = StatusProto & (
  | Case<'inStock', { quantity: number }>
  | Case<'outOfStock', { isInBackOrder: boolean }>
)

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
    if (this.status.case === 'inStock' && this.status.p.quantity > 0) {
      throw new Error('We were not out of stock!')
    }

    this.status = Status.outOfStock({ isInBackOrder: true })
    // impossible to forget to switch status!
  }

  restock(quantity: number): void {
    const baseQuantity = this.status.case === 'inStock'
      ? this.status.p.quantity
      : 0

    this.status = Status.inStock({ quantity: baseQuantity + quantity })

    // impossible to forget to check `isInStock` or `isInBackOrder`!
  }

  restock_variant(quantity: number): void {
    let status: Status

    switch (this.status.case) {
      case 'inStock':
        status = Status.inStock({ quantity: this.status.p.quantity + quantity })
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
      case 'inStock': {
        const newQuantity = this.status.p.quantity - quantity

        if (newQuantity < 0) {
          throw new Error('Cannot sell more than you have!')
        }

        if (newQuantity === 0) {
          this.status = Status.outOfStock({ isInBackOrder: false })
        } else {
          this.status = Status.inStock({ quantity: newQuantity })
        }

        break
      }

      case 'outOfStock':
        throw new Error('Cannot sell out-of-stock Product!')
    }
  }
}
```

### Example #2 - UI framework View Model

[☝️ Back to TOC](#table-of-contents)

This example illustrates that representing individual UI states using a set of separate boolean properties necessitates careful management and results in an explosion of invalid states. This is due to the fact that only one UI element can be presented at any given moment.

Since only a single property should be set to `true` at a given time, having e.g. four flags representing four distinct UI elements will result in a staggering 11 invalid states out of the 16 different combinations possible!

The enum version eliminates at design time the possibility of having invalid states, and also simplify the management of the presentation state.

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
    // are we really sure this is not `null`?
    this.item = this.scratchItemForEditing!
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
    if (this.presentation?.case === 'editModal') {
      this.item = this.presentation.p.scratchItem
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
      scratchItem: deep_copy(this.item),
    })
  }
}
```

### Example #3 - Loading data

[☝️ Back to TOC](#table-of-contents)

This example demonstrates how you can create a straightforward design for a complex task with varying outcomes using an enum. In contrast, the pure-product version has evident issues in accurately representing all possible states, making it more challenging to correctly write and comprehend.

```typescript
// -- suboptimal way

class DataLoader<Item> {
  private loadPromise: Promise<Item[]> | null = null

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

    // can make non-null assertion here, it's valid but unfortunate
    return this.loadPromise!
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
      case 'idle': {
        const loadPromise = new Promise<Item[]>((resolve, reject) => {
          // load data from `this.url`

          if (there_was_error) {
            this.loadStatus = DataLoadingStatus.error({ error: load_error })
            reject(load_error)
          } else {
            this.loadStatus = DataLoadingStatus.loaded(loaded_items)
            resolve(loaded_items)
          }
        })

        this.loadStatus = DataLoadingStatus.loading(loadPromise)
        return loadPromise
      }

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

## ts-pattern library

[☝️ Back to TOC](#table-of-contents)

This library goes very well with the [ts-pattern](https://github.com/gvergnaud/ts-pattern) library! I encourage you to explore it for yourself and see if it fits your needs.

The **ts-pattern** library empowers TypeScript developers with the expressive power of pattern matching, allowing you to create concise and readable code by expressing complex conditions in a single expression. With exhaustive checking, you can be confident that no possible case is overlooked!

Here's a (complex) example in which we define a nested enum and then destructure it in various flavors using the ts-pattern library! It's a redux-inspired reducer example, with an app that defines a list of counters that can be incremented or decremented, plus a button to request a fun fact about the current number.

```typescript
// Result type 

type Result<Success, Failure> =
  | Case<'success', Success>
  | Case<'failure', Failure>

interface ResultHKT extends HKT2 {
  readonly type: Result<this['_A'], this['_B']>
}

const Result = makeEnum2<ResultHKT>()

// Counter Feature

interface CounterState {
  counter: number
  numberFact: string | null
}

type CounterAction =
  | Case<'decrementButtonClicked'>
  | Case<'incrementButtonClicked'>
  | Case<'numberFactButtonClicked'>
  | Case<'numberFactResponse', Result<string, unknown>>

const CounterAction = makeEnum<CounterAction>()

const counterReducer = (
  state: CounterState,
  action: CounterAction
): CounterState => {
  return match(action)
    .with({ case: 'decrementButtonClicked' }, () => ({
      ...state,
      counter: state.counter - 1,
      numberFact: null,
    }))
    .with({ case: 'incrementButtonClicked' }, () => ({
      ...state,
      counter: state.counter + 1,
      numberFact: null,
    }))
    .with({ case: 'numberFactButtonClicked' }, () => ({
      /* let's ignore how to do an API request */
      ...state,
      numberFact: null,
    }))
    .with(
      { case: 'numberFactResponse', p: { case: 'success' } },
      ({ p: { p: numberFact } }) => ({ ...state, numberFact })
    )
    .with({ case: 'numberFactResponse', p: { case: 'failure' } }, () => ({
      /* let's ignore errors, but please don't do it in a production app! */
      ...state,
      numberFact: null,
    }))
    .exhaustive()
}

// App Feature

interface AppState {
  counters: CounterState[]
}

type AppAction =
  | Case<'addCounterButtonClicked'>
  | Case<'counterAction', { index: number; childAction: CounterAction }>
  | Case<'resetCounterStateButtonClicked', { index: number }>

const AppAction = makeEnum<AppAction>()

const appReducer = (
  state: AppState,
  action: AppAction
): AppState => {
  return match(action)
    .with({ case: 'addCounterButtonClicked' }, () => ({
      ...state,
      counters: [...state.counters, { counter: 0, numberFact: null }],
    }))
    .with({ case: 'counterAction' }, ({ p: { index, childAction } }) => ({
      ...state,
      counters: state.counters.map((c, i) =>
        i === index ? counterReducer(c, childAction) : c
      ),
    }))
    .with({ case: 'resetCounterStateButtonClicked' }, ({ p: { index } }) => ({
      ...state,
      counters: state.counters.map((c, i) =>
        i === index ? { counter: 0, numberFact: null } : c
      ),
    }))
    .exhaustive()
}

// testing the logic

let state: AppState = { counters: [] }

// first, create two counters
state = appReducer(state, AppAction.addCounterButtonClicked())
state = appReducer(state, AppAction.addCounterButtonClicked())

t.deepEqual(state, {
  counters: [
    { counter: 0, numberFact: null },
    { counter: 0, numberFact: null },
  ],
})

// then, increment the first reducer one time and the second two times

state = appReducer(
  state,
  AppAction.counterAction({
    index: 0,
    childAction: CounterAction.incrementButtonClicked(),
  })
)

state = appReducer(
  state,
  AppAction.counterAction({
    index: 1,
    childAction: CounterAction.incrementButtonClicked(),
  })
)

state = appReducer(
  state,
  AppAction.counterAction({
    index: 1,
    childAction: CounterAction.incrementButtonClicked(),
  })
)

t.deepEqual(state, {
  counters: [
    { counter: 1, numberFact: null },
    { counter: 2, numberFact: null },
  ],
})

// request a number fact

state = appReducer(
  state,
  AppAction.counterAction({
    index: 1,
    childAction: CounterAction.numberFactButtonClicked(),
  })
)

state = appReducer(
  state,
  AppAction.counterAction({
    index: 1,
    childAction: CounterAction.numberFactResponse(
      Result.success('2 is the only even prime')
    ),
  })
)

t.deepEqual(state, {
  counters: [
    { counter: 1, numberFact: null },
    { counter: 2, numberFact: '2 is the only even prime' },
  ],
})

state = appReducer(
  state,
  AppAction.resetCounterStateButtonClicked({ index: 1 })
)

t.deepEqual(state, {
  counters: [
    { counter: 1, numberFact: null },
    { counter: 0, numberFact: null },
  ],
})
```

# Acknowledgments

I'd like to express my gratitude to the guys at [Point-Free](https://www.pointfree.co)! Their primary focus is the Swift programming language, but the core concepts behind what they explain are not specific to Swift itself and are applicable to every other programming language. They have series on functional programming concepts, Parsing, controllable Randomness, and much much more!

Without their invaluable lessons, I can say without a shadow of doubt that this library would not exist; in particular, this work takes inspiration on their [Series on Algebraic Data Types](https://www.pointfree.co/collections/algebraic-data-types).

I really think that I have become a better software developer thanks to their teachings and work, so the least I can do is spread the word and contribute myself to the open source community!
