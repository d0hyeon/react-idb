
import { CreateIDBOptions, CreateIDBOptionWithoutAutoBatch, CreateIDBOptionsWithAutoBatch } from '../types';
import { createIDB, DEFAULT_OPTIONS, TypedObjectStoreIDBDatabase } from './createIDB';

export interface InitializeDatabase<T = unknown> {
  name: string;
  creatingDatabase: Promise<TypedObjectStoreIDBDatabase<T>>;
}

type ObjectStoreMap<T> = {
  [key in keyof T]: {
    indexs: Array<keyof T[key]>;
    uniqueIndexs?: Array<keyof T[key]>;
    keyPath?: keyof T[key];
    autoIncrement?: boolean;
  }
}

type CreateDatabaseSpec<T> = {
  name: string;
  defineObjectStore: ObjectStoreMap<T>
} & (CreateIDBOptions | {})

function isCreateIDBOptions (options: unknown): options is CreateIDBOptions {
  if(
    options instanceof Object && 
    (options as CreateIDBOptionWithoutAutoBatch).version || (options as CreateIDBOptionsWithAutoBatch).autoBatch
  ) {
  }
  return false
}

export function createDatabase <T>(spec: CreateDatabaseSpec<T>): InitializeDatabase<T> {
  const { name, defineObjectStore, ...rest } = spec
  const options = isCreateIDBOptions(rest) ? rest : DEFAULT_OPTIONS
  
  return {
    name,
    // @ts-ignore
    creatingDatabase: createIDB<T>(name, objectStores, options),
  }
}