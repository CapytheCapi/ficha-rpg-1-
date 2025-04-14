import React, { useState, ChangeEvent, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import styled from 'styled-components';
import html2pdf from 'html2pdf.js';
import Toast from './Toast';
import { useCharacterCache } from '../hooks/useCharacterCache';
import debounce from 'lodash/debounce';
import { Character } from '../types/Character';

interface Attribute {
  name: string;
  code: string;
  value: number;
}

interface DiceRoll {
  rolls: number[];
  bestRoll: number;
  isDisadvantage: boolean;
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  color: white;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 20px;
  margin-bottom: 20px;
`;

const ImageContainer = styled.div`
  width: 100px;
  height: 100px;
  background: #333;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  
  &:hover::before {
    content: '📷';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    z-index: 1;
    background: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const InfoContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const Input = styled.input`
  background: #333;
  border: none;
  padding: 5px 10px;
  color: white;
  border-radius: 4px;
`;

const EditButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  &.pdf-hidden {
    display: none;
  }
`;

const AttributesContainer = styled.div`
  position: relative;
  width: 400px;
  height: 400px;
  margin: 40px auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AttributeCircle = styled.div`
  position: absolute;
  width: 100px;
  height: 100px;
  background: #333;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  h3 {
    margin: 0;
    font-size: 14px;
    color: #aaa;
  }

  .value {
    font-size: 24px;
    margin-top: 5px;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
    
    &:hover {
      background: #444;
    }
  }

  &.editing .value {
    background: #444;
  }
`;

const CenterCircle = styled.div`
  width: 150px;
  height: 150px;
  background: #333;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  h2 {
    margin: 0;
    font-size: 18px;
    color: white;
  }
`;

const GlobalEditButton = styled(EditButton)`
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  background: #444;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  &.pdf-hidden {
    display: none;
  }
`;

const Button = styled.button`
  background: #4a4a4a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5a5a5a;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const DicePopup = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(26, 26, 26, 0.95);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: ${props => props.isVisible ? 'block' : 'none'};
  z-index: 1000;
  min-width: 200px;
  text-align: center;
`;

const RollResult = styled.div<{ result: number }>`
  font-size: 24px;
  margin: 10px 0;
  color: ${props => {
    if (props.result === 6) return '#4CAF50'; // Crítico (verde)
    if (props.result === 1) return '#f44336'; // Falha crítica (vermelho)
    return 'white'; // Normal
  }};
`;

const DiceList = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 10px 0;
  flex-wrap: wrap;
`;

const Die = styled.div<{ value: number }>`
  width: 40px;
  height: 40px;
  background: #333;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: ${props => {
    if (props.value === 6) return '#4CAF50';
    if (props.value === 1) return '#f44336';
    return 'white';
  }};
`;

const AttributeValue = styled.div`
  cursor: pointer;
  &:hover {
    background: #444;
    border-radius: 4px;
  }
`;

const SaveButton = styled(Button)`
  background: #2196F3;
  &:hover {
    background: #1976D2;
  }
`;

const BackButton = styled(Button)`
  background: #666;
  margin-right: 10px;
  &:hover {
    background: #555;
  }
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  color: ${props => props.$isError ? '#ff4444' : '#4CAF50'};
  text-align: center;
  margin-top: 10px;
`;

const CharacterSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCharacter, invalidateCache, createCharacter } = useCharacterCache();
  const [characterInfo, setCharacterInfo] = useState<Omit<Character, 'id'>>({
    name: '',
    player: '',
    origin: '',
    class: '',
    image: '',
    attributes: [
      { name: 'Força', code: 'FOR', value: 1 },
      { name: 'Agilidade', code: 'AGI', value: 1 },
      { name: 'Intelecto', code: 'INT', value: 1 },
      { name: 'Presença', code: 'PRE', value: 2 },
      { name: 'Vigor', code: 'VIG', value: 1 }
    ]
  });

  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(null);
  const [showDicePopup, setShowDicePopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isToastClosing, setIsToastClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // Implementa salvamento automático com debounce
  const debouncedSave = useCallback(
    debounce(async (data: any) => {
      if (!id) return;

      try {
        const docRef = doc(db, 'characters', id);
        await updateDoc(docRef, {
          ...data,
          lastUpdated: new Date()
        });
        invalidateCache(id);
        setShowToast(true);
      } catch (error) {
        console.error('Erro ao salvar ficha:', error);
      }
    }, 1000),
    [id]
  );

  useEffect(() => {
    const loadCharacter = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const character = await getCharacter(id);
        if (character) {
          setCharacterInfo({
            name: character.name || '',
            player: character.player || '',
            origin: character.origin || '',
            class: character.class || '',
            image: character.image || '',
            attributes: character.attributes || []
          });
        }
      } catch (error) {
        console.error('Erro ao carregar ficha:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacter();
  }, [id, getCharacter]);

  // Atualiza o handleInfoChange para usar salvamento automático
  const handleInfoChange = (field: keyof Omit<Character, 'id' | 'attributes'>, value: string) => {
    setCharacterInfo(prev => ({ ...prev, [field]: value }));
  };

  // Atualiza o handleAttributeValueChange para usar salvamento automático
  const handleAttributeValueChange = (index: number, value: number) => {
    setCharacterInfo(prev => {
      const newAttributes = [...prev.attributes];
      newAttributes[index] = { ...newAttributes[index], value };
      return { ...prev, attributes: newAttributes };
    });
  };

  const toggleEdit = (index: number) => {
    setEditingAttribute(editingAttribute === index ? null : index);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleInfoChange('image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!characterInfo.name.trim()) {
      setStatus({ message: 'Por favor, insira um nome para o personagem', isError: true });
      return;
    }

    setIsSaving(true);
    setStatus({ message: 'Salvando personagem...', isError: false });

    try {
      const savedCharacter = await createCharacter(characterInfo);
      setStatus({ message: 'Personagem salvo com sucesso!', isError: false });
      setTimeout(() => {
        navigate(`/character/${savedCharacter.id}`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar personagem:', error);
      setStatus({ message: 'Erro ao salvar personagem. Tente novamente.', isError: true });
      setIsSaving(false);
    }
  };

  const handleToastClose = () => {
    setIsToastClosing(true);
    setTimeout(() => {
      setShowToast(false);
      setIsToastClosing(false);
    }, 300);
  };

  const exportToPDF = async () => {
    setIsPrinting(true);
    
    // Adicionar dados como campos de formulário PDF
    const element = document.getElementById('character-sheet');
    const dataStr = JSON.stringify({
      characterInfo,
      attributes: characterInfo.attributes
    });
    
    const opt = {
      margin: 1,
      filename: `${characterInfo.name || 'personagem'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      // Adiciona campos de formulário editáveis
      formFields: true
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          if (data.characterInfo && data.attributes) {
            setCharacterInfo(data.characterInfo);
          }
        } catch (error) {
          alert('Erro ao importar o arquivo. Certifique-se de que é um arquivo válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify({
      characterInfo,
      attributes: characterInfo.attributes
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterInfo.name || 'personagem'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rollDice = (attributeValue: number) => {
    const isDisadvantage = attributeValue === 0;
    const numDice = isDisadvantage ? 2 : Math.max(1, attributeValue);
    
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }

    const bestRoll = isDisadvantage 
      ? Math.min(...rolls)
      : Math.max(...rolls);

    setDiceRoll({ rolls, bestRoll, isDisadvantage });
    setShowDicePopup(true);
  };

  const calculatePosition = (index: number, total: number) => {
    const radius = 150; // Distância do centro
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    return {
      left: `calc(50% + ${Math.cos(angle) * radius}px)`,
      top: `calc(50% + ${Math.sin(angle) * radius}px)`,
      transform: 'translate(-50%, -50%)'
    };
  };

  if (isLoading) {
    return (
      <Container>
        <div>Carregando ficha...</div>
      </Container>
    );
  }

  return (
    <Container id="character-sheet">
      <Header>
        <ImageContainer onClick={() => document.getElementById('imageInput')?.click()}>
          {characterInfo.image ? (
            <img src={characterInfo.image} alt="Character" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#333' }} />
          )}
        </ImageContainer>
        <HiddenInput
          id="imageInput"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <InfoContainer>
          <Input
            placeholder="Nome do Personagem"
            value={characterInfo.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('name', e.target.value)}
            disabled={isSaving}
          />
          <Input
            placeholder="Jogador"
            value={characterInfo.player}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('player', e.target.value)}
            disabled={isSaving}
          />
          <Input
            placeholder="Origem"
            value={characterInfo.origin}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('origin', e.target.value)}
            disabled={isSaving}
          />
          <Input
            placeholder="Classe"
            value={characterInfo.class}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('class', e.target.value)}
            disabled={isSaving}
          />
        </InfoContainer>
      </Header>

      <AttributesContainer>
        <CenterCircle>
          <h2>ATRIBUTOS</h2>
          <GlobalEditButton 
            onClick={() => setEditingAttribute(editingAttribute === null ? 0 : null)}
            className={isPrinting ? 'pdf-hidden' : ''}
          >
            {editingAttribute !== null ? '✓' : '✎'}
          </GlobalEditButton>
        </CenterCircle>
        
        {characterInfo.attributes.map((attr: Attribute, index: number) => (
          <AttributeCircle
            key={index}
            style={calculatePosition(index, characterInfo.attributes.length)}
            className={editingAttribute !== null ? 'editing' : ''}
          >
            <h3>{attr.name}</h3>
            <h3>({attr.code})</h3>
            {editingAttribute !== null ? (
              <Input
                type="number"
                value={attr.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  handleAttributeValueChange(index, parseInt(e.target.value))}
                min="1"
                max="5"
                style={{ width: '40px', textAlign: 'center' }}
                disabled={isSaving}
              />
            ) : (
              <div className="value" onClick={() => rollDice(attr.value)}>
                {attr.value}
              </div>
            )}
          </AttributeCircle>
        ))}
      </AttributesContainer>

      <DicePopup isVisible={showDicePopup}>
        <h3>Resultado da Rolagem</h3>
        {diceRoll && (
          <>
            <DiceList>
              {diceRoll.rolls.map((roll, index) => (
                <Die key={index} value={roll}>
                  {roll}
                </Die>
              ))}
            </DiceList>
            <RollResult result={diceRoll.bestRoll}>
              {diceRoll.isDisadvantage ? 'Desvantagem: ' : 'Melhor resultado: '}
              {diceRoll.bestRoll}
            </RollResult>
            {diceRoll.bestRoll === 6 && <div style={{ color: '#4CAF50' }}>Sucesso Crítico!</div>}
            {diceRoll.bestRoll === 1 && <div style={{ color: '#f44336' }}>Falha Crítica!</div>}
            <Button onClick={() => setShowDicePopup(false)}>Fechar</Button>
          </>
        )}
      </DicePopup>

      <ButtonContainer className={isPrinting ? 'pdf-hidden' : ''}>
        <Button onClick={exportToPDF}>
          Exportar PDF
        </Button>
        <Button onClick={exportJSON}>
          Exportar JSON
        </Button>
        <Button onClick={() => fileInputRef.current?.click()}>
          Importar Ficha
        </Button>
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
        />
      </ButtonContainer>

      <ButtonContainer>
        <BackButton onClick={() => navigate('/characters')} disabled={isSaving}>
          Voltar
        </BackButton>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Ficha'}
          </SaveButton>
          {isSaving && (
            <StatusMessage>Salvando sua ficha...</StatusMessage>
          )}
        </div>
      </ButtonContainer>

      {showToast && (
        <Toast
          message="Ficha salva com sucesso!"
          onClose={handleToastClose}
          isClosing={isToastClosing}
        />
      )}

      {status && (
        <StatusMessage $isError={status.isError}>
          {status.message}
        </StatusMessage>
      )}
    </Container>
  );
};

export default CharacterSheet; 