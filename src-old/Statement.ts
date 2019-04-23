import {
  Collection,
  AliasedDataSource,
  Selector,
  State,
  Specification
} from "./utils/types";

import Query from "./Query";
import Runable from "./Runable";

interface StatementInterface {
  context: Query;
}

interface SpecStatement extends StatementInterface {
  specification: Specification;
}

interface AliasedDataSourceStatement extends StatementInterface {
  aliasedDataSource: AliasedDataSource;
}

abstract class Statement implements StatementInterface {
  context: Query;

  constructor(context: Query) {
    this.context = context;
  }
}

abstract class RunableStatement extends Statement implements Runable {
  constructor(context: Query) {
    super(context);
  }

  run(state: State): Collection {
    return this.context.run(state);
  }

  get(): Selector {
    return this.context.get();
  }
}

export {
  AliasedDataSourceStatement,
  RunableStatement,
  SpecStatement,
  Statement
};
