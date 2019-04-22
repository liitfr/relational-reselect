import { createSelector } from "reselect";

import { normalizer } from "./utils/dataSources";
import {
  AliasedDataSource,
  DataSource,
  Join,
  Selector,
  State,
  Collection,
  SpecificationForTuple
} from "./utils/types";

import From from "./From";
import Fromable from "./Fromable";
import Runable from "./Runable";
import Select from "./Select";
import Selectable from "./Selectable";
import { List } from "immutable";

class Query implements Fromable, Runable, Selectable {
  private selectSpec: SpecificationForTuple;
  private fromSpec: AliasedDataSource;
  private joinSpec: Join[];

  // ----------------------------------------------------
  // Getters
  // ----------------------------------------------------

  getAliases(): List<string> {
    return List()
      .push(this.fromSpec.alias)
      .push(this.joinSpec.map(join => join.aliasedDataSource.alias));
  }

  // ----------------------------------------------------
  // Setters
  // ----------------------------------------------------

  setSelectSpec(specification: SpecificationForTuple) {
    this.selectSpec = specification;
  }

  setFromSpec(specification: AliasedDataSource) {
    this.fromSpec = specification;
  }

  addJoinSpec(join: Join) {
    this.joinSpec.push(join);
  }

  // ----------------------------------------------------
  // Statements
  // ----------------------------------------------------

  select(selectSpec: SpecificationForTuple) {
    return new Select(this, selectSpec);
  }

  from(dataSource: DataSource, alias: string) {
    return new From(this, { dataSource, alias });
  }

  // ----------------------------------------------------
  // commands
  // ----------------------------------------------------

  build() {
    let selector: Selector = () => List();
    if (this.fromSpec) {
      selector = normalizer(this.fromSpec);
    }
    if (this.selectSpec) {
      selector = createSelector(
        selector,
        collection => collection.map(this.selectSpec)
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

export default Query;
