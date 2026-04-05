import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Auto dark mode based on system preference
const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark);
};
const mq = window.matchMedia('(prefers-color-scheme: dark)');
applyTheme(mq.matches);
mq.addEventListener('change', (e) => applyTheme(e.matches));

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)