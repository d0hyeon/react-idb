
import { CreateIDBOptions, CreateIDBOptionWithoutAutoBatch, CreateIDBOptionsWithAutoBatch, ObjectStoreMap } from '../types';
import { createIDB, DEFAULT_OPTIONS } from './createIDB';

export interface InitializeDatabase {
  name: string;
  creatingDatabase: Promise<IDBDatabase>;
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

export function createDatabase (spec: CreateDatabaseSpec): InitializeDatabase {
  const { name, objectStores, ...rest } = spec
  const options = isCreateIDBOptions(rest) ? rest : DEFAULT_OPTIONS
  
  return {
    name,
    creatingDatabase: createIDB(name, objectStores, options),
  }
}