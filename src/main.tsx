import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.tsx'

window.addEventListener('unhandledrejection', (event) => {
  console.error('Sem tratamento global:', event.reason);
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
} catch (e) {
  console.error('Erro fatal na inicialização:', e);
  document.body.innerHTML = '<div style="color:white;text-align:center;padding:50px"><h1>Erro Fatal</h1><p>Recarregue a página.</p></div>';
}
