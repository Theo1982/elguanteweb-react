// src/components/TestComponent.jsx
import React from 'react';

const TestComponent = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'yellow',
        padding: '20px',
        border: '2px solid red',
        borderRadius: '10px',
        zIndex: 9999,
      }}
    >
      <h2>🧪 TEST COMPONENT</h2>
      <p>Si ves esto, React está funcionando correctamente</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestComponent;
