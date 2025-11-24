import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import WelcomePage from './pages/WelcomePage/WelcomePage.jsx';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import AccountPage from './pages/AccountPage/AccountPage.jsx';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx';
import PlaylistsPage from './pages/PlaylistsPage/PlaylistsPage.jsx';
import PlaylistPage from './pages/PlaylistPage/PlaylistPage.jsx';
import TopArtistsPage from './pages/TopArtistsPage/TopArtistsPage.jsx';
import TopTracksPage from './pages/TopTracksPage/TopTracksPage.jsx';
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx';
import Callback from './pages/Callback.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WelcomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="callback" element={<Callback />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="playlist/:id" element={<PlaylistPage />} />
          <Route path="top-artists" element={<TopArtistsPage />} />
          <Route path="top-tracks" element={<TopTracksPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
            
        </Route>
      </Routes>
    </Router>
  );
}

export default App;