# relational-reselect

[![Build Status](https://travis-ci.org/liitfr/relational-reselect.svg?branch=master)](https://travis-ci.org/liitfr/relational-reselect)
[![Coverage Status](https://coveralls.io/repos/github/liitfr/relational-reselect/badge.svg?branch=master)](https://coveralls.io/github/liitfr/relational-reselect?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/7112f798a4e247c78d531d54a7468837)](https://app.codacy.com/app/liitfr/relational-reselect?utm_source=github.com&utm_medium=referral&utm_content=liitfr/relational-reselect&utm_campaign=Badge_Grade_Dashboard)
![npm bundle size](https://img.shields.io/bundlephobia/min/relational-reselect.svg)
![NPM](https://img.shields.io/npm/l/relational-reselect.svg)
![npm](https://img.shields.io/npm/v/relational-reselect.svg)

With its decarative style, this library aims to facilitate creation of complex selectors on a normalized store that imposes to perform joins, lookups, relationships, or whatever you call it !

```js
import { createSelector } from 'reselect';
import Query from 'relational-reselect';

// my selectors
const a = createSelector(
  aSelector,
  aFn,
);
const b = createSelector(
  bSelector,
  bFn,
);
const c = createSelector(
  cSelector,
  cFn,
);

// define my query
const myQuery = new Query()
  .from(a, 'a')
  .leftJoin(b, 'b')
  .on(row => row.getIn(['a', 'id']) === row.getIn(['b', 'aRef']))
  .leftJoin(c, 'c')
  .on(row => row.getIn(['c', 'id']) >= row.getIn(['a', 'cId']));

// get generated selector
const mySelector = myQuery.get();

// or directly run it
const myData = myQuery.run(state);
```

other examples are available on dedicated [CodeSandbox](https://codesandbox.io/s/427q264yv0)

## Install

```js
npm install --save relational-reselect
```

## How to write a query ?

![State Machine diagram](./docs/state.jpg?raw=true 'State Machine diagram')

## API

### Query bloc

#### `new Query()`

Create a new query

#### `get(): Selector`

generate selector for this query

#### `run(state: State): Collection`

run this query (= execute its selector) and return result

### Select bloc

#### `select(selectSpec: SpecificationForTuple): Select`

Optional operation if you need to process data coming from From bloc.

### From bloc

In this bloc, any `dataSource` can be a selector (a simple one or a `reselect` one) or another valid query if you need to nest them.
`Aliases` are required for naming `dataSources`, except when you use `except`, `intersect`, and `union` joins

#### `from(dataSource: DataSource, alias: string): From`

Required operation.

#### Joins

Optional operation. You can join as much data sources as you want as long as you specify how to join them.
Supported join types are :

- `innerJoin(dataSource: DataSource, alias: string): IncompleteJoin`
- `leftJoin(dataSource: DataSource, alias: string): IncompleteJoin`
- `rightJoin(dataSource: DataSource, alias: string): IncompleteJoin`
- `fullJoin(dataSource: DataSource, alias: string): IncompleteJoin`
- `except(dataSource: DataSource): CompleteJoin`
- `intersect(dataSource: DataSource): CompleteJoin`
- `union(dataSource: DataSource): CompleteJoin`
- `cartesian(dataSource: DataSource, alias: string): CompleteJoin`

Incomplete joins need to be completed with a `on(specification: SpecificationForMatchingTuple): CompleteJoin`

### Where bloc

#### `where(whereSpec: SpecificationForMatchingTuple): Where`

Optional operation. This filter will be applied over data coming from From or Select (if exists) bloc

### Ordering bloc

#### `orderBy(orderBySpec: SpecificationForOrderingTuples): OrderBy`

Optional operation. This sort will be applied over data coming from From, or Select (if exists), or Where (if exists) bloc

### Grouping bloc

TODO !

### Specification Types

```
type Tuple = Map<string, any>;
type SpecificationForTuple = (tuple: Tuple) => Tuple;
type SpecificationForMatchingTuple = (tuple: Tuple) => boolean;
type SpecificationForOrderingTuples = (left: Tuple, right: Tuple) => number;
```

## Class Diagram

![Class diagram](./docs/class.jpg?raw=true 'Class diagram')
