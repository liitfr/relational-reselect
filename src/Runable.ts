import { Collection, State } from "./utils/types";

interface Runable {
  run(state: State): Collection;
}

export default Runable;
