import { createContext } from "react"; 
import { InitializeDatabase } from "../../utils/createDatabase";

export interface ContextState {
  registerDatabase: (database: InitializeDatabase) => Promise<IDBDatabase>
  getDatabase: (name: string) => IDBDatabase | null
  isSuspense: boolean
}

export const INITIAL_STATE: ContextState = {
  registerDatabase: () => Promise.reject('초기화되지 않음'),
  getDatabase: () => null,
  isSuspense: false,
}

export  const idbContext = createContext<ContextState>(INITIAL_STATE)