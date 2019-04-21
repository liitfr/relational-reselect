import {
  SpecificationForJoin,
  AliasedDataSource,
  Specification
} from "./utils/types";

import {
  Statement,
  AliasedDataSourceStatement,
  SpecStatement
} from "./Statement";
import Onable from "./Onable";
import Query from "./Query";
import CompleteJoin from "./CompleteJoin";

class IncompleteJoin extends Statement
  implements AliasedDataSourceStatement, Onable, SpecStatement {
  aliasedDataSource: AliasedDataSource;
  specification: Specification;

  constructor(context: Query, aliasedDataSource: AliasedDataSource) {
    super(context);
    this.aliasedDataSource = aliasedDataSource;
  }

  on(specification: SpecificationForJoin): CompleteJoin {
    this.specification = specification;
    this.context.addJoinSpec({
      aliasedDataSource: this.aliasedDataSource,
      joinSpec: this.specification
    });
    return new CompleteJoin(this.context);
  }
}

export default IncompleteJoin;
