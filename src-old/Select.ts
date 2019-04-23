import { DataSource, SpecificationForTuple } from "./utils/types";

import { Statement, SpecStatement } from "./Statement";
import From from "./From";
import Fromable from "./Fromable";
import Query from "./Query";

class Select extends Statement implements Fromable, SpecStatement {
  specification: SpecificationForTuple;

  constructor(context: Query, specification: SpecificationForTuple) {
    super(context);
    this.specification = specification;
    this.context.setSelectSpec(this.specification);
  }

  from(dataSource: DataSource, alias: string) {
    return new From(this.context, { dataSource, alias });
  }
}

export default Select;
