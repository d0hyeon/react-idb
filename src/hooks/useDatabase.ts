import { InitializeDatabase } from "../utils/createDatabase";
import { useContext, useEffect, useMemo } from 'react';
import { idbContext } from "../components/indexeddb/Context";
import { useState } from 'react';
import { TypedObjectStoreIDBDatabase } from "../utils/createIDB";

interface UseDatabaseCommon {
  name: string;
}

interface UseDatabasePendingApi extends UseDatabaseCommon {
  pending: true;
  database: null;
}

interface UseDatabaseApi<T = unknown> extends UseDatabaseCommon {
  pending: false;
  database: TypedObjectStoreIDBDatabase<T>
}
export interface UseSuspenseApi<T = unknown> {
  read: () => UseDatabaseApi<T>
}

export type UseDatabase = (InitializeDatabase: InitializeDatabase) =>  UseDatabaseApi | UseDatabasePendingApi
export type UseSuspenseDatabase = (InitializeDatabase: InitializeDatabase) =>  UseSuspenseApi

function wrapPromise<T extends unknown> (promise: Promise<T>) {
  let status = "pending";
  let result: T;
  let suspender = promise.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
    }
  };
}

export function useSuspenseDatabase<T> (initializeDatabase: InitializeDatabase<T>) {
  const { getDatabase, registerDatabase } = useContext(idbContext)
  const { name } = initializeDatabase
  const promise = useMemo(() => {
    return new Promise(async (resolve) => {
      const registeredDatabase = getDatabase(name)
      if(registeredDatabase) {
        return resolve({
          name,
          pending: false,
          database: registeredDatabase
        })
      }
      const database = await registerDatabase(initializeDatabase)
      resolve({
        name,
        pending: false,
        database
      })
      
    })
  }, [initializeDatabase, registerDatabase])  

  return useMemo(() => wrapPromise(promise) as UseSuspenseApi<T>, [promise])
}

export function useDatabase<T>(initializeDatabase: InitializeDatabase<T>) {
  const { name } = initializeDatabase
  const { getDatabase, registerDatabase } = useContext(idbContext)

  const registedDatabase = useMemo(() => getDatabase(name) as TypedObjectStoreIDBDatabase<T>, [name, getDatabase])
  const [database, setDatabase] = useState<TypedObjectStoreIDBDatabase<T> | null>(registedDatabase)
  const pending = useMemo(() => !database, [database])
  
  useEffect(() => {
    if(!database) {
      registerDatabase(initializeDatabase)
        .then(setDatabase)
    }
  }, [initializeDatabase, database, registerDatabase, setDatabase])

  
  if(database) {
    return {
      name,
      pending,
      database
    } 
  }
  return {
    name,
    pending,
    database,
    transaction: null
  } as UseDatabasePendingApi
}
