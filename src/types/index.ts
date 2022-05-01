export interface ObjectStoreSpec {
  name: string;
  indexs: string[]
  uniqueIndexs?: string[]
  keyPath?: string; 
  autoIncrement?: boolean;
}

export interface CreateIDBOptionWithoutAutoVersion {
  version: number;
  autoVersioning?: false
}
export interface CreateIDBOptionsWithAutoVersion {
  autoVersioning: {
    blackStoreList: string[]
  } | true
}

export type CreateIDBOptions = CreateIDBOptionWithoutAutoVersion | CreateIDBOptionsWithAutoVersion