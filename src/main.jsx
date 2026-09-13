import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )

  // Style logging script
  setTimeout(() => {
    const logStyle = (selector) => {
      const el = document.querySelector(selector);
      if (!el) {
        console.log(`STYLE_REPORT:${selector}:not_found`);
        return;
      }
      const style = window.getComputedStyle(el);
      console.log(`STYLE_REPORT:${selector}:` + JSON.stringify({
        clientWidth: el.clientWidth,
        offsetLeft: el.offsetLeft,
        width: style.width,
        maxWidth: style.maxWidth,
        margin: style.margin,
        padding: style.padding,
        position: style.position,
        overflow: style.overflow,
      }));
    };
    ['html', 'body', '#root', 'header', 'main', 'input'].forEach(logStyle);
  }, 2000);
})

