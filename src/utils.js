import { List } from "immutable";

const f = (a, b) => {
  const result = List().concat(...a.map(d => b.map(e => d.merge(e))));
  return result;
};

const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

export { cartesian };
