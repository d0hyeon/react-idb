export interface ObjectStoreSpec {
  name: string;
  indexs: string[]
  uniqueIndexs?: string[]
  keyPath?: string; 
  autoIncrement?:boolean
}