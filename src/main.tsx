import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './components.css'
import './redesign.css'
import { setupPwaUpdate } from './lib/pwa-update'
import { setupKeyboardClass } from './lib/keyboard'

const root = ReactDOM.createRoot(document.getElementById('root')!)

function render(update?: () => void) {
  root.render(
    <React.StrictMode>
      <App onApplyUpdate={update} />
    </React.StrictMode>,
  )
}

setupKeyboardClass()
render()
void setupPwaUpdate((apply) => render(apply))
