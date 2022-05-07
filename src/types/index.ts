export type ObjectStoreMap = {
  [key: string]: {
    indexs: string[]
    uniqueIndexs?: string[]
    keyPath?: string; 
    autoIncrement?: boolean;
  }
}

export interface IndexOption { 
  keyPath: string;
  unique?: boolean; 
  multiEntry?: boolean;
}

export interface SpecObjectStore {
  autoIncrement?: boolean;
  keyPath?: string;
  index: {
    [key: string]: IndexOption
  }
}

export interface AutoBatchOptions {
  blackStoreList?: string[]  
}

export interface CreateIDBOptionsWithAutoBatch {
  autoBatch: AutoBatchOptions | true
}
export interface CreateIDBOptionWithoutAutoBatch {
  version: number;
  autoBatch?: false
}

export type CreateIDBOptions = CreateIDBOptionWithoutAutoBatch | CreateIDBOptionsWithAutoBatch