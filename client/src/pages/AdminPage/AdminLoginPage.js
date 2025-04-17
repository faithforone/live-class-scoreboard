import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Container = styled.div`
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
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
  
  input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const Button = styled.button`
  background-color: #3f51b5;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 10px;
  
  &:hover {
    background-color: #303f9f;
  }
  
  &:disabled {
    background-color: #9fa8da;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
`;

function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if already logged in
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // For demonstration, using a simple token generation
      // In production, you would validate against your backend
      const response = await axios.post('/api/admin/login', { password });
      
      // Store auth data in localStorage
      localStorage.setItem('adminAuth', JSON.stringify({
        token: response.data.token,
        role: 'admin'
      }));
      
      // Redirect to dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('관리자 로그인에 실패했습니다. 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simple login for development
  const handleDevLogin = () => {
    localStorage.setItem('adminAuth', JSON.stringify({
      token: 'dev-token-123',
      role: 'admin'
    }));
    navigate('/admin/dashboard');
  };
  
  return (
    <Container>
      <Title>관리자 로그인</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <label htmlFor="password">관리자 비밀번호</label>
          <input 
            type="password" 
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </Form>
      
      {process.env.NODE_ENV === 'development' && (
        <Button onClick={handleDevLogin} style={{ marginTop: '20px', backgroundColor: '#4caf50' }}>
          개발 모드 로그인
        </Button>
      )}
    </Container>
  );
}

export default AdminLoginPage;