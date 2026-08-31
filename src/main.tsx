import React from 'react'
import ReactDOM from 'react-dom/client'
import { startUpdates } from './lib/pwa'
import App from './App'
import './styles.css'
import './styles-chrono.css'

startUpdates()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
