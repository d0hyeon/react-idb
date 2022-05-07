import { createContext } from "react"; 
import { InitializeDatabase } from "../../utils/createDatabase";
import { TypedObjectStoreIDBDatabase } from "../../utils/createIDB";

export interface ContextState {
  registerDatabase: <T>(database: InitializeDatabase<T>) => Promise<TypedObjectStoreIDBDatabase<T>>
  getDatabase: (name: string) => TypedObjectStoreIDBDatabase | null
  isSuspense: boolean
}

export const INITIAL_STATE: ContextState = {
  registerDatabase: () => Promise.reject('초기화되지 않음'),
  getDatabase: () => null,
  isSuspense: false,
}

export  const idbContext = createContext<ContextState>(INITIAL_STATE)