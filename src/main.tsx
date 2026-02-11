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
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('style', 'color:white;text-align:center;padding:50px');

  const h1 = document.createElement('h1');
  h1.textContent = 'Erro Fatal';

  const p = document.createElement('p');
  p.textContent = 'Recarregue a página.';

  errorDiv.appendChild(h1);
  errorDiv.appendChild(p);

  document.body.appendChild(errorDiv);
}
