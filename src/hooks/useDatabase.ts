import { InitializeDatabase } from "../utils/createDatabase";
import { useContext, useEffect, useMemo } from 'react';
import { idbContext } from "../components/indexeddb/Context";
import { useState } from 'react';

interface UseDatabaseCommon {
  name: string;
}

interface UseDatabasePendingApi extends UseDatabaseCommon {
  pending: true;
  database: null;
}

interface UseDatabaseApi extends UseDatabaseCommon {
  pending: false;
  database: IDBDatabase
}
export interface UseSuspenseApi {
  read: () => UseDatabaseApi
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

export function useSuspenseDatabase (initializeDatabase: InitializeDatabase): UseSuspenseApi {
  const { registerDatabase } = useContext(idbContext)
  const { name } = initializeDatabase
  const promise = useMemo<Promise<UseDatabaseApi>>(() => {
    return new Promise(async (resolve) => {
      const database = await registerDatabase(initializeDatabase)
      resolve({
        name,
        pending: false,
        database
      })
    })
  }, [initializeDatabase, registerDatabase])  

  return useMemo(() => wrapPromise(promise) as UseSuspenseApi, [promise])
}

export function useDatabase(initializeDatabase: InitializeDatabase) {
  const { name } = initializeDatabase
  const { getDatabase, registerDatabase } = useContext(idbContext)

  const registedDatabase = useMemo(() => getDatabase(name), [name, getDatabase])
  const [database, setDatabase] = useState<IDBDatabase | null>(registedDatabase)
  const pending = useMemo(() => !database, [database])

  useEffect(() => {
    if(!database) {
      registerDatabase(initializeDatabase)
        .then(setDatabase)
    }
  }, [initializeDatabase, database, registerDatabase, setDatabase])

  
  if(database) {
    return {
      name: initializeDatabase.name,
      pending,
      database
    } 
  }
  return {
    name: initializeDatabase.name,
    pending,
    database,
    transaction: null
  } as UseDatabasePendingApi
}
