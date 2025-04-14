import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
  &:hover {
    background: #45a049;
  }
`;

const BackButton = styled(Button)`
  background: #666;
  margin-right: 10px;
  &:hover {
    background: #555;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const CharacterCard = styled.div`
  background: #333;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  &:hover {
    background: #444;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  background: #333;
  border-radius: 10px;
  margin-top: 20px;
`;

interface Character {
  id: string;
  name: string;
  player: string;
  origin: string;
  class: string;
  attributes: {
    name: string;
    code: string;
    value: number;
  }[];
}

const CharacterList: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, 'characters'),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const charactersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Character[];

      setCharacters(charactersData);
    };

    fetchCharacters();
  }, []);

  const handleCreateCharacter = async () => {
    if (!auth.currentUser || isCreating) return;

    setIsCreating(true);
    try {
      const newCharacter = {
        userId: auth.currentUser.uid,
        name: '',
        player: '',
        origin: '',
        class: '',
        image: '',
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
      <ButtonContainer>
        <BackButton onClick={() => navigate('/')}>Voltar</BackButton>
        <Button 
          onClick={handleCreateCharacter} 
          disabled={isCreating}
        >
          {isCreating ? 'Criando...' : 'Criar Nova Ficha'}
        </Button>
      </ButtonContainer>
      
      {characters.length === 0 ? (
        <EmptyMessage>Você ainda não tem fichas criadas. Clique em "Criar Nova Ficha" para começar!</EmptyMessage>
      ) : (
        characters.map(character => (
          <CharacterCard
            key={character.id}
            onClick={() => navigate(`/character/${character.id}`)}
          >
            <h3>{character.name || 'Ficha sem nome'}</h3>
            <p>Jogador: {character.player || 'Não informado'}</p>
            <p>Classe: {character.class || 'Não informada'}</p>
          </CharacterCard>
        ))
      )}
    </Container>
  );
};

export default CharacterList; 