import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'


createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="dev-ksti8ah1bi3ygj1k.us.auth0.com"
      clientId="b0zWOQAhMycakIlrDKIOBAKooOOzTJw8"
      authorizationParams={{
        audience: "https://dev-ksti8ah1bi3ygj1k.us.auth0.com/api/v2/",
        redirect_uri: window.location.origin
      }}
    >
    <App />
  </Auth0Provider>,
)