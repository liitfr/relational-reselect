import invariant from "invariant";

import Query from "./Query";
import Joinable from "./Joinable";
import { RunableStatement } from "./Statement";

import { DataSource } from "./utils/types";

import IncompleteJoin from "./IncompleteJoin";

abstract class FromNode extends RunableStatement implements Joinable {
  constructor(context: Query) {
    super(context);
  }

  join(dataSource: DataSource, alias: string): IncompleteJoin {
    invariant(
      !this.context.getAliases().includes(alias),
      `alias "${alias}" must not be used more than once`
    );
    return new IncompleteJoin(this.context, { dataSource, alias });
  }
}

export default FromNode;
