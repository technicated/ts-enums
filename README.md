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

This library tries to fill this gap, by introducing helper types and functions alongside a set of **_conventions_** to effectively use them.

Let's start!

# Enum basics

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

You add a payload to your enum by passing a second parameter to the `Case` type:

```typescript
type WithPayload =
  | Case<'none'> // will not carry a payload
  | Case<'primitive', number>
  | Case<'tuple', [string, boolean]>
  | Case<'object', Person>
  | Case<'array', Person[]>
```

You can access the payload on an instance of your enum using the `p` property. However, doing this outside of an `if` / `switch` / whatever will return a value whose type is _the union of the types of all the payloads_, since TypeScript cannot know the exact case of the enum instance.

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

[todo] This is an implementation detail of the library and is mostly transparent to the clients, but it's useful to know that this little secret exists. The reason for this behavior is to make all the types easier to deal with i.e. when creating conditional types it was easier to check for a `Unit` payload than to check if the `p` property existed or not.

# Adding a prototype

You might want to add methods to your enum, like you do on your objects. To do this, you perform two steps: first, you declare an interface to shape your prototype, and you call this interface `<MyEnumName>Proto` (**_convention #3_**), then you add this interface to the main type declaration and implement it using the first parameter of the `makeEnum` helper function:

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

However, this brings an issue: if you need to define a method of the prototype using the enum type itself, you will get the TypeScript error `"'your enum type' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer"`.

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

Defining the type has not the same mini-issue of the [prototype declaration](#adding-a-prototype): you can directly refer to the enum type in the methods definition, so TypeScript can correctly reason about your types. This is true even for generic enums, since for static methods you are forced to specify the generic parameters (this is true even for "regular" classes).

# Introducing generics

The most powerful abstractions come from generics, and luckily TypeScript has them! However, to correctly integrate generics with `ts-enums`, you need to do an extra step to help the compiler digest and "pass down" the information about the generic types.

All the examples will use a generic enum with one generic parameter, but this library supports up to six of them.

Let's translate the original `Maybe` example from the invented `variant` syntax to this library's syntax. First the code, then the explanation - and for now we omit the prototype and the static methods.

```typescript
type Maybe<T> =
  | Case<'none'>
  | Case<'some', T>

interface MaybeHKT extends HKT {
  readonly type: Maybe<this['_A']>
}

const Maybe = makeEnum1<MaybeHKT>()
```

The main differences are the use of the helper function `makeEnum1` instead of `makeEnum`, (there are 7 of them, from `makeEnum` to `makeEnum6`) and the presence of the strange interface `MaybeHKT`.

We won't delve into the nitty-gritty higher-order functional-programming type-algebra details here, the important thing to understand for using this library is that this `HKT` helper and its higher-order versions keep the generic parameters of your enum abstract until you actually instantiate your enum, so that type inference and type completion work correctly. For more information, please refer to [my source for this concept](https://dev.to/effect-ts/encoding-of-hkts-in-typescript-5c3).

By the way, it's only a three-liner, and I hope is not a deal breaker for adopting this library!

Let's continue by implementing the prototype and a static member for our generic enum:

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