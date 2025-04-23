import React from 'react';
import { useNavigate } from 'react-router-dom';

function Homepage() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <h1>Hairalyze</h1>
      <p>Your personalized hair care solution</p>
      <button
        className="hairalyze-btn"
        onClick={() => navigate('/questionnaire')}
      >
        Hairalyze my Hair
      </button>
    </header>
  );
}

export default Homepage;
