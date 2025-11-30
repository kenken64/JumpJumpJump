/**
 * @fileoverview Application Entry Point
 * 
 * Bootstraps the React application by rendering the App component
 * into the root DOM element. Uses React 18's createRoot API.
 * 
 * @module main
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

/** Initialize React app on root element */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
