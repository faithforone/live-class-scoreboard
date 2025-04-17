import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import api from '../../../utils/api';

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
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background-color: #e3f2fd;
  color: #1976d2;
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
  width: 500px;
  max-width: 90%;
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
  
  input, select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
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

function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentGroup, setCurrentGroup] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: ''
  });
  
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
  
  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const response = await axios.get('/api/admin/groups', {
        headers: { 'x-auth-token': adminAuth.token || '' }
      });
      // The API now returns groups with their students included
      setGroups(response.data);
      setError(null);
    } catch (err) {
      setError('그룹 목록을 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching groups:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGroups();
  }, []);
  
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      name: ''
    });
    setShowModal(true);
  };
  
  const handleEditClick = (group) => {
    setModalMode('edit');
    setCurrentGroup(group);
    setFormData({
      name: group.name
    });
    setShowModal(true);
  };
  
  const handleDeleteClick = async (groupId) => {
    if (!window.confirm('정말 이 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/groups/${groupId}`);
      
      // Update local state
      setGroups(groups.filter(group => group.id !== groupId));
    } catch (err) {
      if (err.response && err.response.status === 400) {
        // If server indicates group has students
        setError('그룹에 소속된 학생이 있어 삭제할 수 없습니다. 먼저 학생들을 다른 그룹으로 옮겨주세요.');
      } else {
        setError('그룹 삭제 중 오류가 발생했습니다.');
      }
      console.error('Error deleting group:', err);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const config = {
        headers: { 'x-auth-token': adminAuth.token || '' }
      };

      if (modalMode === 'add') {
        // Add mode
        await axios.post('/api/admin/groups', formData, config);
        
        // Refresh the group list
        fetchGroups();
      } else {
        // Edit mode
        await axios.put(`/api/admin/groups/${currentGroup.id}`, formData, config);
        
        // Update in UI without a full reload
        setGroups(groups.map(group => {
          if (group.id === currentGroup.id) {
            return { ...group, ...formData };
          }
          return group;
        }));
      }
      
      // Close the modal after submission
      setShowModal(false);
    } catch (err) {
      setError('그룹 추가 중 오류가 발생했습니다.');
      console.error('Error submitting group:', err);
    }
  };
  
  if (isLoading && groups.length === 0) {
    return <LoadingMessage>그룹 목록을 불러오는 중...</LoadingMessage>;
  }
  
  const renderGroupRows = () => {
    return groups.map(group => (
      <tr key={group.id}>
        <td>{group.name}</td>
        <td>
          {group.students && group.students.length > 0 
            ? group.students.map(student => <Badge key={student.id}>{student.name}</Badge>)
            : <span>학생 없음</span>
          }
        </td>
        <td>{new Date(group.createdAt).toLocaleDateString()}</td>
        <td>
          <ActionButtons>
            <Button 
              $primary
              onClick={() => handleEditClick(group)}
            >
              수정
            </Button>
            <Button 
              $danger
              onClick={() => handleDeleteClick(group.id)}
            >
              삭제
            </Button>
          </ActionButtons>
        </td>
      </tr>
    ));
  };
  
  return (
    <Container>
      <Title>그룹 관리</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ActionsRow>
        <div></div> {/* Placeholder for alignment */}
        <Button $primary onClick={handleAddClick}>+ 그룹 추가</Button>
      </ActionsRow>
      
      {!isLoading && groups.length === 0 ? (
        <EmptyMessage>등록된 그룹이 없습니다.</EmptyMessage>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>학생 수</th>
              <th>생성일</th>
              <th>작업</th>
            </tr>
          </TableHead>
          <TableBody>
            {renderGroupRows()}
          </TableBody>
        </Table>
      )}
      
      {/* Add/Edit Group Modal */}
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>{modalMode === 'add' ? '그룹 추가' : '그룹 정보 수정'}</h3>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleFormSubmit}>
              <FormGroup>
                <label htmlFor="name">그룹 이름</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleFormChange}
                  required
                />
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

export default GroupsTab; 