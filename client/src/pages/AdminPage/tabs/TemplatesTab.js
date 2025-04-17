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

const SearchInput = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
  margin-right: 10px;
  font-size: 14px;
`;

const Button = styled.button`
  background-color: ${props => props.danger ? '#f44336' : props.primary ? '#3f51b5' : '#f0f0f0'};
  color: ${props => (props.danger || props.primary) ? 'white' : '#333'};
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${props => props.bold ? 'bold' : 'normal'};
  
  &:hover {
    background-color: ${props => props.danger ? '#d32f2f' : props.primary ? '#303f9f' : '#e0e0e0'};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const TableHead = styled.thead`
  background-color: #f5f5f5;
  
  th {
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #ddd;
    font-weight: bold;
  }
`;

const TableBody = styled.tbody`
  tr {
    &:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    &:hover {
      background-color: #f0f0f0;
    }
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid #ddd;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 5px;
  
  button {
    padding: 5px 10px;
    font-size: 12px;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background-color: ${props => props.active ? '#4caf50' : '#9e9e9e'};
  color: white;
`;

const GroupBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  margin-right: 5px;
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
  margin-bottom: 15px;
  
  label {
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 14px;
  }
  
  input, textarea, select {
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

const MetricsContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
`;

const MetricsList = styled.div`
  margin-top: 10px;
`;

const MetricItem = styled.div`
  background-color: #f5f5f5;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  position: relative;
`;

const MetricActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`;

const AddMetricButton = styled(Button)`
  margin-top: 10px;
`;

function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'groups'
  const [currentTemplate, setCurrentTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metrics: [],
    isActive: true
  });
  
  // Metric form state
  const [metricForm, setMetricForm] = useState({
    name: '',
    description: '',
    maxScore: 10
  });
  
  // Selected groups for template
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);

  // Replace current getAuthConfig-like functions with this consistent one
  const getAuthConfig = () => {
    try {
      const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      return {
        headers: {
          'x-auth-token': adminAuth.token || ''
        }
      };
    } catch (err) {
      console.error('Error parsing auth token:', err);
      return { headers: {} };
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/templates', getAuthConfig());
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      setError('템플릿 목록을 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/admin/groups', getAuthConfig());
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
    fetchGroups();
  }, []);
  
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      name: '',
      description: '',
      metrics: [],
      isActive: true
    });
    setShowModal(true);
  };
  
  const handleEditClick = (template) => {
    setModalMode('edit');
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      metrics: template.metrics || [],
      isActive: template.isActive
    });
    setShowModal(true);
  };
  
  const handleGroupsClick = async (template) => {
    setModalMode('groups');
    setCurrentTemplate(template);
    
    try {
      // Get current template groups
      const response = await axios.get(`/api/templates/${template.id}/groups`, getAuthConfig());
      const templateGroups = response.data;
      
      // Set selected groups
      setSelectedGroups(templateGroups);
      
      // Filter available groups
      const templateGroupIds = templateGroups.map(g => g.id);
      setAvailableGroups(groups.filter(g => !templateGroupIds.includes(g.id)));
      
      setShowModal(true);
    } catch (err) {
      setError('템플릿 그룹 정보를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching template groups:', err);
    }
  };
  
  const handleDeleteClick = async (templateId) => {
    if (!window.confirm('정말 이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/templates/${templateId}`, getAuthConfig());
      
      // Update local state
      setTemplates(templates.filter(template => template.id !== templateId));
    } catch (err) {
      setError('템플릿 삭제 중 오류가 발생했습니다.');
      console.error('Error deleting template:', err);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleMetricFormChange = (e) => {
    const { name, value } = e.target;
    setMetricForm({
      ...metricForm,
      [name]: name === 'maxScore' ? parseInt(value, 10) : value
    });
  };
  
  const handleAddMetric = () => {
    if (!metricForm.name) {
      alert('평가 항목 이름을 입력해주세요.');
      return;
    }
    
    setFormData({
      ...formData,
      metrics: [
        ...formData.metrics,
        {
          name: metricForm.name,
          description: metricForm.description,
          maxScore: metricForm.maxScore
        }
      ]
    });
    
    // Reset metric form
    setMetricForm({
      name: '',
      description: '',
      maxScore: 10
    });
  };
  
  const handleDeleteMetric = (index) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.filter((_, i) => i !== index)
    });
  };
  
  const handleAddGroupToTemplate = async (groupId) => {
    try {
      const response = await axios.post(`/api/templates/${currentTemplate.id}/groups/${groupId}`, {}, getAuthConfig());
      
      // Update selected groups
      const addedGroup = groups.find(g => g.id === groupId);
      setSelectedGroups([...selectedGroups, addedGroup]);
      
      // Update available groups
      setAvailableGroups(availableGroups.filter(g => g.id !== groupId));
      
      // Update templates list
      setTemplates(templates.map(t => 
        t.id === currentTemplate.id ? response.data : t
      ));
    } catch (err) {
      setError('그룹을 템플릿에 추가하는 중 오류가 발생했습니다.');
      console.error('Error adding group to template:', err);
    }
  };
  
  const handleRemoveGroupFromTemplate = async (groupId) => {
    try {
      await axios.delete(`/api/templates/${currentTemplate.id}/groups/${groupId}`, getAuthConfig());
      
      // Update selected groups
      const removedGroup = selectedGroups.find(g => g.id === groupId);
      setSelectedGroups(selectedGroups.filter(g => g.id !== groupId));
      
      // Update available groups
      setAvailableGroups([...availableGroups, removedGroup]);
      
      // Update templates list
      const updatedTemplate = {
        ...currentTemplate,
        groups: currentTemplate.groups.filter(g => g.id !== groupId)
      };
      
      setTemplates(templates.map(t => 
        t.id === currentTemplate.id ? updatedTemplate : t
      ));
    } catch (err) {
      setError('그룹을 템플릿에서 제거하는 중 오류가 발생했습니다.');
      console.error('Error removing group from template:', err);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'add') {
        // Add new template
        const response = await axios.post('/api/templates', formData, getAuthConfig());
        setTemplates([...templates, response.data]);
      } else if (modalMode === 'edit') {
        // Edit existing template
        const response = await axios.put(`/api/templates/${currentTemplate.id}`, formData, getAuthConfig());
        setTemplates(templates.map(template => 
          template.id === currentTemplate.id ? response.data : template
        ));
      }
      
      // Close modal after successful operation
      setShowModal(false);
    } catch (err) {
      setError(modalMode === 'add' ? '템플릿 추가 중 오류가 발생했습니다.' : '템플릿 정보 수정 중 오류가 발생했습니다.');
      console.error(`Error ${modalMode === 'add' ? 'adding' : 'updating'} template:`, err);
    }
  };
  
  // Filter templates based on search term
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading && templates.length === 0) {
    return <LoadingMessage>템플릿 목록을 불러오는 중...</LoadingMessage>;
  }
  
  return (
    <Container>
      <Title>템플릿 관리</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ActionsRow>
        <SearchInput 
          type="text" 
          placeholder="템플릿 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button primary onClick={handleAddClick}>+ 템플릿 추가</Button>
      </ActionsRow>
      
      {!isLoading && filteredTemplates.length === 0 ? (
        <EmptyMessage>
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 템플릿이 없습니다.'}
        </EmptyMessage>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>설명</th>
              <th>평가 항목</th>
              <th>그룹</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </TableHead>
          <TableBody>
            {filteredTemplates.map(template => (
              <tr key={template.id}>
                <td>{template.id}</td>
                <td>{template.name}</td>
                <td>{template.description || '-'}</td>
                <td>{template.metrics ? template.metrics.length : 0}개</td>
                <td>
                  {template.groups && template.groups.map(group => (
                    <GroupBadge key={group.id}>{group.name}</GroupBadge>
                  ))}
                </td>
                <td>
                  <Badge active={template.isActive}>
                    {template.isActive ? '활성' : '비활성'}
                  </Badge>
                </td>
                <td>
                  <ActionButtons>
                    <Button onClick={() => handleEditClick(template)}>수정</Button>
                    <Button onClick={() => handleGroupsClick(template)}>그룹</Button>
                    <Button 
                      danger 
                      onClick={() => handleDeleteClick(template.id)}
                    >
                      삭제
                    </Button>
                  </ActionButtons>
                </td>
              </tr>
            ))}
          </TableBody>
        </Table>
      )}
      
      {/* Template Modal */}
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>
                {modalMode === 'add' ? '템플릿 추가' : 
                 modalMode === 'edit' ? '템플릿 정보 수정' :
                 '템플릿 그룹 관리'}
              </h3>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            {modalMode === 'groups' ? (
              // Groups management UI
              <>
                <h4>선택된 그룹</h4>
                {selectedGroups.length === 0 ? (
                  <EmptyMessage>이 템플릿에 연결된 그룹이 없습니다.</EmptyMessage>
                ) : (
                  <Table>
                    <TableHead>
                      <tr>
                        <th>이름</th>
                        <th>작업</th>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {selectedGroups.map(group => (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>
                            <Button 
                              danger 
                              onClick={() => handleRemoveGroupFromTemplate(group.id)}
                            >
                              제거
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                <h4>추가 가능한 그룹</h4>
                {availableGroups.length === 0 ? (
                  <EmptyMessage>추가할 수 있는 그룹이 없습니다.</EmptyMessage>
                ) : (
                  <Table>
                    <TableHead>
                      <tr>
                        <th>이름</th>
                        <th>작업</th>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {availableGroups.map(group => (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>
                            <Button 
                              primary 
                              onClick={() => handleAddGroupToTemplate(group.id)}
                            >
                              추가
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                <ModalFooter>
                  <Button onClick={() => setShowModal(false)}>닫기</Button>
                </ModalFooter>
              </>
            ) : (
              // Add/Edit template form
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <label htmlFor="name">템플릿 이름</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name} 
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
                  <label htmlFor="isActive">상태</label>
                  <div>
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                    />
                    <label htmlFor="isActive" style={{ marginLeft: '5px', fontWeight: 'normal' }}>
                      활성화
                    </label>
                  </div>
                </FormGroup>
                
                <MetricsContainer>
                  <h4>평가 항목</h4>
                  
                  <MetricsList>
                    {formData.metrics.length === 0 ? (
                      <EmptyMessage>등록된 평가 항목이 없습니다.</EmptyMessage>
                    ) : (
                      formData.metrics.map((metric, index) => (
                        <MetricItem key={index}>
                          <div><strong>{metric.name}</strong> (최대 점수: {metric.maxScore})</div>
                          {metric.description && <div>{metric.description}</div>}
                          <MetricActions>
                            <Button danger onClick={() => handleDeleteMetric(index)}>삭제</Button>
                          </MetricActions>
                        </MetricItem>
                      ))
                    )}
                  </MetricsList>
                  
                  <h4>새 평가 항목 추가</h4>
                  <FormGroup>
                    <label htmlFor="metricName">항목 이름</label>
                    <input 
                      type="text" 
                      id="metricName" 
                      name="name" 
                      value={metricForm.name} 
                      onChange={handleMetricFormChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <label htmlFor="metricDescription">항목 설명</label>
                    <input 
                      type="text" 
                      id="metricDescription" 
                      name="description" 
                      value={metricForm.description} 
                      onChange={handleMetricFormChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <label htmlFor="metricMaxScore">최대 점수</label>
                    <input 
                      type="number" 
                      id="metricMaxScore" 
                      name="maxScore" 
                      min="1"
                      max="100"
                      value={metricForm.maxScore} 
                      onChange={handleMetricFormChange}
                    />
                  </FormGroup>
                  
                  <AddMetricButton onClick={handleAddMetric}>항목 추가</AddMetricButton>
                </MetricsContainer>
                
                <ModalFooter>
                  <Button onClick={() => setShowModal(false)}>취소</Button>
                  <Button primary type="submit">
                    {modalMode === 'add' ? '추가' : '저장'}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default TemplatesTab; 