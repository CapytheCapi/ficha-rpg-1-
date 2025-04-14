import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Character } from '../types/Character';

interface Cache {
  [key: string]: {
    data: Character;
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const characterCache: Cache = {};
let characterListCache: { data: Character[]; timestamp: number } | null = null;

export const useCharacterCache = () => {
  const [cache, setCache] = useState<Cache>({});
  const [loading, setLoading] = useState(true);

  const createCharacter = useCallback(async (characterData: Omit<Character, 'id'>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    
    const batch = writeBatch(db);
    const newCharacterRef = doc(collection(db, 'characters'));
    const newCharacter: Character = {
      ...characterData,
      id: newCharacterRef.id,
    };

    batch.set(newCharacterRef, {
      ...newCharacter,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    });

    // Atualiza o cache imediatamente
    setCache(prevCache => ({
      ...prevCache,
      [newCharacter.id]: {
        data: newCharacter,
        timestamp: Date.now(),
      },
    }));

    // Commit das alterações no Firestore
    await batch.commit();
    return newCharacter;
  }, []);

  const getCharacterList = useCallback(async (forceRefresh = false): Promise<Character[]> => {
    if (!auth.currentUser) return [];

    // Verifica o cache da lista
    const now = Date.now();
    if (
      !forceRefresh &&
      characterListCache &&
      now - characterListCache.timestamp < CACHE_DURATION
    ) {
      return characterListCache.data;
    }

    // Busca nova lista do Firestore
    const q = query(
      collection(db, 'characters'),
      where('userId', '==', auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const characters = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Character[];

    // Atualiza o cache
    characterListCache = {
      data: characters,
      timestamp: now
    };

    characters.forEach(character => {
      setCache(prev => ({ ...prev, [character.id]: { data: character, timestamp: now } }));
    });

    return characters;
  }, []);

  const getCharacter = useCallback(async (id: string, forceRefresh = false): Promise<Character | null> => {
    // Verifica o cache individual
    const now = Date.now();
    if (
      !forceRefresh &&
      cache[id] &&
      now - cache[id].timestamp < CACHE_DURATION
    ) {
      return cache[id].data;
    }

    // Busca do Firestore
    const docRef = doc(db, 'characters', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const character = {
      id: docSnap.id,
      ...docSnap.data()
    } as Character;

    // Atualiza o cache
    setCache(prev => ({ ...prev, [id]: { data: character, timestamp: now } }));

    return character;
  }, [cache]);

  const invalidateCache = useCallback((id?: string) => {
    if (id) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[id];
        return newCache;
      });
    } else {
      characterListCache = null;
      Object.keys(cache).forEach(key => delete cache[key]);
    }
  }, []);

  return {
    createCharacter,
    getCharacterList,
    getCharacter,
    invalidateCache,
    loading,
    setLoading
  };
}; 