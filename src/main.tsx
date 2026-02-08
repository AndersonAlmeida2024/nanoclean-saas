import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('unhandledrejection', (event) => {
  console.error('Sem tratamento global:', event.reason);
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e) {
  console.error('Erro fatal na inicialização:', e);
  document.body.innerHTML = '<div style="color:white;text-align:center;padding:50px"><h1>Erro Fatal</h1><p>Recarregue a página.</p></div>';
}
