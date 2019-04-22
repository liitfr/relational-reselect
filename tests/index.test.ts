import { createSelector } from "reselect";
import { fromJS, Map } from "immutable";

import Query, { Tuple, State, Collection } from "../src";
import { InvariantError } from "ts-invariant";

const state = fromJS({
  customers: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe"
    },
    {
      id: 2,
      firstName: "Homer",
      lastName: "Simpson"
    },
    {
      id: 3,
      firstName: "Bender",
      lastName: "Rodriguez"
    }
  ],
  orders: [
    {
      id: 100,
      custId: 1,
      productId: 50,
      qty: 3
    }
  ],
  products: [
    {
      id: 50,
      label: "computer"
    },
    {
      id: 120,
      label: "cellphone"
    }
  ]
});

const customersSelector = (state: State) => state.get("customers");
test("Create a simple selector on customers", () => {
  expect(customersSelector(state)).toEqual(state.get("customers"));
});

const twoCustomersSelector = createSelector(
  customersSelector,
  (customers: Collection) =>
    customers.filter((customer: Tuple) => [1, 2].includes(customer.get("id")))
);
test("Use reselect on customers", () => {
  expect(twoCustomersSelector(state)).toEqual(
    fromJS([
      {
        id: 1,
        firstName: "John",
        lastName: "Doe"
      },
      {
        id: 2,
        firstName: "Homer",
        lastName: "Simpson"
      }
    ])
  );
});

const customersQ = new Query().from(twoCustomersSelector, "cust");
test("Run a query with a where on reselect", () => {
  expect(customersQ.run(state)).toEqual(
    fromJS([
      { cust: { id: 1, firstName: "John", lastName: "Doe" } },
      { cust: { id: 2, firstName: "Homer", lastName: "Simpson" } }
    ])
  );
});

const CUST = "customers";
const selectResult = (result: Tuple) =>
  Map({
    fullName: `${result.getIn([CUST, "firstName"])} ${result.getIn([
      CUST,
      "lastName"
    ])}`
  });
const customersNameQ1 = new Query()
  .select(selectResult)
  .from(twoCustomersSelector, CUST);

test("Run a query with a where and a select on reselect", () => {
  expect(customersNameQ1.run(state)).toEqual(
    fromJS([{ fullName: "John Doe" }, { fullName: "Homer Simpson" }])
  );
});

const customersNameQ2 = new Query().from(customersNameQ1, "qCust");
customersNameQ2.run(state).toJS();
test("Use a query in another one", () => {
  expect(customersNameQ2.run(state)).toEqual(
    fromJS([
      { qCust: { fullName: "John Doe" } },
      { qCust: { fullName: "Homer Simpson" } }
    ])
  );
});

const ordersSelector = (state: State) => state.get("orders");
const productsSelector = (state: State) => state.get("products");

const cartesianJoin = new Query()
  .from(customersSelector, "cust")
  .cartesian(ordersSelector, "ord")
  .cartesian(productsSelector, "prod");

test("Use cartesian operation in a query", () => {
  expect(cartesianJoin.run(state)).toEqual(
    fromJS([
      {
        cust: { id: 1, firstName: "John", lastName: "Doe" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 50, label: "computer" }
      },
      {
        cust: { id: 1, firstName: "John", lastName: "Doe" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 120, label: "cellphone" }
      },
      {
        cust: { id: 2, firstName: "Homer", lastName: "Simpson" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 50, label: "computer" }
      },
      {
        cust: { id: 2, firstName: "Homer", lastName: "Simpson" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 120, label: "cellphone" }
      },
      {
        cust: { id: 3, firstName: "Bender", lastName: "Rodriguez" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 50, label: "computer" }
      },
      {
        cust: { id: 3, firstName: "Bender", lastName: "Rodriguez" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 120, label: "cellphone" }
      }
    ])
  );
});

const innerJoin = new Query()
  .from(twoCustomersSelector, "cust")
  .innerJoin(ordersSelector, "ord")
  .on(tuple => tuple.getIn(["cust", "id"]) === tuple.getIn(["ord", "custId"]))
  .innerJoin(productsSelector, "prod")
  .on(
    tuple => tuple.getIn(["ord", "productId"]) === tuple.getIn(["prod", "id"])
  );

test("Use an inner join in a query", () => {
  expect(innerJoin.run(state)).toEqual(
    fromJS([
      {
        cust: { id: 1, firstName: "John", lastName: "Doe" },
        ord: { id: 100, custId: 1, productId: 50, qty: 3 },
        prod: { id: 50, label: "computer" }
      }
    ])
  );
});

test("Can't use same alias more than once", () => {
  expect(() =>
    new Query().from(customersSelector, "a").cartesian(ordersSelector, "a")
  ).toThrowError(
    new InvariantError('alias "a" must not be used more than once')
  );
});

const leftJoin = new Query()
  .from(twoCustomersSelector, "cust")
  .leftJoin(ordersSelector, "ord")
  .on(tuple => tuple.getIn(["cust", "id"]) === tuple.getIn(["ord", "custId"]));

console.log(leftJoin.run(state).toJS());
