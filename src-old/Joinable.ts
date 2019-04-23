import { DataSource } from "./utils/types";

import IncompleteJoin from "./IncompleteJoin";

interface Joinable {
  join(dataSource: DataSource, alias: string): IncompleteJoin;
}

export default Joinable;
