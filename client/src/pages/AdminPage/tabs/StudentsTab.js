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

// Add a new styled component for checkbox groups
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

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentStudent, setCurrentStudent] = useState(null);
  
  // Form state - Update to use groupIds array instead of group_id
  const [formData, setFormData] = useState({
    name: '',
    groupIds: []
  });
  
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/students');
      setStudents(response.data);
      setError(null);
    } catch (err) {
      setError('학생 목록을 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/admin/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };
  
  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, []);
  
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      name: '',
      groupIds: []
    });
    setShowModal(true);
  };
  
  const handleEditClick = (student) => {
    setModalMode('edit');
    setCurrentStudent(student);
    
    // Extract group IDs from student.groups array
    const groupIds = student.groups ? student.groups.map(group => group.id) : [];
    
    setFormData({
      name: student.name,
      groupIds: groupIds
    });
    setShowModal(true);
  };
  
  const handleDeleteClick = async (studentId) => {
    if (!window.confirm('정말 이 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/students/${studentId}`);
      
      // Update local state
      setStudents(students.filter(student => student.id !== studentId));
    } catch (err) {
      setError('학생 삭제 중 오류가 발생했습니다.');
      console.error('Error deleting student:', err);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // New handler for group checkbox changes
  const handleGroupCheckboxChange = (groupId) => {
    const updatedGroupIds = formData.groupIds.includes(groupId)
      ? formData.groupIds.filter(id => id !== groupId)
      : [...formData.groupIds, groupId];
    
    setFormData({
      ...formData,
      groupIds: updatedGroupIds
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'add') {
        // Add new student
        const response = await axios.post('/api/admin/students', formData);
        setStudents([...students, response.data]);
      } else {
        // Edit existing student
        const response = await axios.put(`/api/admin/students/${currentStudent.id}`, formData);
        setStudents(students.map(student => 
          student.id === currentStudent.id ? response.data : student
        ));
      }
      
      // Close modal after successful operation
      setShowModal(false);
    } catch (err) {
      setError(modalMode === 'add' ? '학생 추가 중 오류가 발생했습니다.' : '학생 정보 수정 중 오류가 발생했습니다.');
      console.error(`Error ${modalMode === 'add' ? 'adding' : 'updating'} student:`, err);
    }
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading && students.length === 0) {
    return <LoadingMessage>학생 목록을 불러오는 중...</LoadingMessage>;
  }
  
  return (
    <Container>
      <Title>학생 관리</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ActionsRow>
        <SearchInput 
          type="text" 
          placeholder="학생 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button primary onClick={handleAddClick}>+ 학생 추가</Button>
      </ActionsRow>
      
      {!isLoading && filteredStudents.length === 0 ? (
        <EmptyMessage>
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
        </EmptyMessage>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>그룹</th>
              <th>상태</th>
              <th>등록일</th>
              <th>작업</th>
            </tr>
          </TableHead>
          <TableBody>
            {filteredStudents.map(student => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>
                  {student.groups?.map(group => (
                    <GroupBadge key={group.id}>{group.name}</GroupBadge>
                  ))}
                </td>
                <td>
                  <Badge active={student.status === '수업중'}>
                    {student.status}
                  </Badge>
                </td>
                <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                <td>
                  <ActionButtons>
                    <Button onClick={() => handleEditClick(student)}>수정</Button>
                    <Button 
                      danger 
                      onClick={() => handleDeleteClick(student.id)}
                      disabled={student.status === '수업중'}
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
      
      {/* Add/Edit Student Modal */}
      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>{modalMode === 'add' ? '학생 추가' : '학생 정보 수정'}</h3>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <label htmlFor="name">이름</label>
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
                <label>그룹 (복수 선택 가능)</label>
                <CheckboxGroup>
                  {groups.map(group => (
                    <CheckboxLabel key={group.id}>
                      <input 
                        type="checkbox" 
                        checked={formData.groupIds.includes(group.id)} 
                        onChange={() => handleGroupCheckboxChange(group.id)}
                      />
                      {group.name}
                    </CheckboxLabel>
                  ))}
                </CheckboxGroup>
              </FormGroup>
              
              <ModalFooter>
                <Button onClick={() => setShowModal(false)}>취소</Button>
                <Button primary type="submit">
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

export default StudentsTab; 