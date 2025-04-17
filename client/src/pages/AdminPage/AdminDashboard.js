import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Components for each tab
import ActiveClassesTab from './tabs/ActiveClassesTab';
import StudentsTab from './tabs/StudentsTab';
import GroupsTab from './tabs/GroupsTab';
import TemplatesTab from './tabs/TemplatesTab';
import SettingsTab from './tabs/SettingsTab';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #333;
  font-size: 28px;
`;

const LogoutButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  padding: 12px 20px;
  background-color: ${props => props.$active ? '#3f51b5' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#555'};
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.$active ? '#3f51b5' : '#f0f0f0'};
  }
`;

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active-classes');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };
  
  return (
    <Container>
      <Header>
        <Title>관리자 대시보드</Title>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
      </Header>
      
      <TabBar>
        <Tab 
          $active={activeTab === 'active-classes'} 
          onClick={() => setActiveTab('active-classes')}
        >
          현재 수업
        </Tab>
        <Tab 
          $active={activeTab === 'students'} 
          onClick={() => setActiveTab('students')}
        >
          학생 관리
        </Tab>
        <Tab 
          $active={activeTab === 'groups'} 
          onClick={() => setActiveTab('groups')}
        >
          그룹 관리
        </Tab>
        <Tab 
          $active={activeTab === 'templates'} 
          onClick={() => setActiveTab('templates')}
        >
          수업 템플릿
        </Tab>
        <Tab 
          $active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          설정
        </Tab>
      </TabBar>
      
      {/* Display appropriate tab content */}
      {activeTab === 'active-classes' && <ActiveClassesTab />}
      {activeTab === 'students' && <StudentsTab />}
      {activeTab === 'groups' && <GroupsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </Container>
  );
}

export default AdminDashboard;