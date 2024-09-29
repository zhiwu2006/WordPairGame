import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ 
      backgroundColor: '#e9ecef', 
      minHeight: '100vh', 
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;