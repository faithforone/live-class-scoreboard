import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import api from '../../../utils/api';
import * as adminService from '../../../services/adminService';

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

const Section = styled.section`
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  color: #3f51b5;
  margin-bottom: 15px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
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

const Button = styled.button`
  background-color: ${props => props.$danger ? '#f44336' : props.$primary ? '#3f51b5' : '#f0f0f0'};
  color: ${props => (props.$danger || props.$primary) ? 'white' : '#333'};
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${props => props.$bold ? 'bold' : 'normal'};
  align-self: flex-start;
  
  &:hover {
    background-color: ${props => props.$danger ? '#d32f2f' : props.$primary ? '#303f9f' : '#e0e0e0'};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
`;

const RankingPeriodRow = styled.div`
  display: flex;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

function SettingsTab() {
  // Password settings
  const [passwordFormData, setPasswordFormData] = useState({
    teacherPassword: '',
    adminPassword: ''
  });
  
  // Ranking period settings
  const [rankingFormData, setRankingFormData] = useState({
    periodType: 'weekly',
    startDate: '',
    endDate: ''
  });
  
  // Status messages
  const [passwordStatus, setPasswordStatus] = useState({
    success: false,
    error: null
  });
  
  const [rankingStatus, setRankingStatus] = useState({
    success: false,
    error: null
  });
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData({
      ...passwordFormData,
      [name]: value
    });
    
    // Clear status messages when form changes
    setPasswordStatus({ success: false, error: null });
  };
  
  // Handle ranking form changes
  const handleRankingChange = (e) => {
    const { name, value } = e.target;
    setRankingFormData({
      ...rankingFormData,
      [name]: value
    });
    
    // Clear status messages when form changes
    setRankingStatus({ success: false, error: null });
  };
  
  // Update passwords
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update teacher password
      if (passwordFormData.teacherPassword) {
        await api.post('/admin/password', {
          type: 'teacher_password',
          password: passwordFormData.teacherPassword
        });
      }
      
      // Update admin password
      if (passwordFormData.adminPassword) {
        await api.post('/admin/password', {
          type: 'admin_password',
          password: passwordFormData.adminPassword
        });
      }
      
      // Show success message and reset form
      setPasswordStatus({ success: true, error: null });
      setPasswordFormData({
        teacherPassword: '',
        adminPassword: ''
      });
    } catch (err) {
      setPasswordStatus({ 
        success: false, 
        error: '비밀번호 업데이트 중 오류가 발생했습니다.' 
      });
      console.error('Error updating passwords:', err);
    }
  };
  
  // Update ranking period
  const handleRankingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/admin/ranking-period', rankingFormData);
      
      // Show success message
      setRankingStatus({ success: true, error: null });
    } catch (err) {
      setRankingStatus({ 
        success: false, 
        error: '랭킹 기간 설정 중 오류가 발생했습니다.' 
      });
      console.error('Error updating ranking period:', err);
    }
  };
  
  // Set default ranking period dates if not set
  useEffect(() => {
    if (!rankingFormData.startDate || !rankingFormData.endDate) {
      const today = new Date();
      
      // For weekly, set to current week (Sunday to Saturday)
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek); // Previous Sunday
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Saturday
      
      setRankingFormData({
        ...rankingFormData,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    }
  }, []);
  
  // When period type changes, update date ranges
  useEffect(() => {
    const today = new Date();
    let startDate, endDate;
    
    switch (rankingFormData.periodType) {
      case 'weekly':
        // Set to current week (Sunday to Saturday)
        const dayOfWeek = today.getDay(); // 0 is Sunday
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek); // Previous Sunday
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Saturday
        break;
        
      case 'monthly':
        // Set to current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
        
      case 'semester':
        // Set to current semester (example: Jan-Jun or Jul-Dec)
        const month = today.getMonth();
        if (month < 6) {
          // First semester
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 5, 30);
        } else {
          // Second semester
          startDate = new Date(today.getFullYear(), 6, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
        }
        break;
        
      default:
        startDate = today;
        endDate = today;
    }
    
    setRankingFormData({
      ...rankingFormData,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, [rankingFormData.periodType]);
  
  return (
    <Container>
      <Title>시스템 설정</Title>
      
      <Section>
        <SectionTitle>비밀번호 관리</SectionTitle>
        <Form onSubmit={handlePasswordSubmit}>
          <FormGroup>
            <label htmlFor="teacherPassword">선생님 비밀번호</label>
            <input 
              type="password" 
              id="teacherPassword" 
              name="teacherPassword" 
              value={passwordFormData.teacherPassword} 
              onChange={handlePasswordChange}
              placeholder="새 비밀번호 입력"
            />
          </FormGroup>
          
          <FormGroup>
            <label htmlFor="adminPassword">관리자 비밀번호</label>
            <input 
              type="password" 
              id="adminPassword" 
              name="adminPassword" 
              value={passwordFormData.adminPassword} 
              onChange={handlePasswordChange}
              placeholder="새 비밀번호 입력"
            />
          </FormGroup>
          
          <Button 
            $primary 
            type="submit"
            disabled={!passwordFormData.teacherPassword && !passwordFormData.adminPassword}
          >
            비밀번호 업데이트
          </Button>
          
          {passwordStatus.success && (
            <SuccessMessage>비밀번호가 성공적으로 업데이트되었습니다.</SuccessMessage>
          )}
          
          {passwordStatus.error && (
            <ErrorMessage>{passwordStatus.error}</ErrorMessage>
          )}
        </Form>
      </Section>
      
      <Section>
        <SectionTitle>랭킹 기간 설정</SectionTitle>
        <Form onSubmit={handleRankingSubmit}>
          <FormGroup>
            <label htmlFor="periodType">기간 유형</label>
            <select 
              id="periodType" 
              name="periodType" 
              value={rankingFormData.periodType} 
              onChange={handleRankingChange}
            >
              <option value="weekly">주간</option>
              <option value="monthly">월간</option>
              <option value="semester">학기</option>
            </select>
          </FormGroup>
          
          <RankingPeriodRow>
            <FormGroup>
              <label htmlFor="startDate">시작일</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                value={rankingFormData.startDate} 
                onChange={handleRankingChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="endDate">종료일</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                value={rankingFormData.endDate} 
                onChange={handleRankingChange}
                required
              />
            </FormGroup>
          </RankingPeriodRow>
          
          <Button $primary type="submit">랭킹 기간 설정</Button>
          
          {rankingStatus.success && (
            <SuccessMessage>랭킹 기간이 성공적으로 설정되었습니다.</SuccessMessage>
          )}
          
          {rankingStatus.error && (
            <ErrorMessage>{rankingStatus.error}</ErrorMessage>
          )}
        </Form>
      </Section>
      
      <Section>
        <SectionTitle>데이터 관리</SectionTitle>
        <p style={{ marginBottom: '15px' }}>
          아래 작업은 데이터베이스에 영구적인 변경을 가합니다. 주의해서 사용하세요.
        </p>
        
        <Button 
          $danger
          onClick={() => {
            if (window.confirm('정말 모든 점수 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
              adminService.resetScores({ type: 'all' })
                .then(() => alert('모든 점수가 초기화되었습니다.'))
                .catch(err => {
                  console.error('Error resetting scores:', err);
                  alert('점수 초기화 중 오류가 발생했습니다.');
                });
            }
          }}
        >
          모든 점수 초기화
        </Button>
      </Section>
    </Container>
  );
}

export default SettingsTab; 