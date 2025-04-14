import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import CharacterSheet from './components/CharacterSheet';
import CharacterList from './components/CharacterList';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #121212;
  color: white;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #121212;
  color: white;
`;

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <LoadingContainer>
        <div>Carregando...</div>
      </LoadingContainer>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <LoadingContainer>
        <div>Carregando...</div>
      </LoadingContainer>
    );
  }

  return (
    <Router>
      <AppContainer>
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/characters" /> : <Auth />} 
          />
          <Route
            path="/characters"
            element={
              <PrivateRoute>
                <CharacterList />
              </PrivateRoute>
            }
          />
          <Route
            path="/character/:id"
            element={
              <PrivateRoute>
                <CharacterSheet />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/characters" : "/login"} replace />}
          />
        </Routes>
      </AppContainer>
    </Router>
  );
};

export default App; 