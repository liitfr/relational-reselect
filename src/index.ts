import { List, Map } from 'immutable';
import { createSelector } from 'reselect';
import invariant from 'ts-invariant';

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

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

type Tuple = Map<string, any>;

type Collection = List<Tuple>;

type State = Map<string, Collection>;

type Selector = (state: State) => Collection;

type SpecificationForJoiningCollections = (
  left: Collection,
  right: Collection,
) => Collection;

type SpecificationForMatchingTuple = (tuple: Tuple) => boolean;

type SpecificationForOrderingTuples = (left: Tuple, right: Tuple) => number;

type SpecificationForTuple = (tuple: Tuple) => Tuple;

type StatementSpecification =
  | SpecificationForJoiningCollections
  | SpecificationForTuple
  | SpecificationForMatchingTuple
  | SpecificationForOrderingTuples;

type Behavior = (
  specification: SpecificationForMatchingTuple,
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

const LEFT = Symbol('left');
const RIGHT = Symbol('right');

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

  public run(state: State): Collection {
    return this.context.run(state);
  }

  public get(): Selector {
    return this.context.get();
  }
}

interface Joinable {
  innerJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  leftJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  rightJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  fullJoin(dataSource: DataSource, alias: string): IncompleteJoin;
  except(dataSource: DataSource): CompleteJoin;
  intersect(dataSource: DataSource): CompleteJoin;
  union(dataSource: DataSource): CompleteJoin;
  cartesian(dataSource: DataSource, alias: string): CompleteJoin;
}

interface Whereable {
  where(whereSpec: SpecificationForMatchingTuple): Where;
}

interface OrderByable {
  orderBy(orderBySpec: SpecificationForOrderingTuples): OrderBy;
}

abstract class FromNode extends RunableStatement
  implements Joinable, Whereable, OrderByable {
  constructor(context: Query) {
    super(context);
  }

  private static outerJoinBehaviorGenerator(sides: Symbol[]): Behavior {
    return (specification: SpecificationForMatchingTuple) => (
      left: Collection,
      right: Collection,
    ) => {
      const inner = cartesian(left, right).filter(specification);
      const outers = sides.map(side =>
        (side === LEFT ? left : right).filter(
          (lTuple: Tuple) =>
            !inner.find((iTuple: Tuple) => lTuple.isSubset(iTuple)),
        ),
      );
      return inner.concat(...outers);
    };
  }

  public innerJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior: Behavior = (
      specification: SpecificationForMatchingTuple,
    ) => (left: Collection, right: Collection) =>
      cartesian(left, right).filter(specification);
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  public leftJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior = FromNode.outerJoinBehaviorGenerator([LEFT]);
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  public rightJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior = FromNode.outerJoinBehaviorGenerator([RIGHT]);
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  public fullJoin(dataSource: DataSource, alias: string): IncompleteJoin {
    this.checkAlias(alias);
    const behavior = FromNode.outerJoinBehaviorGenerator([LEFT, RIGHT]);
    return new IncompleteJoin(this.context, { dataSource, alias }, behavior);
  }

  public except(dataSource: DataSource): CompleteJoin {
    const alias: string = this.context.getAliases().last();
    this.context.addJoinSpec({
      aliasedDataSource: { dataSource, alias },
      joinSpec: (left: Collection, right: Collection) =>
        left.filter(lTuple => !right.contains(lTuple)),
    });
    return new CompleteJoin(this.context);
  }

  public intersect(dataSource: DataSource): CompleteJoin {
    const alias: string = this.context.getAliases().last();
    this.context.addJoinSpec({
      aliasedDataSource: { dataSource, alias },
      joinSpec: (left: Collection, right: Collection) =>
        left.filter(lTuple => right.contains(lTuple)),
    });
    return new CompleteJoin(this.context);
  }

  public union(dataSource: DataSource): CompleteJoin {
    const alias: string = this.context.getAliases().last();
    this.context.addJoinSpec({
      aliasedDataSource: { dataSource, alias },
      joinSpec: (left: Collection, right: Collection) => left.concat(right),
    });
    return new CompleteJoin(this.context);
  }

  public cartesian(dataSource: DataSource, alias: string): CompleteJoin {
    this.checkAlias(alias);
    this.context.addJoinSpec({
      aliasedDataSource: { dataSource, alias },
      joinSpec: (left: Collection, right: Collection) => cartesian(left, right),
    });
    return new CompleteJoin(this.context);
  }

  public where(whereSpec: SpecificationForMatchingTuple): Where {
    return new Where(this.context, whereSpec);
  }

  public orderBy(orderBySpec: SpecificationForOrderingTuples): OrderBy {
    return new OrderBy(this.context, orderBySpec);
  }

  private checkAlias(alias: string): void {
    invariant(
      !this.context.getAliases().includes(alias),
      `alias "${alias}" must not be used more than once`,
    );
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

class Where extends RunableStatement implements SpecStatement, OrderByable {
  specification: SpecificationForMatchingTuple;

  constructor(context: Query, specification: SpecificationForMatchingTuple) {
    super(context);
    this.specification = specification;
    this.context.setWhereSpec(this.specification);
  }

  public orderBy(orderBySpec: SpecificationForOrderingTuples): OrderBy {
    return new OrderBy(this.context, orderBySpec);
  }
}

class OrderBy extends RunableStatement implements SpecStatement {
  specification: SpecificationForOrderingTuples;

  constructor(context: Query, specification: SpecificationForOrderingTuples) {
    super(context);
    this.specification = specification;
    this.context.setOrderBySpec(this.specification);
  }
}

interface Onable {
  on(specification: SpecificationForMatchingTuple): CompleteJoin;
}

class IncompleteJoin extends Statement
  implements AliasedDataSourceStatement, Onable, SpecStatement {
  aliasedDataSource: AliasedDataSource;
  specification: SpecificationForJoiningCollections;
  private behavior: Behavior;

  constructor(
    context: Query,
    aliasedDataSource: AliasedDataSource,
    behavior: Behavior,
  ) {
    super(context);
    this.aliasedDataSource = aliasedDataSource;
    this.behavior = behavior;
  }

  public on(specification: SpecificationForMatchingTuple): CompleteJoin {
    this.specification = this.behavior(specification);
    this.context.addJoinSpec({
      aliasedDataSource: this.aliasedDataSource,
      joinSpec: this.specification,
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

  public getAliases(): List<string> {
    const aliases = List().push(this.fromSpec.alias);
    return this.joinSpec
      ? aliases.concat(this.joinSpec.map(join => join.aliasedDataSource.alias))
      : aliases;
  }

  public setSelectSpec(specification: SpecificationForTuple): void {
    this.selectSpec = specification;
  }

  public setFromSpec(specification: AliasedDataSource): void {
    this.fromSpec = specification;
  }

  public addJoinSpec(join: Join): void {
    this.joinSpec.push(join);
  }

  public setWhereSpec(specification: SpecificationForMatchingTuple): void {
    this.whereSpec = specification;
  }

  public setOrderBySpec(specification: SpecificationForOrderingTuples): void {
    this.orderBySpec = specification;
  }

  public select(selectSpec: SpecificationForTuple): Select {
    return new Select(this, selectSpec);
  }

  public from(dataSource: DataSource, alias: string): From {
    return new From(this, { dataSource, alias });
  }

  public get(): Selector {
    return this.build();
  }

  public run(state: State): Collection {
    return this.build()(state);
  }

  private dataSourceNormalizer(aliasedDataSource: AliasedDataSource): Selector {
    const getSelector = (dataSource: DataSource): Selector =>
      dataSource instanceof RunableStatement ? dataSource.get() : dataSource;

    return createSelector(
      getSelector(aliasedDataSource.dataSource),
      (collection: Collection): Collection =>
        collection.map(item => Map({ [aliasedDataSource.alias]: item })),
    );
  }

  private build(): Selector {
    invariant(
      this.fromSpec,
      'There should be one and only one From statement in your query',
    );
    let selector: Selector = this.dataSourceNormalizer(this.fromSpec);
    if (this.joinSpec && this.joinSpec.length) {
      this.joinSpec.forEach(
        ({ aliasedDataSource, joinSpec }) =>
          (selector = createSelector(
            selector,
            this.dataSourceNormalizer(aliasedDataSource),
            joinSpec,
          )),
      );
    }
    if (this.selectSpec) {
      selector = createSelector(
        selector,
        collection => collection.map(this.selectSpec),
      );
    }
    if (this.whereSpec) {
      selector = createSelector(
        selector,
        collection => collection.filter(this.whereSpec),
      );
    }
    if (this.orderBySpec) {
      selector = createSelector(
        selector,
        collection => collection.sort(this.orderBySpec),
      );
    }
    return selector;
  }
}

class Select extends Statement implements Fromable, SpecStatement {
  specification: SpecificationForTuple;

  constructor(context: Query, specification: SpecificationForTuple) {
    super(context);
    this.specification = specification;
    this.context.setSelectSpec(this.specification);
  }

  public from(dataSource: DataSource, alias: string): From {
    return new From(this.context, { dataSource, alias });
  }
}

export default Query;
export { Tuple, State, Collection };
