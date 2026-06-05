import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SpectreAuthProvider } from '@thewhitenigs/spectre-snap'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SpectreAuthProvider
    apiKey={import.meta.env.VITE_SPECTRE_API_KEY}
    baseUrl={import.meta.env.VITE_SPECTRE_BASE_URL}
  >
    <App />
  </SpectreAuthProvider>,
)
