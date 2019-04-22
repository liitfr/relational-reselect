import { DataSource } from "./utils/types";
import From from "./From";

interface Fromable {
  from(dataSource: DataSource, alias: string): From;
}

export default Fromable;
