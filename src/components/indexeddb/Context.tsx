import { createContext } from "react"; 

export interface ContextState {
  pending: boolean
  version: number | null
  dbName: string| null
  database: IDBDatabase | null
}

export const INITIAL_STATE: ContextState = {
  pending: true,
  version: null,
  dbName: null,
  database: null
}

export  const idbContext = createContext<ContextState>(INITIAL_STATE)