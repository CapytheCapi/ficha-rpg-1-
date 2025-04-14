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

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContainer>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route
            path="/"
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
        </Routes>
      </AppContainer>
    </Router>
  );
};

export default App; 