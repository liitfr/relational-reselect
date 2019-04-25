# relational-reselect (💥 WIP)

![Travis (.org)](https://img.shields.io/travis/liitfr/relational-reselect.svg)
![Coveralls github](https://img.shields.io/coveralls/github/liitfr/relational-reselect.svg)
![Codacy grade](https://img.shields.io/codacy/grade/7112f798a4e247c78d531d54a7468837.svg)
![npm bundle size](https://img.shields.io/bundlephobia/min/relational-reselect.svg)
![NPM](https://img.shields.io/npm/l/relational-reselect.svg)
![npm](https://img.shields.io/npm/v/relational-reselect.svg)

With its decarative style, this library aims to facilitate creation of complex selectors on a normalized store that imposes to perform joins, lookups, relationships, or whatever you call it !

```js
import { createSelector } from 'reselect';
import Query from 'relational-reselect';

const ordersSelector = state => state.get('orders');
const ordersFrSelector = createSelector(
  ordersSelector,
  orders => orders.filter(order => order.get('country') === 'fr'),
);
const customersSelector = state => state.get('customers');

const salesReportFrSelector = new Query()
  .from(customersSelector, 'cust')
  .innerJoin(ordersFrSelector, 'ord')
  .on(
    tuple => tuple.getIn(['cust', 'id']) === tuple.getIn(['ord', 'customer']),
  );

salesReportFrSelector.run(state);
```

other examples are available on dedicated [CodeSandbox](https://codesandbox.io/s/427q264yv0)

## Install

```js
npm install --save relational-reselect
```

## API

### `const query = new Query()`

To create a new query, this one is fair enough !

### `.select()`

Optional step, if you want to perform cleansing or enrichment over joined data.

### `.from()`

Required step, can consume a proper selector or another query if you want to nest theme. You must provide a data source and its alias as well.

### Joins

Optional step, you can add as much data sources as you want as long as you specify how to join them

#### `.innerJoin()`

#### `.leftJoin()`

#### `.rightJoin()`

#### `.fullJoin()`

#### `.except()`

#### `.intersect()`

#### `.union()`

#### `.cartesian()`

### `.where()`

### Ordering

Optional step, it will proceed over from`` or select

## State Machine Diagram

![State Machine diagram](./docs/state.jpg?raw=true 'State Machine diagram')

## Class Diagram

![Class diagram](./docs/class.jpg?raw=true 'Class diagram')
