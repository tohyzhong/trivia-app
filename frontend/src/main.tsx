import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.js'
import React from 'react'

const root = document.getElementById('root') as HTMLElement
if (root !== null) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}