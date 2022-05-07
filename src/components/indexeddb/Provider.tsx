import { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InitializeDatabase } from "../../utils/createDatabase";
import { TypedObjectStoreIDBDatabase } from "../../utils/createIDB";
import { ContextState, idbContext } from "./Context";

interface DatabaseMap {
  [key: string]: TypedObjectStoreIDBDatabase
}

const Provider: FC<{isSuspense?: ContextState['isSuspense']}> = ({ 
  isSuspense = false,
  children, 
}) => {
  const [databaseMap, setDatabaseMap] = useState<DatabaseMap>({})
  const databaseMapRef = useRef<DatabaseMap>({})
  const pendingDatabaseMapRef = useRef<Record<string, Promise<TypedObjectStoreIDBDatabase>>>({})

  useEffect(() => {
    databaseMapRef.current = databaseMap
  }, [databaseMap, databaseMapRef])

  const registerDatabase = useCallback((initiDatabase: InitializeDatabase) => {
    const {name, creatingDatabase} = initiDatabase

    if(!!databaseMapRef.current[name]) {
      return Promise.resolve(databaseMapRef.current[name])
    }

    if(!!pendingDatabaseMapRef.current[name]) {
      return pendingDatabaseMapRef.current[name]
    }

    return new Promise((resolve) => {
      pendingDatabaseMapRef.current[name] = creatingDatabase
      creatingDatabase.then((database: TypedObjectStoreIDBDatabase) => {
        setDatabaseMap(curr => ({
          ...curr,
          [name]: database
        }))
        delete pendingDatabaseMapRef.current[name]
        resolve(database)
      })
    })
  }, [setDatabaseMap, databaseMapRef, pendingDatabaseMapRef])
  

  const getDatabase = useCallback((name) => {
    return databaseMapRef.current[name] ?? null
  }, [databaseMapRef])

  const getPendingDatabases = useCallback(() => {
    return pendingDatabaseMapRef.current
  }, [pendingDatabaseMapRef])

  const contextValue = useMemo<ContextState>(() => ({
    // @ts-ignore
    registerDatabase,
    getDatabase,
    getPendingDatabases,
    isSuspense
  }), [isSuspense, registerDatabase, getDatabase, getPendingDatabases])

  return (
    <idbContext.Provider value={contextValue}>
      {isSuspense ? (
        <Suspense fallback="">
          {children}
        </Suspense>
      ) : children}
    </idbContext.Provider>
  )
}

export default Provider