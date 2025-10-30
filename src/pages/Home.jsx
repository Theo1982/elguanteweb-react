import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <Link to="/shop">
        <img
          src={logo}
          alt="ElGuante"
          style={{
            width: '300px',
            height: 'auto',
            cursor: 'pointer',
            transition: 'transform 0.3s ease',
          }}
          onMouseOver={e => (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={e => (e.target.style.transform = 'scale(1)')}
        />
      </Link>
    </div>
  );
}
