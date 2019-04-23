import { List, Map } from "immutable";

import { RunableStatement } from "../Statement";

type Tuple = Map<string, any>;

type Collection = List<Tuple>;

type State = Map<string, Collection>;

type Selector = (state: State) => Collection;

// ----------------------------------------------------

type SpecificationForCollection = (collection: Collection) => Collection;

type SpecificationForJoin = (left: Collection, right: Collection) => Collection;

type SpecificationForTuple = (tupe: Tuple) => Tuple;

type Specification =
  | SpecificationForCollection
  | SpecificationForJoin
  | SpecificationForTuple;

// ----------------------------------------------------

type DataSource = RunableStatement | Selector;

type AliasedDataSource = {
  dataSource: DataSource;
  alias: string;
};

type Join = {
  aliasedDataSource: AliasedDataSource;
  joinSpec: SpecificationForJoin;
};

export {
  AliasedDataSource,
  Collection,
  DataSource,
  Join,
  Selector,
  Specification,
  SpecificationForCollection,
  SpecificationForJoin,
  SpecificationForTuple,
  State,
  Tuple
};
