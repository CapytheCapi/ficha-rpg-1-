import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
  border-radius: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: none;
  background: #333;
  color: white;
`;

const Button = styled.button`
  padding: 10px;
  border-radius: 5px;
  border: none;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  &:hover {
    background: #45a049;
  }
`;

const Error = styled.div`
  color: #ff4444;
  margin-top: 10px;
`;

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container>
      <h2>{isLogin ? 'Login' : 'Registro'}</h2>
      <Form onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">
          {isLogin ? 'Entrar' : 'Registrar'}
        </Button>
        <Button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: '#666' }}
        >
          {isLogin ? 'Criar nova conta' : 'Já tenho uma conta'}
        </Button>
        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
};

export default Auth; 