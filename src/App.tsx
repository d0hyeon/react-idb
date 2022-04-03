import React from 'react';
import logo from './logo.svg';
import './App.css';
import Provider from './components/indexeddb/Provider'
import { ObjectStoreSpec } from './types';

const stores: ObjectStoreSpec[] = [
  {
    name: 'object-store1',
    indexs: ['id', 'title', 'content', 'body'],
    autoIncrement: true
  }, 
  {
    name: 'object-store2',
    indexs: ['id', 'title', 'content', 'body'],
    autoIncrement: true
  },
  {
    name: 'object-store3',
    indexs: ['id', 'title', 'content', 'body', 'user'],
    autoIncrement: true
  },
  {
    name: 'object-store4',
    indexs: ['id', 'title', 'content', 'body', 'user'],
    autoIncrement: true
  }
]

function App() {
  return (
    <Provider
      dbName="db1"
      declareStores={stores}
    >
      <div className="App">
      <header className="App-header">
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
