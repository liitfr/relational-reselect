import FromNode from "./FromNode";
import Query from "./Query";

class CompleteJoin extends FromNode {
  constructor(context: Query) {
    super(context);
  }
}

export default CompleteJoin;
