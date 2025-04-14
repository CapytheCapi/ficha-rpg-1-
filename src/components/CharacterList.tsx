import React, { useEffect, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCharacterCache } from '../hooks/useCharacterCache';
import { Character } from '../types/Character';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 24px;
`;

const CreateButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  transition: background-color 0.2s;

  &:hover {
    background: #45a049;
  }
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const CharacterCard = styled.div`
  background: #333;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    background: #444;
  }
`;

const CharacterName = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const CharacterInfo = styled.p`
  margin: 5px 0;
  color: #ccc;
  font-size: 14px;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;

  ${CharacterCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background: #ff0000;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background: #333;
  border-radius: 8px;
  margin-top: 20px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #ccc;
`;

const CharacterList: React.FC = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getCharacterList, invalidateCache } = useCharacterCache();

  const loadCharacters = async () => {
    try {
      setIsLoading(true);
      const characterList = await getCharacterList();
      setCharacters(characterList);
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este personagem?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'characters', id));
      invalidateCache(id);
      setCharacters(prev => prev.filter(char => char.id !== id));
    } catch (error) {
      console.error('Erro ao deletar personagem:', error);
    }
  };

  const handleCreateCharacter = () => {
    navigate('/characters/new');
  };

  const handleCharacterClick = (id: string) => {
    navigate(`/character/${id}`);
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingState>Carregando personagens...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Seus Personagens</Title>
      <CreateButton onClick={handleCreateCharacter}>
        Criar Novo Personagem
      </CreateButton>

      {characters.length === 0 ? (
        <EmptyState>
          <p>Você ainda não tem personagens criados.</p>
          <p>Clique no botão acima para criar seu primeiro personagem!</p>
        </EmptyState>
      ) : (
        <CharacterGrid>
          {characters.map(character => (
            <CharacterCard
              key={character.id}
              onClick={() => handleCharacterClick(character.id)}
            >
              <CharacterName>{character.name || 'Sem Nome'}</CharacterName>
              <CharacterInfo>Classe: {character.class || 'Não definida'}</CharacterInfo>
              <CharacterInfo>Origem: {character.origin || 'Não definida'}</CharacterInfo>
              <DeleteButton
                onClick={(e) => handleDelete(e, character.id)}
              >
                Excluir
              </DeleteButton>
            </CharacterCard>
          ))}
        </CharacterGrid>
      )}
    </Container>
  );
};

export default CharacterList; 