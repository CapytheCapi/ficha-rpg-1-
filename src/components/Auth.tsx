import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
  border-radius: 10px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
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
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const Error = styled.div`
  color: #ff4444;
  margin-top: 10px;
  text-align: center;
`;

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/characters');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/characters');
      }
    } catch (err: any) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Title>{isLogin ? 'Login' : 'Criar Conta'}</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Registrar')}
        </Button>
        <Button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: '#666' }}
          disabled={isLoading}
        >
          {isLogin ? 'Criar nova conta' : 'Já tenho uma conta'}
        </Button>
        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
};

export default Auth; 