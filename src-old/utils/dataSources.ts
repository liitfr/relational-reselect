import { createSelector } from "reselect";
import { Map } from "immutable";

import { AliasedDataSource, Collection, DataSource, Selector } from "./types";

import { RunableStatement } from "../Statement";

const getSelector = (dataSource: DataSource): Selector =>
  dataSource instanceof RunableStatement ? dataSource.get() : dataSource;

const normalizer = (aliasedDataSource: AliasedDataSource): Selector =>
  createSelector(
    getSelector(aliasedDataSource.dataSource),
    (collection: Collection): Collection =>
      collection.map(item => Map({ [aliasedDataSource.alias]: item }))
  );

export { getSelector, normalizer };
