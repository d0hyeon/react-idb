import { CreateIDBOptions, CreateIDBOptionsWithAutoBatch, CreateIDBOptionWithoutAutoBatch, ObjectStoreMap } from "../types"

export function getCreatedStoreNames (db: IDBDatabase, storeMap: ObjectStoreMap) {
  const createdObjectStores: string[] = []
  
  Object.keys(storeMap).forEach((name) => {
    if(!db.objectStoreNames.contains(name)) {
      createdObjectStores.push(name)
    }
  })

  return createdObjectStores
}

export function getDeletedStoreNames (db: IDBDatabase, storeMap: ObjectStoreMap) {
  let idx = 0
  const names = Object.keys(storeMap)
  const deletedObjectStores = []

  while(true) {
    const curr = db.objectStoreNames.item(idx)
    if(curr === null) {
      break
    } 
    if(!names.includes(curr)) {
      deletedObjectStores.push(curr)
    }
    idx ++
  } 

  return deletedObjectStores
}

export function getCreatedIndexNames (objectStore: IDBObjectStore, indexes: string[]) {
  const createdIndexNames: string[] = []  
  indexes.forEach((index) => {
    if(!objectStore.indexNames.contains(index)) {
      createdIndexNames.push(index)
    }
  })
  return createdIndexNames
}

export function getDeletedIndexNames(objectStore: IDBObjectStore, indexs: string[]) {
  const deletedIndexNames = []
  let idx = 0;
  while(true) {
    const curr = objectStore.indexNames.item(idx);
    if(curr === null) {
      break;
    }
    if(!indexs.includes(curr)) {
      deletedIndexNames.push(curr);
    }
    idx ++;
  }
  return deletedIndexNames
}

export function getVersionIDB (name: string): Promise<number> {
  return new Promise(async (resolve, reject) => {
    const databases = await indexedDB.databases()
    const target = databases.filter(database => database.name === name)[0]
    if(target) {
      resolve(target.version ?? 1)
    } else {
      resolve(1)
    }
  })
} 


export const DEFAULT_OPTIONS: CreateIDBOptionsWithAutoBatch = {
  autoBatch: true
}

export type TypedObjectStore<S = unknown> = Omit<IDBObjectStore, 'add' | 'put' | 'createIndex' | 'deleteIndex'> & {
  add (value: S, key?: IDBValidKey): IDBRequest<IDBValidKey>;
  put (value: S, key?: IDBValidKey): IDBRequest<IDBValidKey>;
}

export type TypedIDBTransaction<Scheme> = {
  objectStore: (storeName: keyof Scheme) => TypedObjectStore<Scheme[typeof storeName]>
}

export type TypedObjectStoreIDBDatabase<T = unknown> = Omit<IDBDatabase, 'transaction'> & {
  transaction: (storeName: keyof T, mode: IDBTransactionMode) => TypedIDBTransaction<T>
}
export async function createIDB<T>(
  databaseName: string, 
  storeMap: ObjectStoreMap, 
  options: CreateIDBOptions = DEFAULT_OPTIONS
): Promise<TypedObjectStoreIDBDatabase<T>> {
  const { autoBatch } = options
  const version = options?.autoBatch 
    ? await getVersionIDB(databaseName) 
    : (options as CreateIDBOptionWithoutAutoBatch).version
  const blackStoreList = autoBatch && typeof autoBatch === 'object'
    ? autoBatch.blackStoreList
    : null

  function getDatabaseByVersion (databaseName: string, storeMap: ObjectStoreMap, version: number): Promise<TypedObjectStoreIDBDatabase<T>> {
    return new Promise((resolve, reject) => {
      const IDBOpenRequest = indexedDB.open(databaseName, version)
  
      IDBOpenRequest.onsuccess = () => {
        const db = IDBOpenRequest.result
        if(autoBatch) {
          let createdStoreNames = getCreatedStoreNames(db, storeMap)
          let deletedStoreNames = getDeletedStoreNames(db, storeMap)

          if(blackStoreList && blackStoreList.length) {
            createdStoreNames = createdStoreNames.filter(value => blackStoreList.includes(value))
            deletedStoreNames = deletedStoreNames.filter(value => blackStoreList.includes(value))
          }
          
          if(createdStoreNames.length || deletedStoreNames.length) {
            return getDatabaseByVersion(databaseName, storeMap, version + 1)
          }
          const objectStoreKeys = Object.keys(storeMap)
          for(let i = 0, leng = objectStoreKeys.length; i < leng; i++) {
            const key = objectStoreKeys[i]
            const spec = storeMap[key]
            if(blackStoreList?.includes(objectStoreKeys[i])) {
              continue
            }
            const objectStore = db.transaction(key, 'readonly').objectStore(key)
            const createIndexs = getCreatedIndexNames(objectStore, spec.indexs)
            const deleteIndexs = getDeletedIndexNames(objectStore, spec.indexs)

            if(createIndexs.length || deleteIndexs.length) {
              console.log('하이')
              return getDatabaseByVersion(databaseName, storeMap, version + 1)
            }
          }
        }
        
        resolve(db as TypedObjectStoreIDBDatabase<T>)
      }
      IDBOpenRequest.onupgradeneeded = (event) => {
        const db = IDBOpenRequest.result
        const deletedStoreNames = getDeletedStoreNames(db, storeMap)
        const createdStoreNames = getCreatedStoreNames(db, storeMap)
  
        Object.keys(storeMap).forEach((name) => {
          const { indexs, uniqueIndexs, keyPath, autoIncrement } = storeMap[name]
          const didCreateStore = createdStoreNames.includes(name)
          if(didCreateStore) {
            const newStore = db.createObjectStore(name, { keyPath, autoIncrement })
            indexs.forEach((index) => {
              newStore.createIndex(index, index, { unique: uniqueIndexs?.includes(index) })
            })
          } else {
            // @ts-ignore
            const objectStore = event.target.transaction.objectStore(name)
            const createIndexs = getCreatedIndexNames(objectStore, indexs)
            const deleteIndexs = getDeletedIndexNames(objectStore, indexs)
  
            createIndexs.forEach((index) => {
              objectStore.createIndex(index, index, { unique: uniqueIndexs?.includes(index) })
            })
            deleteIndexs.forEach((index) => {
              objectStore.deleteIndex(index)
            })
          }
        })
        deletedStoreNames.forEach(store => {
          db.deleteObjectStore(store)
        })
      }
      IDBOpenRequest.onerror = (error) => reject(error)
    })
  }

  return getDatabaseByVersion(databaseName, storeMap, version)
}