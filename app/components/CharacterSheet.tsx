import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';

interface CharacterInfo {
  name: string;
  player: string;
  origin: string;
  class: string;
  image: string;
}

interface Attribute {
  name: string;
  code: string;
  value: number;
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

const AttributesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const AttributeCard = styled.div`
  background: #333;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  position: relative;
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
`;

const CharacterSheet: React.FC = () => {
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo>({
    name: '',
    player: '',
    origin: '',
    class: '',
    image: ''
  });

  const [attributes, setAttributes] = useState<Attribute[]>([
    { name: 'Força', code: 'FOR', value: 1 },
    { name: 'Agilidade', code: 'AGI', value: 1 },
    { name: 'Intelecto', code: 'INT', value: 1 },
    { name: 'Presença', code: 'PRE', value: 2 },
    { name: 'Vigor', code: 'VIG', value: 1 }
  ]);

  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);

  const handleInfoChange = (field: keyof CharacterInfo, value: string) => {
    setCharacterInfo((prev: CharacterInfo) => ({ ...prev, [field]: value }));
  };

  const handleAttributeValueChange = (index: number, value: number) => {
    const newAttributes = [...attributes];
    newAttributes[index].value = value;
    setAttributes(newAttributes);
  };

  const toggleEdit = (index: number) => {
    setEditingAttribute(editingAttribute === index ? null : index);
  };

  return (
    <Container>
      <Header>
        <ImageContainer>
          {characterInfo.image && <img src={characterInfo.image} alt="Character" />}
        </ImageContainer>
        <InfoContainer>
          <Input
            placeholder="Nome do Personagem"
            value={characterInfo.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('name', e.target.value)}
          />
          <Input
            placeholder="Jogador"
            value={characterInfo.player}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('player', e.target.value)}
          />
          <Input
            placeholder="Origem"
            value={characterInfo.origin}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('origin', e.target.value)}
          />
          <Input
            placeholder="Classe"
            value={characterInfo.class}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInfoChange('class', e.target.value)}
          />
        </InfoContainer>
      </Header>

      <AttributesContainer>
        {attributes.map((attr: Attribute, index: number) => (
          <AttributeCard key={index}>
            <EditButton onClick={() => toggleEdit(index)}>
              {editingAttribute === index ? '✓' : '✎'}
            </EditButton>
            <h3>{attr.name} ({attr.code})</h3>
            {editingAttribute === index ? (
              <Input
                type="number"
                value={attr.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAttributeValueChange(index, parseInt(e.target.value))}
                min="1"
                max="5"
              />
            ) : (
              <div>{attr.value}</div>
            )}
          </AttributeCard>
        ))}
      </AttributesContainer>
    </Container>
  );
};

export default CharacterSheet; 