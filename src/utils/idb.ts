import { ObjectStoreSpec } from "../types"

export function getCreateStoreNames (db: IDBDatabase, storeSpecs: ObjectStoreSpec[]) {
  const createdObjectStores: string[] = []
  
  storeSpecs.forEach(({ name }) => {
    if(!db.objectStoreNames.contains(name)) {
      createdObjectStores.push(name)
    }
  })

  return createdObjectStores
}

export function getDeleteStoreNames (db: IDBDatabase, storeSpecs: ObjectStoreSpec[]) {
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

export function getCreateIndexNames (objectStore: IDBObjectStore, indexes: string[]) {
  const createIndexNames: string[] = []  
  indexes.forEach((index) => {
    if(!objectStore.indexNames.contains(index)) {
      createIndexNames.push(index)
    }
  })
  return createIndexNames
}

export function getDeleteIndexNames(objectStore: IDBObjectStore, indexs: string[]) {
  const deleteIndexNames = []
  let idx = 0;
  while(true) {
    const curr = objectStore.indexNames.item(idx);
    if(curr === null) {
      break;
    }
    if(!indexs.includes(curr)) {
      deleteIndexNames.push(curr);
    }
    idx ++;
  }
  return deleteIndexNames
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
        const createdStoreNames = getCreateStoreNames(db, storeSpecs)
        const deletedStoreNames = getDeleteStoreNames(db, storeSpecs)
        
        if(createdStoreNames.length || deletedStoreNames.length) {
          return createIDB(name, storeSpecs, version + 1, autoBatch)
        }
        
        for(let i = 0, leng = storeSpecs.length; i < leng; i++) {
          const spec = storeSpecs[i]
          const objectStore = db.transaction(spec.name, 'readonly').objectStore(spec.name)
          const createIndexs = getCreateIndexNames(objectStore, spec.indexs)
          const deleteIndexs = getDeleteIndexNames(objectStore, spec.indexs)

          if(createIndexs.length || deleteIndexs.length) {
            return createIDB(name, storeSpecs, version + 1, autoBatch)
          }
        }
      }
      resolve(IDBOpenRequest.result)
    }
    IDBOpenRequest.onupgradeneeded = (event) => {
      const db = IDBOpenRequest.result
      const deletedStoreNames = getDeleteStoreNames(db, storeSpecs)
      const createdStoreNames = getCreateStoreNames(db, storeSpecs)

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
          const createIndexs = getCreateIndexNames(objectStore, indexs)
          const deleteIndexs = getDeleteIndexNames(objectStore, indexs)

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