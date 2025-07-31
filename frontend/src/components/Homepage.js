import React from 'react';
import { useNavigate } from 'react-router-dom';

function Homepage() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <h1>Hairalyzer</h1>
      <p>Your personalized hair care solution</p>
      <button
        className="hairalyze-btn"
        onClick={() => navigate('/questionnaire')}
      >
        Analyze my Hair
      </button>
    </header>
  );
}

export default Homepage;
