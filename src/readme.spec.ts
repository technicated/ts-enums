import test from 'ava'
import { match } from 'ts-pattern'
import { Case, cases, Cast, Choice } from './lib/case'
import { HKT, HKT2 } from './lib/hkt'
import { makeEnum } from './lib/make-enum-0/make-enum'
import { makeEnum1 } from './lib/make-enum-1/make-enum'
import { makeEnum2 } from './lib/make-enum-2/make-enum'
import { CasesOf } from './lib/make-enum-2/types'
import { unit } from './lib/unit'

const console = {
  logs: [] as string[],
  log(value: string): void {
    this.logs.push(value)
  },
  reset(): void {
    this.logs = []
  },
}

test('Enum basics', (t) => {
  type Color = Case<'red'> | Case<'green'> | Case<'blue'>

  const Color = makeEnum<Color>()

  const r = Color.red() // .red is autocompleted, and r is of type `Color`
  const g = Color.green() // .green is autocompleted, and g is of type `Color`
  const b = Color.blue() // .blue is autocompleted, and b is of type `Color`

  let wasRed1: boolean
  if (r.case === 'red') {
    wasRed1 = true
  } else {
    wasRed1 = false
  }

  let wasRed2: boolean
  if (g.case === 'red') {
    wasRed2 = true
  } else {
    wasRed2 = false
  }

  t.true(wasRed1)
  t.false(wasRed2)

  let n: number

  switch (b.case) {
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

  t.is(n, 2)

  function isFavoriteColor(c: Color): boolean {
    switch (c.case) {
      case 'red':
        return true
      case 'green':
        return false
      case 'blue':
        return false
      // no need for a `default` case!
    }

    // no need for a `return` either! TypeScript will know that the function will
    // return from one of the `switch` cases
  }

  t.true(isFavoriteColor(Color.red()))
})

test('Adding a payload', (t) => {
  interface Person {
    name: string
  }

  type WithPayload =
    | Case<'none'> // will not carry a payload
    | Case<'primitive', number>
    | Case<'tuple', [string, boolean]>
    | Case<'object', Person>
    | Case<'array', Person[]>

  const WithPayload = makeEnum<WithPayload>()

  function makeEnumWithPayload(): WithPayload {
    return WithPayload.array([{ name: 'user1' }, { name: 'user2' }])
  }

  const wp = makeEnumWithPayload()
  const payload = wp.p
  // `payload` is of type `unique symbol` | `number` | `[string, boolean]` | `Person` | `Person[]`
  // What's about `unique symbol` you say? More on that later...

  t.truthy(payload)

  let log: string
  switch (wp.case) {
    case 'none':
      // nothing to unpack here
      log = 'is empty'
      break
    case 'primitive':
      // `wp.p` is of type `number`
      log = `squared number is: ${wp.p * wp.p}`
      break
    case 'tuple':
      // `wp.p` is of type `[string, boolean]`
      log = `tuple values are: ${(wp.p[0], wp.p[1])}`
      break
    case 'object':
      // `wp.p` is of type `Person`
      log = `person name is: ${wp.p.name}`
      break
    case 'array':
      // `wp.p` is of type `Person[]`
      log = `people names are: ${wp.p.map(({ name }) => name).join(', ')}`
      break
  }
  t.is(log, 'people names are: user1, user2')
})

test('Adding a prototype, 1', (t) => {
  console.reset()

  interface AnimalProto {
    makeNoise(): void
  }

  type Animal = AnimalProto & (Case<'dog'> | Case<'cat'> | Case<'duck'>)

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

  t.deepEqual(console.logs, ['bark!', 'meow!', 'quack!'])
})

test('Adding a prototype, 2', (t) => {
  interface AnimalProto {
    makeChild(): Animal
  }

  type Animal = AnimalProto & (Case<'dog'> | Case<'cat'> | Case<'duck'>)

  const Animal = makeEnum<Animal>({
    //          v here's the difference
    makeProto: (Animal) => ({
      makeChild() {
        // inside here, `Animal` now refers to the parameter of `makeProto` instead of the global `Animal` const
        switch (this.case) {
          case 'dog':
            return Animal.dog()
          case 'cat':
            return Animal.cat()
          case 'duck':
            return Animal.duck()
        }
      },
    }),
  })

  t.deepEqual(Animal.cat().makeChild(), Animal.cat())
  t.deepEqual(Animal.dog().makeChild(), Animal.dog())
  t.deepEqual(Animal.duck().makeChild(), Animal.duck())
})

test('Adding static methods', (t) => {
  const randomValues = [0.7, 0.1, 0.5]
  const random = () => randomValues.pop() ?? 0

  type Color = Case<'red'> | Case<'green'> | Case<'blue'>

  interface ColorType {
    random(): Color
  }

  const Color = makeEnum<Color, ColorType>({
    type: {
      random(): Color {
        if (random() > 0.3) {
          return Color.red() // we prefer red!
        }

        return random() < 0.5 ? Color.green() : Color.blue()
      },
    },
  })

  t.deepEqual(Color.random(), Color.red())
  t.deepEqual(Color.random(), Color.blue())
})

test('Using generics', (t) => {
  interface MaybeProto<T> {
    map<U>(transform: (value: T) => U): Maybe<U>
  }

  type Maybe<T> = MaybeProto<T> & (Case<'none'> | Case<'some', T>)

  interface MaybeHKT extends HKT {
    readonly type: Maybe<this['_A']>
  }

  interface MaybeType {
    fromValue<T>(value: T): Maybe<NonNullable<T>>
  }

  const Maybe = makeEnum1<MaybeHKT, MaybeType>({
    makeProto: (Maybe) => ({
      map(transform) {
        switch (this.case) {
          case 'none':
            return Maybe.none()
          case 'some':
            return Maybe.some(transform(this.p))
        }
      },
    }),
    type: {
      fromValue<T>(value: T): Maybe<NonNullable<T>> {
        return value !== null && value !== undefined
          ? Maybe.some(value)
          : Maybe.none()
      },
    },
  })

  t.deepEqual(Maybe.fromValue(42), Maybe.some(42))
  t.deepEqual(Maybe.fromValue(null), Maybe.none())
  t.deepEqual(Maybe.fromValue(undefined), Maybe.none())

  t.deepEqual(
    Maybe.some(['Hello', 'world']).map((arr) => `${arr.join(', ')}!`),
    Maybe.some('Hello, world!')
  )
})

test('Plain Old JavaScript Objects', (t) => {
  {
    type UserStatus =
      | Case<'active', { verificationDate: Date }>
      | Case<'blocked', { asOfDate: Date }>
      | Case<'notVerified'>

    const UserStatus = makeEnum<UserStatus>()

    interface User {
      email: string
      status: UserStatus
    }

    // eslint-disable-next-line no-inner-declarations
    function registerUser(email: string): User {
      return { email, status: UserStatus.notVerified() }
    }

    // eslint-disable-next-line no-inner-declarations
    function verifyUser(user: User): User {
      return {
        ...user,
        status: UserStatus.active({ verificationDate: new Date(1) }),
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function blockUser(user: User): User {
      return {
        ...user,
        status: UserStatus.blocked({ asOfDate: new Date(2) }),
      }
    }

    let user = registerUser('username@email.org')

    t.deepEqual(user, {
      email: 'username@email.org',
      status: UserStatus.notVerified(),
    })

    user = verifyUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: UserStatus.active({ verificationDate: new Date(1) }),
    })

    user = blockUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: UserStatus.blocked({ asOfDate: new Date(2) }),
    })
  }

  {
    type UserStatus =
      | Case<'active', { verificationDate: Date }>
      | Case<'blocked', { asOfDate: Date }>
      | Case<'notVerified'>

    interface User {
      email: string
      status: UserStatus
    }

    // eslint-disable-next-line no-inner-declarations
    function registerUser(email: string): User {
      return {
        email,
        status: { case: 'notVerified', p: unit }, // if you create instances manually, you must manually pass `unit`
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function verifyUser(user: User): User {
      return {
        ...user,
        status: { case: 'active', p: { verificationDate: new Date(1) } },
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function blockUser(user: User): User {
      return {
        ...user,
        status: { case: 'blocked', p: { asOfDate: new Date(2) } },
      }
    }

    let user = registerUser('username@email.org')

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'notVerified', p: unit },
    })

    user = verifyUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'active', p: { verificationDate: new Date(1) } },
    })

    user = blockUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'blocked', p: { asOfDate: new Date(2) } },
    })
  }

  {
    interface User {
      email: string
      status:
        | Case<'active', { verificationDate: Date }>
        | Case<'blocked', { asOfDate: Date }>
        | Case<'notVerified'>
    }

    // eslint-disable-next-line no-inner-declarations
    function registerUser(email: string): User {
      return {
        email,
        status: { case: 'notVerified', p: unit }, // if you create instances manually, you must manually pass `unit`
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function verifyUser(user: User): User {
      return {
        ...user,
        status: { case: 'active', p: { verificationDate: new Date(1) } },
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function blockUser(user: User): User {
      return {
        ...user,
        status: { case: 'blocked', p: { asOfDate: new Date(2) } },
      }
    }

    let user = registerUser('username@email.org')

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'notVerified', p: unit },
    })

    user = verifyUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'active', p: { verificationDate: new Date(1) } },
    })

    user = blockUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'blocked', p: { asOfDate: new Date(2) } },
    })
  }

  {
    interface User {
      email: string
      status:
        | Choice<'active', { verificationDate: Date }>
        | Choice<'blocked', { asOfDate: Date }>
        | Choice<'notVerified'>
    }

    // eslint-disable-next-line no-inner-declarations
    function registerUser(email: string): User {
      return {
        email,
        status: { case: 'notVerified' }, // no need to deal with `unit`
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function verifyUser(user: User): User {
      return {
        ...user,
        status: { case: 'active', p: { verificationDate: new Date(1) } },
      }
    }

    // eslint-disable-next-line no-inner-declarations
    function blockUser(user: User): User {
      return {
        ...user,
        status: { case: 'blocked', p: { asOfDate: new Date(2) } },
      }
    }

    let user = registerUser('username@email.org')

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'notVerified' },
    })

    user = verifyUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'active', p: { verificationDate: new Date(1) } },
    })

    user = blockUser(user)

    t.deepEqual(user, {
      email: 'username@email.org',
      status: { case: 'blocked', p: { asOfDate: new Date(2) } },
    })
  }
})

test('Utilities, Cast', (t) => {
  console.reset()

  type Hobby =
    | Case<'gardening', { hasGreenThumb: boolean }>
    | Case<'running', { milesPerDay: number }>
    | Case<'tv', { favoriteSeries: string }>

  const Hobby = makeEnum<Hobby>()

  function isHealthyHobby(h: Hobby): h is Cast<Hobby, 'running'> {
    return h.case === 'running'
  }

  const hobby = Hobby.running({ milesPerDay: 100 })

  if (isHealthyHobby(hobby)) {
    // inside this block, `hobby.case` is 'running' and `hobby.p` is
    // `{ milesPerDay: number}`
    console.log(`Miles run per day: ${hobby.p.milesPerDay}!`)
  }

  t.deepEqual(console.logs, ['Miles run per day: 100!'])
})

test('Utilities, cases', (t) => {
  type YourFavoriteFrameworkRoutes = Array<{
    path: string
    component: unknown
  }>

  const FirstTabView = 1
  const SecondTabView = 2
  const ThirdTabView = 3

  type TabBarRoute = Case<'firstTab'> | Case<'secondTab'> | Case<'thirdTab'>

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

  t.deepEqual(routes, [
    { path: 'firstTab', component: 1 },
    { path: 'secondTab', component: 2 },
    { path: 'thirdTab', component: 3 },
  ])
})

test('Utilities, CasesOf', (t) => {
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

  const result = Result.success(42)

  const flag = matchesCase(result, 'success')
  // `flag` is `boolean`

  // @ts-expect-error 'wrong' is not a case of `Result`
  const err = matchesCase(result, 'wrong')
  // Argument of type '"wrong"' is not assignable to parameter of type
  // '"success" | "failure"'.

  t.true(flag)
  t.false(err)

  function extract<
    R extends Result<unknown, unknown>,
    C extends CasesOf<typeof Result>
  >(r: R, c: C): Cast<R, C>['p'] | undefined {
    return r.case === c ? r.p : undefined
  }

  const r: Result<number, string> = Result.success(42)
  const n = extract(r, 'success')
  // `n` is `number`
  const f = extract(r, 'failure')
  // `f` is `string`

  t.is(n, 42)
  t.is(f, undefined)
})

test('Utilities, Choice', (t) => {
  {
    type Color = Case<'red'> | Case<'green'> | Case<'blue'>

    const r: Color = { case: 'red', p: unit }
    const g: Color = { case: 'green', p: unit }
    const b: Color = { case: 'blue', p: unit }

    t.truthy(r)
    t.truthy(g)
    t.truthy(b)
  }

  {
    type Color = Choice<'red'> | Choice<'green'> | Choice<'blue'>

    // no need for `unit`
    const r: Color = { case: 'red' }
    const g: Color = { case: 'green' }
    const b: Color = { case: 'blue' }

    // no need for `unit`
    t.truthy(r)
    t.truthy(g)
    t.truthy(b)
  }
})

test('But why do I need enums?', (t) => {
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
   */
  const dinners: Dinner[] = [
    { mainMealSize: 'small', dessert: 'apple pie' },
    { mainMealSize: 'small', dessert: 'brownie' },
    { mainMealSize: 'small', dessert: 'cheesecake' },
    { mainMealSize: 'regular', dessert: 'apple pie' },
    { mainMealSize: 'regular', dessert: 'brownie' },
    { mainMealSize: 'regular', dessert: 'cheesecake' },
    { mainMealSize: 'large', dessert: 'apple pie' },
    { mainMealSize: 'large', dessert: 'brownie' },
    { mainMealSize: 'large', dessert: 'cheesecake' },
    { mainMealSize: 'xl', dessert: 'apple pie' },
    { mainMealSize: 'xl', dessert: 'brownie' },
    { mainMealSize: 'xl', dessert: 'cheesecake' },
  ]
  /**
   * There are 12 possible unique instances of `Dinner`, and guess you what - 4 * 3 = 12
   */

  t.truthy(dinners)

  type OneShotFood = Case<'meal', MealSize> | Case<'dessert', Dessert>

  const OneShotFood = makeEnum<OneShotFood>()

  /**
   * How many different instances of `OneShotFood` can we create? Let's enumerate them:
   */
  const foods: OneShotFood[] = [
    { case: 'meal', p: 'small' },
    { case: 'meal', p: 'regular' },
    { case: 'meal', p: 'large' },
    { case: 'meal', p: 'xl' },
    { case: 'dessert', p: 'apple pie' },
    { case: 'dessert', p: 'brownie' },
    { case: 'dessert', p: 'cheesecake' },
  ]
  /**
   * There are 7 possible unique instances of `OneShotFood`, and guess you what - 4 + 3 = 7
   */

  t.truthy(foods)
})

test('But why do I need enums? - Example #1', (t) => {
  {
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

    t.deepEqual(
      { ...Product.inStock('Headphones', 100) },
      {
        isInBackOrder: false,
        isInStock: true,
        name: 'Headphones',
        quantity: 100,
      }
    )

    t.deepEqual(
      { ...Product.outOfStock('Headphones', true) },
      {
        isInBackOrder: true,
        isInStock: !false,
        name: 'Headphones',
        quantity: 0,
      }
    )
  }

  {
    interface StatusProto {
      get isInStock(): boolean
    }

    type Status = StatusProto &
      (
        | Case<'inStock', { quantity: number }>
        | Case<'outOfStock', { isInBackOrder: boolean }>
      )

    const Status = makeEnum<Status>({
      makeProto: () => ({
        get isInStock(): boolean {
          switch (this.case) {
            case 'inStock':
              return true
            case 'outOfStock':
              return false
          }
        },
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
        const baseQuantity =
          this.status.case === 'inStock' ? this.status.p.quantity : 0

        this.status = Status.inStock({ quantity: baseQuantity + quantity })

        // impossible to forget to check `isInStock` or `isInBackOrder`!
      }

      restock_variant(quantity: number): void {
        let status: Status

        switch (this.status.case) {
          case 'inStock':
            status = Status.inStock({
              quantity: this.status.p.quantity + quantity,
            })
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

    t.deepEqual(
      { ...new Product('Headphones', Status.inStock({ quantity: 100 })) },
      {
        name: 'Headphones',
        status: Status.inStock({ quantity: 100 }),
      }
    )

    t.deepEqual(
      {
        ...new Product(
          'Headphones',
          Status.outOfStock({ isInBackOrder: true })
        ),
      },
      {
        name: 'Headphones',
        status: Status.outOfStock({ isInBackOrder: true }),
      }
    )
  }
})

test('But why do I need enums? - Example #2', (t) => {
  interface Item {
    name: string
  }

  function deep_copy<T>(value: T): T {
    // not a real deep copy eh?
    return { ...value }
  }

  {
    // -- suboptimal way

    class ItemDetailViewModel {
      public isShowingDeleteAlert: boolean = false
      public isShowingEditModal: boolean = false
      public scratchItemForEditing: Item | null = null

      constructor(public item: Item) {}

      cancelItemDeletionButtonClicked(): void {
        this.isShowingDeleteAlert = false
        // we don't need to reset the "edit" states, right?
      }

      cancelItemEditingButtonClicked(): void {
        this.isShowingEditModal = false
        this.scratchItemForEditing = null
        // we don't need to reset the "delete" state, right?
      }

      confirmItemDeletionButtonClicked(): void {
        void 0
      }

      confirmItemEditingButtonClicked(): void {
        // are we really sure this is not `null`?
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    const vm = new ItemDetailViewModel({ name: 'Headphones' })
    vm.editItemButtonClicked()
    vm.scratchItemForEditing = { name: 'Edited' }
    t.deepEqual(
      { ...vm },
      {
        isShowingDeleteAlert: false,
        isShowingEditModal: true,
        item: { name: 'Headphones' },
        scratchItemForEditing: { name: 'Edited' },
      }
    )
    vm.confirmItemEditingButtonClicked()
    t.deepEqual(
      { ...vm },
      {
        isShowingDeleteAlert: false,
        isShowingEditModal: false,
        item: { name: 'Edited' },
        scratchItemForEditing: null,
      }
    )
  }

  {
    // -- better way

    type Presentation =
      | Case<'deleteAlert'>
      | Case<'editModal', { scratchItem: Item }>

    const Presentation = makeEnum<Presentation>()

    class ItemDetailViewModel {
      public presentation: Presentation | null = null

      constructor(public item: Item) {}

      cancelItemDeletionButtonClicked(): void {
        this.presentation = null
      }

      cancelItemEditingButtonClicked(): void {
        this.presentation = null
      }

      confirmItemDeletionButtonClicked(): void {
        void 0
      }

      confirmItemEditingButtonClicked(): void {
        if (this.presentation?.case === 'editModal') {
          this.item = this.presentation.p.scratchItem
        } else {
          //console.warn('Item editing confirmed while not in editing mode...')
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

    const vm = new ItemDetailViewModel({ name: 'Headphones' })
    vm.editItemButtonClicked()
    if (vm.presentation?.case === 'editModal') {
      vm.presentation.p.scratchItem.name = 'Edited'
    }
    t.deepEqual(
      { ...vm },
      {
        item: { name: 'Headphones' },
        presentation: Presentation.editModal({
          scratchItem: { name: 'Edited' },
        }),
      }
    )
    vm.confirmItemEditingButtonClicked()
    t.deepEqual({ ...vm }, { item: { name: 'Edited' }, presentation: null })
  }
})

test('But why do I need enums? - Example #3', async (t) => {
  {
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
      error: unknown
      items: Item[] = []
      isLoading: boolean = false
      isSuccess: boolean | null = null

      constructor(public url: string) {}

      async performLoad(): Promise<Item[]> {
        if (!this.isLoading) {
          this.isLoading = true

          this.loadPromise = new Promise((resolve, reject) => {
            // load data from `this.url`

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setTimeout(() => {
              const there_was_error = false
              const load_error = undefined
              const loaded_items: Item[] = [{ name: 'Headphones' } as Item]

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
          })
        }

        // can make non-null assertion here, it's valid but unfortunate
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.loadPromise!
      }
    }

    const dataLoader = new DataLoader<{ name: string }>(
      'http://ts-enums/example'
    )
    t.deepEqual(
      { ...dataLoader },
      {
        isLoading: false,
        isSuccess: null,
        items: [],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        loadPromise: dataLoader.loadPromise,
        url: 'http://ts-enums/example',
      }
    )
    t.deepEqual(await dataLoader.performLoad(), [{ name: 'Headphones' }])
    t.deepEqual(
      { ...dataLoader },
      {
        isLoading: false,
        isSuccess: true,
        items: [{ name: 'Headphones' }],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        loadPromise: dataLoader.loadPromise,
        url: 'http://ts-enums/example',
      }
    )
  }

  {
    // -- better way

    type DataLoadingStatus<Item> =
      | Case<'idle'>
      | Case<'loading', Promise<Item[]>>
      | Case<'loaded', Item[]>
      | Case<'error', { error: unknown }>

    interface DataLoadingStatusHKT extends HKT {
      readonly type: DataLoadingStatus<this['_A']>
    }

    const DataLoadingStatus = makeEnum1<DataLoadingStatusHKT>()

    class DataLoader<Item> {
      loadStatus: DataLoadingStatus<Item> = DataLoadingStatus.idle()

      constructor(public url: string) {}

      async performLoad(): Promise<Item[]> {
        switch (this.loadStatus.case) {
          case 'idle': {
            const loadPromise = new Promise<Item[]>((resolve, reject) => {
              // load data from `this.url`

              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              setTimeout(() => {
                const there_was_error = false
                const load_error = undefined
                const loaded_items: Item[] = [{ name: 'Headphones' } as Item]

                if (there_was_error) {
                  this.loadStatus = DataLoadingStatus.error({
                    error: load_error,
                  })
                  reject(load_error)
                } else {
                  this.loadStatus = DataLoadingStatus.loaded(loaded_items)
                  resolve(loaded_items)
                }
              })
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

    const dataLoader = new DataLoader<{ name: string }>(
      'http://ts-enums/example'
    )
    t.deepEqual(
      { ...dataLoader },
      {
        loadStatus: DataLoadingStatus.idle(),
        url: 'http://ts-enums/example',
      }
    )
    t.deepEqual(await dataLoader.performLoad(), [{ name: 'Headphones' }])
    t.deepEqual(
      { ...dataLoader },
      {
        loadStatus: DataLoadingStatus.loaded([{ name: 'Headphones' }]),
        url: 'http://ts-enums/example',
      }
    )
  }
})

test('ts-pattern', (t) => {
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

  const appReducer = (state: AppState, action: AppAction): AppState => {
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
})
