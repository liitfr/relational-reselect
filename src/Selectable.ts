import { SpecificationForTuple } from "./utils/types";

import Select from "./Select";

interface Selectable {
  select(selectSpec: SpecificationForTuple): Select;
}

export default Selectable;
