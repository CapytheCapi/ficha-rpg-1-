import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
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
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
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

const CancelButton = styled(Button)`
  background: #666;
  &:hover {
    background: #555;
  }
`;

interface CharacterInfo {
  name: string;
  player: string;
  origin: string;
  class: string;
}

const NewCharacter: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo>({
    name: '',
    player: '',
    origin: '',
    class: ''
  });

  const handleChange = (field: keyof CharacterInfo, value: string) => {
    setCharacterInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || isCreating) return;

    setIsCreating(true);
    try {
      const newCharacter = {
        userId: auth.currentUser.uid,
        ...characterInfo,
        attributes: [
          { name: 'Força', code: 'FOR', value: 1 },
          { name: 'Agilidade', code: 'AGI', value: 1 },
          { name: 'Intelecto', code: 'INT', value: 1 },
          { name: 'Presença', code: 'PRE', value: 1 },
          { name: 'Vigor', code: 'VIG', value: 1 }
        ],
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'characters'), newCharacter);
      navigate(`/character/${docRef.id}`);
    } catch (error) {
      console.error('Erro ao criar ficha:', error);
      alert('Erro ao criar ficha. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Container>
      <Title>Criar Nova Ficha</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          placeholder="Nome do Personagem"
          value={characterInfo.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={isCreating}
        />
        <Input
          placeholder="Jogador"
          value={characterInfo.player}
          onChange={(e) => handleChange('player', e.target.value)}
          required
          disabled={isCreating}
        />
        <Input
          placeholder="Origem"
          value={characterInfo.origin}
          onChange={(e) => handleChange('origin', e.target.value)}
          required
          disabled={isCreating}
        />
        <Input
          placeholder="Classe"
          value={characterInfo.class}
          onChange={(e) => handleChange('class', e.target.value)}
          required
          disabled={isCreating}
        />
        <ButtonContainer>
          <CancelButton 
            type="button" 
            onClick={() => navigate('/characters')}
            disabled={isCreating}
          >
            Cancelar
          </CancelButton>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Criando...' : 'Criar Ficha'}
          </Button>
        </ButtonContainer>
      </Form>
    </Container>
  );
};

export default NewCharacter; 