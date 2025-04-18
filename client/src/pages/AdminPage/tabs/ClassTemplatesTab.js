import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background-color: ${props => props.$danger ? '#f44336' : props.$primary ? '#3f51b5' : '#f0f0f0'};
  color: ${props => (props.$danger || props.$primary) ? 'white' : '#333'};
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${props => props.$bold ? 'bold' : 'normal'};
  
  &:hover {
    background-color: ${props => props.$danger ? '#d32f2f' : props.$primary ? '#303f9f' : '#e0e0e0'};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const TemplateCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
`;

const TemplateTitle = styled.h3`
  color: #3f51b5;
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const TemplateDescription = styled.p`
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 15px;
`;

const Tag = styled.span`
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  
  label {
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 14px;
  }
  
  input, select, textarea {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: normal;
  cursor: pointer;
  
  input {
    cursor: pointer;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
`;

function ClassTemplatesTab() {
  const [templates, setTemplates] = useState([
    // Example templates for display purposes
    {
      id: 1,
      title: '기본 수업',
      description: '일반적인 수업 템플릿, 모든 학생 참여 가능',
      tags: ['기본', '전체 학생'],
      groups: [1, 2],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: '레드팀 수업',
      description: '레드팀 학생들을 위한 수업 템플릿',
      tags: ['레드팀', '팀별'],
      groups: [1],
      createdAt: new Date().toISOString()
    }
  ]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentTemplate, setCurrentTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    groups: []
  });
  
  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/admin/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };
  
  useEffect(() => {
    fetchGroups();
    // In a real app, you would fetch templates here
    // fetchTemplates();
  }, []);
  
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      title: '',
      description: '',
      tags: '',
      groups: []
    });
    setShowModal(true);
  };
  
  const handleEditClick = (template) => {
    setModalMode('edit');
    setCurrentTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      tags: template.tags.join(', '),
      groups: template.groups
    });
    setShowModal(true);
  };
  
  const handleDeleteClick = async (templateId) => {
    if (!window.confirm('정말 이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      // In a real app, you would make an API call here
      // await axios.delete(`/api/admin/templates/${templateId}`);
      
      // Update local state
      setTemplates(templates.filter(template => template.id !== templateId));
    } catch (err) {
      setError('템플릿 삭제 중 오류가 발생했습니다.');
      console.error('Error deleting template:', err);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleGroupCheckboxChange = (groupId) => {
    const updatedGroups = formData.groups.includes(groupId)
      ? formData.groups.filter(id => id !== groupId)
      : [...formData.groups, groupId];
    
    setFormData({
      ...formData,
      groups: updatedGroups
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert tags string to array
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const templateData = {
      ...formData,
      tags: tagsArray
    };
    
    try {
      if (modalMode === 'add') {
        // In a real app, you would make an API call here
        // const response = await axios.post('/api/admin/templates', templateData);
        const newTemplate = {
          id: templates.length + 1,
          ...templateData,
          createdAt: new Date().toISOString()
        };
        setTemplates([...templates, newTemplate]);
      } else {
        // In a real app, you would make an API call here
        // const response = await axios.put(`/api/admin/templates/${currentTemplate.id}`, templateData);
        setTemplates(templates.map(template => 
          template.id === currentTemplate.id ? 
          { ...template, ...templateData } : 
          template
        ));
      }
      
      // Close modal after successful operation
      setShowModal(false);
    } catch (err) {
      setError(modalMode === 'add' ? '템플릿 추가 중 오류가 발생했습니다.' : '템플릿 정보 수정 중 오류가 발생했습니다.');
      console.error(`Error ${modalMode === 'add' ? 'adding' : 'updating'} template:`, err);
    }
  };
  
  const handleUseTemplate = (template) => {
    // Redirect to class preparation page with template pre-selected
    window.location.href = `/teacher/prepare?template=${template.id}`;
  };
  
  if (isLoading) {
    return <LoadingMessage>템플릿 목록을 불러오는 중...</LoadingMessage>;
  }
  
  return (
    <Container>
      <Title>수업 템플릿 관리</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ActionsRow>
        <div></div> {/* Placeholder for alignment */}
        <Button $primary onClick={handleAddClick}>+ 템플릿 추가</Button>
      </ActionsRow>
      
      {templates.length === 0 ? (
        <EmptyMessage>등록된 템플릿이 없습니다.</EmptyMessage>
      ) : (
        <TemplateGrid>
          {templates.map(template => (
            <TemplateCard key={template.id}>
              <TemplateTitle>{template.title}</TemplateTitle>
              <TemplateDescription>{template.description}</TemplateDescription>
              
              <TagsContainer>
                {template.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </TagsContainer>
              
              <p style={{ fontSize: '12px', color: '#666' }}>
                생성일: {new Date(template.createdAt).toLocaleDateString()}
              </p>
              
              <ActionButtons>
                <Button $primary onClick={() => handleUseTemplate(template)}>
                  이 템플릿으로 수업 시작
                </Button>
                <Button onClick={() => handleEditClick(template)}>
                  수정
                </Button>
                <Button $danger onClick={() => handleDeleteClick(template.id)}>
                  삭제
                </Button>
              </ActionButtons>
            </TemplateCard>
          ))}
        </TemplateGrid>
      )}
      
      {/* Add/Edit Template Modal */}
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>{modalMode === 'add' ? '템플릿 추가' : '템플릿 정보 수정'}</h3>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <label htmlFor="title">템플릿 이름</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleFormChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="description">설명</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleFormChange}
                />
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="tags">태그 (쉼표로 구분)</label>
                <input 
                  type="text" 
                  id="tags" 
                  name="tags" 
                  value={formData.tags} 
                  onChange={handleFormChange}
                  placeholder="예: 수학, 중급, 팀별"
                />
              </FormGroup>
              
              <FormGroup>
                <label>참여 그룹</label>
                <CheckboxGroup>
                  {groups.map(group => (
                    <CheckboxLabel key={group.id}>
                      <input 
                        type="checkbox" 
                        checked={formData.groups.includes(group.id)} 
                        onChange={() => handleGroupCheckboxChange(group.id)}
                      />
                      {group.name}
                    </CheckboxLabel>
                  ))}
                </CheckboxGroup>
              </FormGroup>
              
              <ModalFooter>
                <Button onClick={() => setShowModal(false)}>취소</Button>
                <Button $primary type="submit">
                  {modalMode === 'add' ? '추가' : '저장'}
                </Button>
              </ModalFooter>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default ClassTemplatesTab; 