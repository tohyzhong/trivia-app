import { BrowserRouter, Routes, Route } from "react-router-dom";
import './styles/App.css'
import NavigationBar from './components/navigationbar/NavigationBar'

import GameMainpage from './components/game/GameMainpage'
import Leaderboard from './components/leaderboard/Leaderboard'
import Settings from './components/settingspage/Settings'
import Profile from './components/profilepage/Profile'
import AboutPage from './components/about/AboutPage'
import HomePage from './components/homepage/HomePage'
import LoginPage from './components/loginpage/LoginPage'
import SignupPage from "./components/loginpage/SignupPage"
import { RootState } from './redux/store';
import { useSelector } from "react-redux";

function App() {
  const username = useSelector((state: RootState) => state.user.username);
  const Components = [
    { component: HomePage, path: '/' },
    { component: GameMainpage, path: '/play' },
    { component: Leaderboard, path: '/leaderboard' },
    { component: Settings, path: '/settings' },
    { component: Profile, path: '/profile' },
    { component: AboutPage, path: '/about' },
    { component: LoginPage, path: '/login' },
    { component: SignupPage, path: '/signup' },
  ]

  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        {Components.map((comp) => {
          const ComponentName = comp.component;

          return comp.path === '/profile'
            ? <Route path={comp.path} element={<ComponentName username={username || ''} />} />
            : <Route path={comp.path} element={<ComponentName />} />
        })}
      </Routes>
    </BrowserRouter>
  )
}

export default App;