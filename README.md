# relational-reselect

[![Build Status](https://travis-ci.org/liitfr/relational-reselect.svg?branch=master)](https://travis-ci.org/liitfr/relational-reselect)
[![Coverage Status](https://coveralls.io/repos/github/liitfr/relational-reselect/badge.svg?branch=master)](https://coveralls.io/github/liitfr/relational-reselect?branch=master)

With its decarative style, this lirary aims to facilitate creation of complex selectors on a normalized store.

```
import { createSelector } from "reselect";
import Query from 'relational-reselect';

const ordersSelector = state => state.get("orders");
const ordersFrSelector = createSelector(ordersSelector, orders => orders.filter(order => order.get('country') === 'fr'));
const customersSelector = state => state.get("customers");

const salesReportFrSelector = new Query()
  .from(customersSelector, "cust")
  .innerJoin(ordersFrSelector, "ord")
  .on(tuple => tuple.getIn(["cust", "id"]) === tuple.getIn(["ord", "customer"]));

// ...

salesReportFrSelector.run(state);
```

more example are available on dedicated [CodeSandbox](https://codesandbox.io/s/427q264yv0)

## State Machine Diagram

![State Machine diagram](./docs/state.jpg?raw=true "State Machine diagram")

## Class Diagram

![Class diagram](./docs/class.jpg?raw=true "Class diagram")
