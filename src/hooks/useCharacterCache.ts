import { useCallback, useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Character } from '../types/Character';

interface Cache {
  [key: string]: {
    data: Character;
    timestamp: number;
  };
}

interface ListCache {
  characters: Character[];
  timestamp: number;
}

export const useCharacterCache = () => {
  const [cache, setCache] = useState<Cache>({});
  const [listCache, setListCache] = useState<ListCache | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Carregar cache do localStorage ao iniciar
  useEffect(() => {
    const savedCache = localStorage.getItem('characterCache');
    const savedListCache = localStorage.getItem('characterListCache');
    if (savedCache) {
      setCache(JSON.parse(savedCache));
    }
    if (savedListCache) {
      setListCache(JSON.parse(savedListCache));
    }
  }, []);

  // Salvar cache no localStorage quando atualizar
  useEffect(() => {
    localStorage.setItem('characterCache', JSON.stringify(cache));
  }, [cache]);

  useEffect(() => {
    if (listCache) {
      localStorage.setItem('characterListCache', JSON.stringify(listCache));
    }
  }, [listCache]);

  const createCharacter = useCallback(async (characterData: Omit<Character, 'id'>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    
    // Criar ID único
    const newCharacterRef = doc(collection(db, 'characters'));
    const newCharacter: Character = {
      ...characterData,
      id: newCharacterRef.id,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    // Atualizar cache imediatamente (otimistic update)
    setCache(prevCache => ({
      ...prevCache,
      [newCharacter.id]: {
        data: newCharacter,
        timestamp: Date.now(),
      },
    }));

    // Atualizar lista cache
    setListCache(prev => ({
      characters: prev ? [...prev.characters, newCharacter] : [newCharacter],
      timestamp: Date.now(),
    }));

    // Salvar no Firestore em background
    setDoc(newCharacterRef, newCharacter).catch(error => {
      console.error('Erro ao salvar no Firestore:', error);
      // Reverter cache em caso de erro
      invalidateCache(newCharacter.id);
    });

    return newCharacter;
  }, []);

  const getCharacter = useCallback(async (id: string) => {
    // Verificar cache primeiro
    const cached = cache[id];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Verificar na lista cache
    if (listCache) {
      const character = listCache.characters.find(c => c.id === id);
      if (character) {
        setCache(prev => ({
          ...prev,
          [id]: { data: character, timestamp: Date.now() },
        }));
        return character;
      }
    }

    // Se não estiver em cache, buscar do Firestore
    const characterDoc = await getDoc(doc(db, 'characters', id));
    if (!characterDoc.exists()) {
      throw new Error('Personagem não encontrado');
    }

    const character = { id: characterDoc.id, ...characterDoc.data() } as Character;
    setCache(prev => ({
      ...prev,
      [id]: { data: character, timestamp: Date.now() },
    }));

    return character;
  }, [cache, listCache]);

  const getCharacterList = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');

    // Retornar do cache se válido
    if (listCache && Date.now() - listCache.timestamp < CACHE_DURATION) {
      return listCache.characters;
    }

    // Buscar do Firestore
    const q = query(
      collection(db, 'characters'),
      where('userId', '==', auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const characters: Character[] = [];

    querySnapshot.forEach(doc => {
      const character = { id: doc.id, ...doc.data() } as Character;
      characters.push(character);
      setCache(prev => ({
        ...prev,
        [doc.id]: { data: character, timestamp: Date.now() },
      }));
    });

    // Atualizar lista cache
    setListCache({
      characters,
      timestamp: Date.now(),
    });

    return characters;
  }, [listCache]);

  const invalidateCache = useCallback((id?: string) => {
    if (id) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[id];
        return newCache;
      });
      setListCache(prev => prev ? {
        characters: prev.characters.filter(c => c.id !== id),
        timestamp: Date.now(),
      } : null);
    } else {
      setCache({});
      setListCache(null);
    }
  }, []);

  return {
    createCharacter,
    getCharacter,
    getCharacterList,
    invalidateCache,
  };
}; 