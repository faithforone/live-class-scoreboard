import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as teacherService from '../../services/teacherService';
import './RankingPage.css';

function RankingPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getStudentRankings(periodFilter);
        console.log('Rankings data received:', data);
        setRankings(data);
      } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('랭킹 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankings();
  }, [periodFilter]);
  
  const handlePeriodChange = (event) => {
    setPeriodFilter(event.target.value);
  };
  
  if (loading) {
    return <div className="loading">랭킹 데이터를 불러오는 중...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="ranking-container">
      <header className="ranking-header">
        <h1>학생 랭킹</h1>
        <div className="period-filter">
          <label htmlFor="period-select">기간:</label>
          <select 
            id="period-select" 
            value={periodFilter} 
            onChange={handlePeriodChange}
          >
            <option value="all">전체</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
        </div>
      </header>
      
      <div className="ranking-list">
        {rankings.length === 0 ? (
          <div className="no-data">표시할 랭킹 데이터가 없습니다.</div>
        ) : (
          <table className="ranking-table">
            <thead>
              <tr>
                <th className="rank-column">순위</th>
                <th className="name-column">이름</th>
                <th className="score-column">점수</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((student, index) => {
                console.log(`Student ${index}: ${student.name}, Score: ${student.totalScore}`);
                return (
                  <tr key={student.id} className={index < 3 ? `top-${index + 1}` : ''}>
                    <td className="rank-column">
                      {index + 1}
                      {index < 3 && <span className="rank-badge">🏆</span>}
                    </td>
                    <td className="name-column">{student.name}</td>
                    <td className="score-column">{student.totalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RankingPage;