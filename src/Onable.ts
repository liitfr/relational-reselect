import { SpecificationForJoin } from "./utils/types";

import CompleteJoin from "./CompleteJoin";

interface Onable {
  on(specification: SpecificationForJoin): CompleteJoin;
}

export default Onable;
