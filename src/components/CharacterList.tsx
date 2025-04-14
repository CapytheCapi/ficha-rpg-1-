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
    if (!auth.currentUser) return;

    const newCharacter = {
      userId: auth.currentUser.uid,
      name: '',
      player: '',
      origin: '',
      class: '',
      attributes: [
        { name: 'Força', code: 'FOR', value: 1 },
        { name: 'Agilidade', code: 'AGI', value: 1 },
        { name: 'Intelecto', code: 'INT', value: 1 },
        { name: 'Presença', code: 'PRE', value: 2 },
        { name: 'Vigor', code: 'VIG', value: 1 }
      ]
    };

    const docRef = await addDoc(collection(db, 'characters'), newCharacter);
    navigate(`/character/${docRef.id}`);
  };

  return (
    <Container>
      <Button onClick={handleCreateCharacter}>Criar Nova Ficha</Button>
      
      {characters.map(character => (
        <CharacterCard
          key={character.id}
          onClick={() => navigate(`/character/${character.id}`)}
        >
          <h3>{character.name || 'Ficha sem nome'}</h3>
          <p>Jogador: {character.player}</p>
          <p>Classe: {character.class}</p>
        </CharacterCard>
      ))}
    </Container>
  );
};

export default CharacterList; 