# graphql-extend-input

[![npm version](https://img.shields.io/npm/v/graphql-extend-input.svg)](https://npm.im/graphql-extend-input) ![Licence](https://img.shields.io/npm/l/graphql-extend-input.svg) [![Github issues](https://img.shields.io/github/issues/danielmeneses/graphql-extend-input.svg)](https://github.com/danielmeneses/graphql-extend-input/issues) [![Github stars](https://img.shields.io/github/stars/danielmeneses/graphql-extend-input.svg)](https://github.com/danielmeneses/graphql-extend-input/stargazers)

Extend graphql Inputs.

## Why?

The Simple answer is, `extend input MyInput` is not part of the GraphQL specs.
So, let's say you need to add specific fields to an `Input` on a remote fetched schema. In this case, you'll have to actually rewrite whole input schema, so now we have this duplication and it's really hard to maintain. This happens quite often if you are to build a graphql gateway and you need to merge the schemas from graphql microservices. Bonus feature `extend enum` also available.

Hopefully this will be introduced into the specs sooner or later!

## What's the goal?

* Get the statement `extend input MyInput` and `NewInput extend input MyInput` to work.
* Don't touch on the AST or GraphQL objects directly, this should work on top of the work already done by other contributors so let's try to make it simple, even if that means fewer features.
* Use [`graphql/utilities`](http://graphql.org/graphql-js/utilities/) as much as possible.

## How to use

* `[NewName] extend <input|enum> ObjectToExt[, AnotherObjectToExt, ...]`
* A complex example would be: `NewInput extends input MyInput1, MyInput2, MyInput3 {}`. This will only return text (GraphQL language) with a new `input` type called `NewInput`.

### Install

```bash
npm i graphql-extend-input --save-prod
```

### Getting partial changes/creations

```js
import gqlExtI from 'graphql-extend-input';

// Schema representing a remote fetched schema
// this can either be a string or a GraphQLSchema object
const remoteFetchedSchema = `
  scalar Date

  input BookInput {
    title: String!
    date: Date
  }

  type Book {
    id: ID!
    title: String
    author: String
    price: Float
  }

  type Query {
    getBooks(filter: [BookInput]!): Book
  }
`;

const newSchema = gqlExtI(remoteFetchedSchema, `
  extend input BookInput {
    author: String
    price: Float
  }
`);
console.log(newSchema);
/** Output:

  input BookInput {
    author: String
    price: Float
    title: String!
    date: Date
  }
*/
```

So you can now use `newSchema` and merge it with `remoteFetchedSchema`. It would look something like:

```js
import { mergeSchemas } from 'graphql-tools';

const mergedSchemas = mergeSchemas({
  schemas: [
    remoteFetchedSchema,
    newSchema
  ],
  resolvers: (mergeInfo) => ({
    // new/overwrite resolvers
  }),
  onTypeConflict: (left, right) => {
    // for this example we need to return right!
    return right;
  }
});

```

### Extending and creating a new `Input`

If you don't need to mess with existing `Inputs` you could also do the following.

```js
const newSchema = gqlExtI(remoteFetchedSchema, `
  NewBookInput extend input BookInput {
    author: String
    price: Float
  }

  extend type Query {
    newGetBooks(filter: [NewBookInput]!): Book
  }
`);

console.log(newSchema);
/** Output:

  input NewBookInput {
    author: String
    price: Float
    title: String!
    date: Date
  }
  extend type Query {
    newGetBooks(filter: [NewBookInput]!): Book
  }
*/
```

### Get the complete resulting schema

```js
const newSchema = gqlExtI(remoteFetchedSchema, `
  extend input BookInput {
    author: String
    price: Float
  }
`, true); // just need to pass true on the last param

console.log(newSchema);
/** Output:

  scalar Date
  input BookInput {
    author: String
    price: Float
    title: String!
    date: Date
  }
  type Book {
    id: ID!
    title: String
    author: String
    price: Float
  }
  type Query {
    getBooks(filter: [BookInput]!): Book
  }

*/
```

### Multiple extends - similar to union

```js

const remoteFetchedSchema = `
  input PersonInput {
    firstname: String!
    lastname: String!
  }

  input AddressBookInput {
    street: String!
    phone: String!
  }
`;

const newSchema = gqlExtI(remoteFetchedSchema, `
  EmployeeInput extend input PersonInput, AddressBookInput {
    salary: Float!
    department: String!
  }

  extend type Query {
    getEmployNumber(input: EmployeeInput): Int!
  }
`);

console.log(newSchema);
/** Output:

  input EmployeeInput {
    salary: Float!
    department: String!
    street: String!
    phone: String!
    firstname: String!
    lastname: String!
  }
  extend type Query {
    getEmployNumber(input: EmployeeInput): Int!
  }

*/
```

### Into the wild plus `extend enum`

```js
const remoteFetchedSchema = `
  input TVShowInput {
    title: String!
    duration: Int!
  }

  input TVShowCastInput {
    castMemberName: String!
  }

  enum TVShows {
    lost
    walking_dead
  }

  enum BestTVShows {
    got
    breaking_bad
    black_mirror
    mr_robot
  }
`;

const newSchema = gqlExtI( remoteFetchedSchema,
  `
  type TvShow {
    title: String!
    duration: Int!
    cast: [String!]!
  }

  TVShowSearchInput extend input TVShowInput, TVShowCastInput {
    tvshow: AllTVShowsEnum
  }

  AllTVShowsEnum extend enum TVShows, BestTVShows {}

  extend type Query {
    searchTVShows(input: TVShowSearchInput): [TVShow]
    getTVShow(input: AllTVShowsEnum) TVShow
  }
`
);

console.log(newSchema);
/** Output:

  input TVShowSearchInput {
    tvshow: AllTVShowsEnum
    castMemberName: String!
    title: String!
    duration: Int!
  }
  enum AllTVShowsEnum {
    got
    breaking_bad
    black_mirror
    mr_robot
    lost
    walking_dead
  }
  type TvShow {
    title: String!
    duration: Int!
    cast: [String!]!
  }
  extend type Query {
    searchTVShows(input: TVShowSearchInput): [TVShow]
    getTVShow(input: AllTVShowsEnum) TVShow
  }
*/

```

## Work in progress

* Maybe support `extend enum` also or maybe that will be for another repo. ✔️
* More real world examples and tests.

## Important note:

Unfortunately I don't do open-source for a living, not that I would mind :), so if you find a bug or have any suggestion to improve this module you're very welcome to contribute.
