import { ObjectStoreSpec } from "../types"

export function getCreatedStoreNames (db: IDBDatabase, storeSpecs: ObjectStoreSpec[]) {
  const createdObjectStores: string[] = []
  
  storeSpecs.forEach(({ name }) => {
    if(!db.objectStoreNames.contains(name)) {
      createdObjectStores.push(name)
    }
  })

  return createdObjectStores
}

export function getDeletedStoreNames (db: IDBDatabase, storeSpecs: ObjectStoreSpec[]) {
  let idx = 0
  const names = storeSpecs.map(store => store.name)
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

export async function createIDB(
  name: string, 
  storeSpecs: ObjectStoreSpec[], 
  _version?: number,
  _autoBatch?: boolean
): Promise<IDBDatabase> {
  const autoBatch = _autoBatch ?? !!_version
  const version = _version ?? await getVersionIDB(name)
  return new Promise((resolve, reject) => {
    const IDBOpenRequest = indexedDB.open(name, version)

    IDBOpenRequest.onsuccess = () => {
      const db = IDBOpenRequest.result
      if(autoBatch) {
        const createdStoreNames = getCreatedStoreNames(db, storeSpecs)
        const deletedStoreNames = getDeletedStoreNames(db, storeSpecs)
        
        if(createdStoreNames.length || deletedStoreNames.length) {
          return createIDB(name, storeSpecs, version + 1, autoBatch)
        }
        
        for(let i = 0, leng = storeSpecs.length; i < leng; i++) {
          const spec = storeSpecs[i]
          const objectStore = db.transaction(spec.name, 'readonly').objectStore(spec.name)
          const createIndexs = getCreatedIndexNames(objectStore, spec.indexs)
          const deleteIndexs = getDeletedIndexNames(objectStore, spec.indexs)

          if(createIndexs.length || deleteIndexs.length) {
            return createIDB(name, storeSpecs, version + 1, autoBatch)
          }
        }
      }
      resolve(IDBOpenRequest.result)
    }
    IDBOpenRequest.onupgradeneeded = (event) => {
      const db = IDBOpenRequest.result
      const deletedStoreNames = getDeletedStoreNames(db, storeSpecs)
      const createdStoreNames = getCreatedStoreNames(db, storeSpecs)

      storeSpecs.forEach(({ name, indexs, uniqueIndexs, keyPath, autoIncrement }) => {
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