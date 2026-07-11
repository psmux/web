import './App.css'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Features from './components/Features'
import TrustedBy from './components/TrustedBy'
import WorldMap from './components/WorldMap'
import NotableUsers from './components/NotableUsers'
import Contributors from './components/Contributors'
import Universities from './components/Universities'
import Ecosystem from './components/Ecosystem'
import Install from './components/Install'
import Keybindings from './components/Keybindings'
import CrossRepo from './components/CrossRepo'
import Footer from './components/Footer'

function App() {
  return (
    <div className="app">
      <Hero />
      <Stats />
      <div className="divider" />
      <Features />
      <div className="divider" />
      <TrustedBy />
      <div className="divider" />
      <WorldMap />
      <div className="divider" />
      <NotableUsers />
      <div className="divider" />
      <Contributors />
      <div className="divider" />
      <Universities />
      <div className="divider" />
      <Install />
      <div className="divider" />
      <Keybindings />
      <div className="divider" />
      <Ecosystem />
      <div className="divider" />
      <CrossRepo />
      <div className="divider" />
      <Footer />
    </div>
  )
}

export default App
