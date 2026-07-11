import { useEffect, useState } from 'react'
import App from './App'
import { LandingPage } from './landing/LandingPage'

function currentRoute(): string {
  return window.location.hash.replace(/^#\/?/, '')
}

// Hash routing keeps GitHub Pages happy (no server rewrites): the landing page is the
// homepage, and the posing studio lives at #/app.
export default function Root() {
  const [route, setRoute] = useState(currentRoute())

  useEffect(() => {
    const onHash = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route === 'app' ? <App /> : <LandingPage />
}
