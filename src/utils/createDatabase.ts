
import { CreateIDBOptions, CreateIDBOptionWithoutAutoBatch, CreateIDBOptionsWithAutoBatch, ObjectStoreMap } from '../types';
import { createIDB, DEFAULT_OPTIONS, TypedObjectStoreIDBDatabase } from './createIDB';

export interface InitializeDatabase<T = unknown> {
  name: string;
  creatingDatabase: Promise<TypedObjectStoreIDBDatabase<T>>;
}

type CreateDatabaseSpec = {
  name: string;
  objectStores: ObjectStoreMap
} & (CreateIDBOptions | {})

function isCreateIDBOptions (options: unknown): options is CreateIDBOptions {
  if(
    options instanceof Object && 
    (options as CreateIDBOptionWithoutAutoBatch).version || (options as CreateIDBOptionsWithAutoBatch).autoBatch
  ) {
  }
  return false
}

export function createDatabase <T>(spec: CreateDatabaseSpec): InitializeDatabase<T> {
  const { name, objectStores, ...rest } = spec
  const options = isCreateIDBOptions(rest) ? rest : DEFAULT_OPTIONS
  
  return {
    name,
    creatingDatabase: createIDB<T>(name, objectStores, options),
  }
}