import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom' // Импортируем

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Оборачиваем здесь */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
