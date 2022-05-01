import { FC, useEffect, useMemo, useState } from "react";
import { createIDB } from "../../utils/idb";
import { ContextState, idbContext, INITIAL_STATE } from "./Context";

interface ObjectStore {
  name: string;
  indexs: string[]
  uniqueIndexs?: string[]
  keyPath?: string; 
  autoIncrement?:boolean
}


interface ProviderProps {
  dbName: string;
  declareStores: ObjectStore[];
  version?: number;
}

const Provider: FC<ProviderProps> = ({ 
  dbName,
  declareStores,
  version,
  children, 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    createIDB(dbName, declareStores, version)
      .then(setDb)
  }, [version, setDb])

  useEffect(() => {
    if(db) {
      setIsLoading(true)
    }
  }, [db, version, setIsLoading])

  const contextValue = useMemo<ContextState>(() => {
    if(isLoading) {
      return INITIAL_STATE
    }
    return {
      version,
      dbName,
      database: db
    } as ContextState
  }, [dbName, isLoading])

  return (
    <idbContext.Provider value={contextValue}>
      {children}
    </idbContext.Provider>
  )
}

export default Provider