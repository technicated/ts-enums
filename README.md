# ts-enums

Sum types for TypeScript!

Have you ever wanted to be able to write something like this in TypeScript?

```typescript
// `enum` keyword is already taken
variant Maybe<T> {
  case none
  case some(T)

  static fromValue<T>(value: T): Maybe<NonNullable<T>> {
    return ((value !== null) && (value !== undefined))
      ? Maybe.some(value) // create an instance of `some` passing its argument(s)
      : Maybe.none // create an instance of none by simply using its name
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    switch (this) {
      case none: return Maybe.none // nothing to do here
      case some(value): return Maybe.some(transform(value)) // bind `value` to what's inside this `this`, and value will be of type `T`
    }
    // no warnings / errors down there from the compiler because the `switch` is exhaustive
  }
```

Well, unfortunately this is not possibile today... Maybe this can be introduced in TypeScript and compiled down to something in JavaScript, or it could be proposed as a Ecma feature, but surely it won't land in a couple of days!

This library tries to fill this gap, by introducing helper types and functions alongside a set of conventions to effectively use them.

Let's start!

# Enum basics

You can declare an enum by using a typealias (**_convention #1_**) and listing all its cases using the `Case` helper type:

```typescript
type Color =
 | Case<'red'>
 | Case<'green'>
 | Case<'blue'>
```

`Case` is generic over the case name, and takes it as its first argument.

This is the type definition, now you need to create the actual, real value that holds all the cases. For this, you use the `makeEnum` helper function and assign its result to a `const` named the same way as the type (**_convention #2_**).

```typescript
type Color =
 | Case<'red'>
 | Case<'green'>
 | Case<'blue'>

const Color = makeEnum<Color>()
```

The `makeEnum` is generic, and you **must** pass the typealias definition as its first parameter so TypeScript can be able to offer autocompletion for you on `const Color` members.

This is all it takes to create a simple enum! You can now create instances of it by using the case names as constructors:

```typescript
const r = Color.red() // .red is autocompleted, and r is of type `Color`
const g = Color.green() // .green is autocompleted, and g is of type `Color`
const b = Color.blue() // .blue is autocompleted, and b is of type `Color`
```

You can check the case of the enum value by inspecting its `case` property. You can do this whenever a boolean expression is required, and the type if the enum value will be even narrowed to the specific case in the subsequent scope:

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

However, you get the best behavior when you use a switch statement:

```typescript
function makeColor() { ... }

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

Even better, if you add new cases to you enum the compiler will tell you that `n` is now uninitialized in some code paths and that `isFavoriteColor` does not return a value so you must either add `undefined` to the return type or handle all cases.

# Adding a payload

You add a payload to your enum by passing a second parameter to the `Case` type:

```typescript
type Example =
  | Case<'none'> // will not carry a payload
  | Case<'primitive', number>
  | Case<'tuple', [string, boolean]>
  | Case<'object', Person>
  | Case<'array', Person[]>
```

You can access the payload on an instance of your enum using the `p` property. However, doing so outside of an `if` / `switch` / etc will return a value whose type is the union of the types of all the payloads, since TypeScript cannot knonw which case your value is.

```typescript
function makeExample() { ... }

const e = makeExample()
const payload = e.p
// `payload` is of type `unique symbol` | `number` | `[string, boolean]` | `Person` | `Person[]`
// What's about `unique symbol` you say? More on that later...

switch (e.case) {
  case 'none':
    // nothing to unpack here
    console.log('is empty')
    break
  case 'primitive':
    // `e.p` is of type `number`
    console.log('squared number is', e.p * e.p)
    break
  case 'tuple':
    // `e.p` is of type `[string, boolean]`
    console.log('tuple values are', e.p[0], e.p[1])
    break
  case 'object':
    // `e.p` is of type `Person`
    console.log('person name is', e.p.name)
    break
  case 'array':
    // `e.p` is of type `Person[]`
    console.log('persons names are', e.p.map(({ name }) => name).joined(', '))
    break
}
```