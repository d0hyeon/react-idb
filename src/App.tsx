import React, { FC, Suspense } from 'react';
import logo from './logo.svg';
import './App.css';
import Provider from './components/indexeddb/Provider'
import { createDatabase } from './utils/createDatabase';
import { useDatabase, UseSuspenseApi, useSuspenseDatabase } from './hooks/useDatabase';
import { useEffect } from 'react';


interface User {
  id: string
  name: string;
  nick: string
}
interface AppDatabaseScheme {
  post: {
    id: string;
    title: string;
    contents: string;
    createdAt: Date
    user: User
  }
  users: User
}

const myDatabase = createDatabase<AppDatabaseScheme>({
  name: 'myDatabase', 
  defineObjectStore: {
    post: {
      keyPath: 'id',
      indexs: ['id', 'contents', 'title', 'createdAt', 'user'],
    },
    users: {
      indexs: ['id', 'name', 'nick'],
      keyPath: 'id',
    }
  }
})

const SuspenseChildrenComponent: FC<{databaseStream: UseSuspenseApi<AppDatabaseScheme>}> = ({ databaseStream }) => {
  const { database } = databaseStream.read()
  useEffect(() => {
    const objectStore = database.transaction('post', 'readwrite').objectStore('post')
    const request = objectStore.getAll()
    request.onsuccess = () => {
      console.log(request.result)
    }
    
  }, [database])
  
  return (
    <Suspense fallback>
      <div>
        Children!
      </div>
    </Suspense>
  )
}

const MyComponent = () => {
  const databaseStream = useSuspenseDatabase(myDatabase)
  const { database, name, pending } = useDatabase(myDatabase)

  useEffect(() => {
    if(!pending) {
      const transaction = database.transaction('post', 'readonly')
      const objectStore = transaction.objectStore('post')
      const request = objectStore.getAll()
      request.onsuccess = () => {
        console.log(request.result)
      }
    }
  }, [database, name, pending])

  return (
    <Suspense fallback="fallback">
      <SuspenseChildrenComponent databaseStream={databaseStream} />
    </Suspense>
  )
}

function App() {
  return (
    <Provider isSuspense={true}>
      <div className="App">
      <header className="App-header">
        <Suspense fallback={'loading...'}>
          <MyComponent />
        </Suspense>
        
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
    </Provider>
  );
}

export default App;
