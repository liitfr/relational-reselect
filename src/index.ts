import { List, Map } from "immutable";
import { createSelector } from "reselect";
import invariant from "ts-invariant";

//------------------------------------------------------------------------------
// Utils
//------------------------------------------------------------------------------

const cartesian = (
  a: Collection,
  b?: Collection,
  ...c: Collection[]
): Collection => {
  const f = (a: Collection, b: Collection): Collection =>
    List().concat(...a.map((d: Tuple) => b.map((e: Tuple) => d.merge(e))));
  return b ? cartesian(f(a, b), ...c) : a;
};

const outerJoinBehaviorGenerator = (side: "left" | "right") => (
  specification: SpecificationForMatchingTuple
) => (left: Collection, right: Collection) => {
  const inner = cartesian(left, right).filter(specification);
  const outer = (side === "left" ? left : right).filter(
    (lTuple: Tuple) => !inner.find((iTuple: Tuple) => lTuple.isSubset(iTuple))
  );
  return inner.concat(outer);
};

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

type Tuple = Map<string, any>;

type Collection = List<Tuple>;

type State = Map<string, Collection>;

type Selector = (state: State) => Collection;

type SpecificationForJoiningCollections = (
  left: Collection,
  right: Collection
) => Collection;

type SpecificationForMatchingTuple = (tuple: Tuple) => boolean;

type SpecificationForOrderingTuples = (left: Tuple, right: Tuple) => number;

type SpecificationForGroupingTuples = (tuple: Tuple) => any;

type SpecificationForTuple = (tuple: Tuple) => Tuple;

type StatementSpecification =
  | SpecificationForJoiningCollections
  | SpecificationForTuple;

type Behavior = (
  specification: SpecificationForMatchingTuple
) => SpecificationForJoiningCollections;

type DataSource = RunableStatement | Selector;

type AliasedDataSource = {
  dataSource: DataSource;
  alias: string;
};

type Join = {
  aliasedDataSource: AliasedDataSource;
  joinSpec: SpecificationForJoiningCollections;
};

//------------------------------------------------------------------------------
// Model
//------------------------------------------------------------------------------

interface StatementInterface {
  context: Query;
}

interface SpecStatement extends StatementInterface {
  specification: StatementSpecification;
}

interface AliasedDataSourceStatement extends StatementInterface {
  aliasedDataSource: AliasedDataSource;
}

abstract class Statement implements StatementInterface {
  context: Query;

  constructor(context: Query) {
    this.context = context;
  }
}

interface Runable {
  run(state: State): Collection;
  get(): Selector;
}

abstract class RunableStatement extends Statement implements Runable {
  constructor(context: Query) {
    super(context);
  }

  run(state: State): Collection {
    return this.context.run(state);
  }

  get(): Selector {
    return this.context.get();
  }
}

interface Joinable {
  innerJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  leftJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  rightJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  /*fullJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  except(dataSource: DataSource, alias: string): CompleteJoin;
  intersect(dataSource: DataSource, alias: string): CompleteJoin;
  union(dataSource: DataSource, alias: string): CompleteJoin;*/
  cartesian(dataSource: DataSource, alias: string): CompleteJoin;
}

interface Whereable {
  where(): Where;
}

interface OrderByable {
  orderBy(): OrderBy;
}

interface GroupByable {
  groupBy(): GroupBy;
}

abstract class FromNode extends RunableStatement
  implements Joinable, Whereable, OrderByable, GroupByable {
  constructor(context: Query) {
    super(context);
  }

  checkAlias(alias: string) {
    return invariant(
      !this.context.getAliases().includes(alias),
      `alias "${alias}" must not be used more than once`
    );
  }

  innerJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior: Behavior = (
      specification: SpecificationForMatchingTuple
    ) => (left: Collection, right: Collection) =>
      cartesian(left, right).filter(specification);
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  leftJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior = outerJoinBehaviorGenerator("left");
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  rightJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior = outerJoinBehaviorGenerator("right");
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  /*fullJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    return new IncompleteJoin(this.context, { dataSource, alias });
  }

  except(dataSource: DataSource, alias: string): CompleteJoin {
    this.checkAlias(alias);
    return new IncompleteJoin(this.context, { dataSource, alias });
  }

  intersect(dataSource: DataSource, alias: string): CompleteJoin {
    this.checkAlias(alias);
    return new IncompleteJoin(this.context, { dataSource, alias });
  }

  union(dataSource: DataSource, alias: string): CompleteJoin {
    this.checkAlias(alias);
    return new IncompleteJoin(this.context, { dataSource, alias });
  }*/

  cartesian(dataSource: DataSource, alias: string): CompleteJoin {
    this.checkAlias(alias);
    this.context.addJoinSpec({
      aliasedDataSource: { dataSource, alias },
      joinSpec: (left: Collection, right: Collection) => cartesian(left, right)
    });
    return new CompleteJoin(this.context);
  }
}

class CompleteJoin extends FromNode {
  constructor(context: Query) {
    super(context);
  }
}

class From extends FromNode implements AliasedDataSourceStatement {
  aliasedDataSource: AliasedDataSource;

  constructor(context: Query, aliasedDataSource: AliasedDataSource) {
    super(context);
    this.aliasedDataSource = aliasedDataSource;
    this.context.setFromSpec(aliasedDataSource);
  }
}

class Where extends RunableStatement implements OrderByable, GroupByable {}

class OrderByable extends RunableStatement implements GroupByable {}

class GroupByable extends RunableStatement {}

interface Onable {
  on(specification: SpecificationForMatchingTuple): CompleteJoin;
}

class IncompleteJoin extends Statement
  implements AliasedDataSourceStatement, Onable, SpecStatement {
  aliasedDataSource: AliasedDataSource;
  behavior: Behavior;
  specification: SpecificationForJoiningCollections;

  constructor(
    context: Query,
    aliasedDataSource: AliasedDataSource,
    behavior: Behavior
  ) {
    super(context);
    this.aliasedDataSource = aliasedDataSource;
    this.behavior = behavior;
  }

  on(specification: SpecificationForMatchingTuple): CompleteJoin {
    this.specification = this.behavior(specification);
    this.context.addJoinSpec({
      aliasedDataSource: this.aliasedDataSource,
      joinSpec: this.specification
    });
    return new CompleteJoin(this.context);
  }
}

interface Fromable {
  from(dataSource: DataSource, alias: string): From;
}

interface Selectable {
  select(selectSpec: SpecificationForTuple): Select;
}

class Query implements Fromable, Runable, Selectable {
  private selectSpec: SpecificationForTuple;
  private fromSpec: AliasedDataSource;
  private joinSpec: Join[] = [];
  private whereSpec: SpecificationForMatchingTuple;
  private orderBySpec: SpecificationForOrderingTuples;
  private groupBySpec: SpecificationForGroupingTuples;

  private dataSourceNormalizer(aliasedDataSource: AliasedDataSource): Selector {
    const getSelector = (dataSource: DataSource): Selector =>
      dataSource instanceof RunableStatement ? dataSource.get() : dataSource;

    return createSelector(
      getSelector(aliasedDataSource.dataSource),
      (collection: Collection): Collection =>
        collection.map(item => Map({ [aliasedDataSource.alias]: item }))
    );
  }

  getAliases(): List<string> {
    const aliases = List().push(this.fromSpec.alias);
    return this.joinSpec
      ? aliases.push(this.joinSpec.map(join => join.aliasedDataSource.alias))
      : aliases;
  }

  setSelectSpec(specification: SpecificationForTuple) {
    this.selectSpec = specification;
  }

  setFromSpec(specification: AliasedDataSource) {
    this.fromSpec = specification;
  }

  addJoinSpec(join: Join) {
    this.joinSpec.push(join);
  }

  setWhereSpec(specification: SpecificationForMatchingTuple) {
    this.whereSpec = specification;
  }

  setOrderBySpec(specification: SpecificationForOrderingTuples) {
    this.orderBySpec = specification;
  }

  setGroupBySpec(specification: SpecificationForGroupingTuples) {
    this.groupBySpec = specification;
  }

  select(selectSpec: SpecificationForTuple) {
    return new Select(this, selectSpec);
  }

  from(dataSource: DataSource, alias: string) {
    return new From(this, { dataSource, alias });
  }

  private build() {
    invariant(
      this.fromSpec,
      "There should be one and only one From statement in your query"
    );
    let selector: Selector = this.dataSourceNormalizer(this.fromSpec);
    if (this.joinSpec && this.joinSpec.length > 0) {
      this.joinSpec.forEach(
        ({ aliasedDataSource, joinSpec }) =>
          (selector = createSelector(
            selector,
            this.dataSourceNormalizer(aliasedDataSource),
            joinSpec
          ))
      );
    }
    if (this.selectSpec) {
      selector = createSelector(
        selector,
        collection => collection.map(this.selectSpec)
      );
    }
    if (this.whereSpec) {
      selector = createSelector(
        selector,
        collection => collection.filter(this.whereSpec)
      );
    }
    if (this.orderBySpec) {
      selector = createSelector(
        selector,
        collection => collection.sort(this.orderBySpec)
      );
    }
    if (this.groupBySpec) {
      selector = createSelector(
        selector,
        collection => collection.groupBy(this.groupBySpec)
      );
    }
    return selector;
  }

  get(): Selector {
    return this.build();
  }

  run(state: State): Collection {
    return this.build()(state);
  }
}

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

export default Query;
export { Tuple, State, Collection };
