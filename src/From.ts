import Query from "./Query";
import FromNode from "./FromNode";

import { AliasedDataSource } from "./utils/types";
import { AliasedDataSourceStatement } from "./Statement";

class From extends FromNode implements AliasedDataSourceStatement {
  aliasedDataSource: AliasedDataSource;

  constructor(context: Query, aliasedDataSource: AliasedDataSource) {
    super(context);
    this.aliasedDataSource = aliasedDataSource;
    this.context.setFromSpec(this.aliasedDataSource);
  }
}

export default From;
