import React, { useEffect, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCharacterCache } from '../hooks/useCharacterCache';
import { Character } from '../types/Character';

const CharacterList: React.FC = () => {
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

  const handleDelete = async (id: string) => {
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

  if (isLoading) {
    return <div>Carregando personagens...</div>;
  }

  return (
    <div>
      <h2>Seus Personagens</h2>
      {characters.length === 0 ? (
        <p>Nenhum personagem encontrado.</p>
      ) : (
        <ul>
          {characters.map(character => (
            <li key={character.id}>
              {character.name}
              <button onClick={() => handleDelete(character.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CharacterList; 