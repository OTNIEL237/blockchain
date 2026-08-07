import React, { useState, useEffect, useRef } from 'react';
import { Search, Cuboid, ArrowRightLeft, ArrowLeft, Moon, Sun, Edit2, Clock, Users, BarChart2 } from 'lucide-react';
import io from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Connect to the backend socket (uses env variable in production, fallback to origin)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);
const socket = io(BACKEND_URL);

function App() {
  const [blocks, setBlocks] = useState([]);
  const [pendingTxs, setPendingTxs] = useState([]);
  const [networkStats, setNetworkStats] = useState(null);
  
  // Socket State
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  // New States
  const [richList, setRichList] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [nameTags, setNameTags] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [flash, setFlash] = useState(false);
  
  const [searchInput, setSearchInput] = useState('');
  const [currentView, setCurrentView] = useState('home'); // home, blockchain, block, transaction, address, mempool, richlist, charts
  const [detailData, setDetailData] = useState(null);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dim');
    else if (theme === 'dim') setTheme('dark');
    else setTheme('light');
  };

  useEffect(() => {
    // Apply Theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Load Name Tags
    const savedTags = localStorage.getItem('sango_nametags');
    if (savedTags) setNameTags(JSON.parse(savedTags));

    // Listen to Real-time Updates
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('update_chain', () => {
      fetchData();
      triggerFlash();
    });
    socket.on('update_pending', () => {
      fetchPending();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('update_chain');
      socket.off('update_pending');
    };
  }, []);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
  };

  const fetchData = () => {
    fetch(`${BACKEND_URL}/api/blocks`).then(res => res.json()).then(data => setBlocks(data.reverse()));
    fetch(`${BACKEND_URL}/api/network-stats`).then(res => res.json()).then(data => setNetworkStats(data));
    fetch(`${BACKEND_URL}/api/rich-list`).then(res => res.json()).then(data => setRichList(data));
    fetch(`${BACKEND_URL}/api/chart-data`).then(res => res.json()).then(data => setChartData(data));
  };

  const fetchPending = () => {
    fetch(`${BACKEND_URL}/api/pending`).then(res => res.json()).then(data => setPendingTxs(data));
  };

  useEffect(() => {
    fetchData();
    fetchPending();

    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchInput(searchParam);
      executeSearch(searchParam);
    }
  }, []); // Run once on mount

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchInput) return;
    executeSearch(searchInput.trim());
  };

  const executeSearch = (query) => {
    if (!isNaN(query) && !query.includes(' ')) {
      fetch(`${BACKEND_URL}/api/block/index/${query}`)
        .then(r => r.json())
        .then(d => {
          if (d.block) { setDetailData(d.block); setCurrentView('block'); } 
          else alert('Bloc non trouvé');
        });
      return;
    }
    if (query.includes('BEGIN PUBLIC KEY')) {
      fetch(`${BACKEND_URL}/api/address-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: query })
      })
      .then(r => r.json())
      .then(d => {
          if (d.addressData) { setDetailData({ address: query, ...d.addressData }); setCurrentView('address'); } 
          else alert('Erreur de chargement de l\'adresse');
      });
      return;
    }
    fetch(`${BACKEND_URL}/api/block/hash/${query}`)
      .then(r => r.json())
      .then(d => {
        if (d.block) { setDetailData(d.block); setCurrentView('block'); } 
        else {
          fetch(`${BACKEND_URL}/api/transaction/${query}`)
            .then(r => r.json())
            .then(d2 => {
              if (d2.transaction) { setDetailData(d2); setCurrentView('transaction'); } 
              else alert('Aucun résultat trouvé pour cette recherche.');
            });
        }
      });
  };

  const saveNameTag = (address, name) => {
    const updated = { ...nameTags, [address.replace(/\s+/g, '')]: name };
    if (!name) delete updated[address.replace(/\s+/g, '')];
    setNameTags(updated);
    localStorage.setItem('sango_nametags', JSON.stringify(updated));
  };

  const getDisplayName = (address) => {
    if (!address) return 'System';
    const norm = address.replace(/\s+/g, '');
    if (nameTags[norm]) return <span className="badge" style={{background: 'var(--primary-color)', color: '#fff'}}>{nameTags[norm]}</span>;
    return address.substring(0, 8) + '...';
  };

  const renderHome = () => (
    <div>
      {networkStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginBottom: '5px' }}>SGC PRICE</div>
            <div style={{ fontWeight: 'bold' }}>$0.00 <span style={{ color: '#58e192', fontSize: '0.8rem' }}>(+0.00%)</span></div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginBottom: '5px' }}>TOTAL TRANSACTIONS</div>
            <div style={{ fontWeight: 'bold' }}>{networkStats.totalTransactions}</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginBottom: '5px' }}>TOTAL SUPPLY</div>
            <div style={{ fontWeight: 'bold' }}>{networkStats.totalSupply} SGC</div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginBottom: '5px' }}>ACTIVE NODES</div>
            <div style={{ fontWeight: 'bold' }}>{networkStats.nodesCount}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: 0 }}>
          <h2 style={{ padding: '1.2rem 1.5rem 1rem', margin: 0, borderBottom: '1px solid var(--border-color)', fontSize: '1.1rem' }}>Latest Blocks</h2>
          <div className="list-container" style={{ padding: '0 1.5rem' }}>
              {blocks.slice(0, 10).map((block) => (
                <div key={block.hash} className={`list-item ${flash && block === blocks[0] ? 'flash-update' : ''}`}>
                  <div className="list-item-left">
                    <div className="list-item-icon"><Cuboid size={20} color="var(--muted-text)" /></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="link" style={{ fontWeight: '500', cursor: 'pointer' }} onClick={() => { setSearchInput(block.index.toString()); executeSearch(block.index.toString()); }}>{block.index}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>{Math.floor(Math.max(0, (Date.now() - block.timestamp) / 1000))} secs ago</span>
                    </div>
                  </div>
                  <div className="list-item-middle">
                    <div style={{ fontSize: '0.9rem' }}>Fee Recipient <span className="link">System</span></div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}><span className="link" style={{ fontWeight: '500' }}>{block.transactions.length} txns</span></div>
                  </div>
                  <div className="list-item-right">
                    <span className="badge" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>3.00 SGC</span>
                  </div>
                </div>
              ))}
          </div>
          <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--icon-bg)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            <button className="link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem', color: 'var(--muted-text)' }} onClick={() => setCurrentView('blockchain')}>VIEW ALL BLOCKS →</button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <h2 style={{ padding: '1.2rem 1.5rem 1rem', margin: 0, borderBottom: '1px solid var(--border-color)', fontSize: '1.1rem' }}>Latest Transactions</h2>
          <div className="list-container" style={{ padding: '0 1.5rem' }}>
              {blocks.flatMap(b => b.transactions).slice(0, 10).map((tx, i) => (
                <div key={i} className={`list-item ${flash && i === 0 ? 'flash-update' : ''}`}>
                  <div className="list-item-left">
                    <div className="list-item-icon" style={{ borderRadius: '50%' }}><ArrowRightLeft size={16} color="var(--muted-text)" /></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="link" style={{ fontWeight: '500', cursor: 'pointer', fontFamily: 'monospace' }} onClick={() => { setSearchInput(tx.hash || ''); executeSearch(tx.hash || ''); }}>{tx.hash ? tx.hash.substring(0, 14) + '...' : 'Pending...'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted-text)' }}>{Math.floor(Math.max(0, (Date.now() - (tx.timestamp || Date.now())) / 1000))} secs ago</span>
                    </div>
                  </div>
                  <div className="list-item-middle">
                    <div style={{ fontSize: '0.9rem' }}>From <span className="link">{getDisplayName(tx.fromAddress)}</span></div>
                    <div style={{ fontSize: '0.9rem' }}>To <span className="link">{getDisplayName(tx.toAddress)}</span></div>
                  </div>
                  <div className="list-item-right">
                    <span className="badge" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>{tx.amount} SGC</span>
                  </div>
                </div>
              ))}
          </div>
          <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--icon-bg)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            <button className="link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem', color: 'var(--muted-text)' }}>VIEW ALL TRANSACTIONS →</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBlockchain = () => (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
        <h2>All Blocks</h2>
      </div>
      <table className="table">
        <thead>
          <tr><th>Block Index</th><th>Hash</th><th>Date Mined</th><th>Transactions</th><th>Action</th></tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={block.hash}>
              <td><span style={{fontWeight: 'bold'}}>#{block.index}</span></td>
              <td style={{fontFamily: 'monospace'}}>{block.hash.substring(0, 20)}...</td>
              <td>{new Date(block.timestamp).toLocaleString()}</td>
              <td>{block.transactions.length} txns</td>
              <td><button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', background: 'var(--border-color)', color: 'var(--text-color)' }} onClick={() => { setSearchInput(block.index.toString()); executeSearch(block.index.toString()); }}>Consulter</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBlock = () => (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
        <h2>Block #{detailData.index}</h2>
      </div>
      <table className="table">
        <tbody>
          <tr><td style={{fontWeight:'bold'}}>Hash:</td><td style={{wordBreak: 'break-all', fontFamily:'monospace'}}>{detailData.hash}</td></tr>
          <tr><td style={{fontWeight:'bold'}}>Previous Hash:</td><td style={{wordBreak: 'break-all', fontFamily:'monospace'}}>{detailData.previousHash}</td></tr>
          <tr><td style={{fontWeight:'bold'}}>Timestamp:</td><td>{new Date(detailData.timestamp).toLocaleString()}</td></tr>
          <tr><td style={{fontWeight:'bold'}}>Transactions:</td><td>{detailData.transactions.length} transactions</td></tr>
          <tr><td style={{fontWeight:'bold'}}>Nonce:</td><td>{detailData.nonce}</td></tr>
        </tbody>
      </table>
      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Transactions in Block</h3>
      <table className="table">
        <thead>
          <tr><th>From</th><th>To</th><th>Amount (SGC)</th><th>Fee (SGC)</th></tr>
        </thead>
        <tbody>
          {detailData.transactions.map((tx, i) => (
            <tr key={i}>
              <td>{getDisplayName(tx.fromAddress)}</td>
              <td>{getDisplayName(tx.toAddress)}</td>
              <td style={{fontWeight:'bold'}}>{tx.amount}</td>
              <td>{tx.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTransaction = () => (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
        <h2>Transaction Details</h2>
      </div>
      <table className="table">
        <tbody>
          <tr><td style={{fontWeight:'bold'}}>Block:</td><td>{detailData.block.index}</td></tr>
          <tr><td style={{fontWeight:'bold'}}>Status:</td><td><span className="badge" style={{background:'#58e192', color:'black'}}>Confirmed</span></td></tr>
          <tr><td style={{fontWeight:'bold'}}>Timestamp:</td><td>{new Date(detailData.block.timestamp).toLocaleString()}</td></tr>
          <tr><td style={{fontWeight:'bold'}}>From:</td><td><textarea readOnly value={detailData.transaction.fromAddress || 'System'} style={{width:'100%', height:'80px', fontFamily:'monospace', resize:'none', border:'none', background:'var(--input-bg)', color:'var(--text-color)', padding:'10px', borderRadius:'8px'}}/></td></tr>
          <tr><td style={{fontWeight:'bold'}}>To:</td><td><textarea readOnly value={detailData.transaction.toAddress} style={{width:'100%', height:'80px', fontFamily:'monospace', resize:'none', border:'none', background:'var(--input-bg)', color:'var(--text-color)', padding:'10px', borderRadius:'8px'}}/></td></tr>
          <tr><td style={{fontWeight:'bold'}}>Value:</td><td style={{fontSize:'1.2rem', fontWeight:'bold'}}>{detailData.transaction.amount} SGC</td></tr>
          <tr><td style={{fontWeight:'bold'}}>Transaction Fee:</td><td>{detailData.transaction.fee} SGC</td></tr>
        </tbody>
      </table>
    </div>
  );

  const renderAddress = () => {
    const normAddress = detailData.address.replace(/\s+/g, '');
    const currentName = nameTags[normAddress] || '';

    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
          <h2>Address Overview</h2>
        </div>
        
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong>Private Tag:</strong>
            <input type="text" placeholder="Not tagged" value={currentName} onChange={(e) => saveNameTag(detailData.address, e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }} />
            <Edit2 size={16} color="var(--muted-text)" />
        </div>

        <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', marginBottom: '2rem' }}>
          <textarea readOnly value={detailData.address} style={{width:'100%', height:'120px', fontFamily:'monospace', resize:'none', border:'1px solid var(--border-color)', background:'var(--card-bg)', color:'var(--text-color)', padding:'10px', borderRadius:'4px'}}/>
        </div>
        <table className="table" style={{ width: '300px', marginBottom: '2rem' }}>
          <tbody>
            <tr><td style={{fontWeight:'bold'}}>SGC Balance:</td><td style={{fontSize:'1.2rem', fontWeight:'bold'}}>{detailData.addressBalance} SGC</td></tr>
          </tbody>
        </table>
        
        <h3 style={{ marginBottom: '1rem' }}>Transactions</h3>
        <table className="table">
          <thead>
            <tr><th>Tx Hash</th><th>Block</th><th>Age</th><th>Type</th><th>Amount (SGC)</th></tr>
          </thead>
          <tbody>
            {detailData.addressTransactions.map((tx, i) => {
              const isSent = tx.fromAddress && tx.fromAddress.replace(/\s+/g, '') === normAddress;
              return (
                <tr key={i}>
                  <td style={{fontFamily:'monospace'}}>{tx.hash ? tx.hash.substring(0, 10) + '...' : 'Pending'}</td>
                  <td>{tx.blockIndex === -1 ? 'Pending' : tx.blockIndex}</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td><span className="badge" style={{background: isSent ? 'var(--icon-bg)' : 'rgba(88, 225, 146, 0.2)', color: isSent ? 'var(--text-color)' : '#1e8e3e'}}>{isSent ? 'OUT' : 'IN'}</span></td>
                  <td style={{fontWeight:'bold'}}>{tx.amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMempool = () => (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
        <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
        <h2>Pending Transactions (Mempool)</h2>
      </div>
      <p style={{ color: 'var(--muted-text)', marginBottom: '1.5rem' }}>Transactions waiting to be mined into a block.</p>
      <table className="table">
        <thead>
          <tr><th>From</th><th>To</th><th>Amount (SGC)</th><th>Fee (SGC)</th></tr>
        </thead>
        <tbody>
          {pendingTxs.map((tx, i) => (
            <tr key={i}>
              <td>{getDisplayName(tx.fromAddress)}</td>
              <td>{getDisplayName(tx.toAddress)}</td>
              <td style={{fontWeight:'bold'}}>{tx.amount}</td>
              <td>{tx.fee}</td>
            </tr>
          ))}
          {pendingTxs.length === 0 && (
            <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: 'var(--muted-text)'}}>Mempool is empty.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderRichList = () => {
    const totalSupply = networkStats ? networkStats.totalSupply : 0;

    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
          <h2>Top Accounts by Balance</h2>
        </div>
        <table className="table">
          <thead>
            <tr><th>Rank</th><th>Address</th><th>Balance (SGC)</th><th>Percentage</th></tr>
          </thead>
          <tbody>
            {richList.map((acc, i) => {
              const percentage = totalSupply > 0 ? ((acc.balance / totalSupply) * 100).toFixed(2) : 0;
              return (
                <tr key={i}>
                  <td>#{i + 1}</td>
                  <td>
                    <span 
                      className="link" 
                      style={{ cursor: 'pointer', fontFamily: 'monospace' }} 
                      onClick={() => { setSearchInput(acc.address); executeSearch(acc.address); }}
                    >
                      {getDisplayName(acc.address)}
                    </span>
                  </td>
                  <td style={{fontWeight:'bold'}}>{acc.balance} SGC</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCharts = () => {
    if (!chartData) return <div className="card">Loading charts...</div>;
    const lineData = {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Transactions per Block',
          data: chartData.data,
          borderColor: '#00d2ff', // Neon Blue
          backgroundColor: 'rgba(0, 210, 255, 0.15)', // Light transparent blue
          borderWidth: 3,
          pointBackgroundColor: 'var(--card-bg)',
          pointBorderColor: '#00d2ff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#00d2ff',
          pointHoverBorderColor: '#fff',
          fill: true,
          tension: 0.4 // Smooth curve
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'var(--bg-color)',
          titleColor: 'var(--text-color)',
          bodyColor: '#00d2ff',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 14 }
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: 'var(--muted-text)', font: { size: 11 } }
        },
        y: {
          grid: { color: 'var(--border-color)', borderDash: [5, 5], drawBorder: false },
          ticks: { color: 'var(--muted-text)', font: { size: 11 }, stepSize: 1 },
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
    };

    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}><ArrowLeft size={24} /></button>
          <div>
            <h2 style={{ margin: 0 }}>Network Analytics</h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', margin: '5px 0 0 0' }}>SangoTech Network Activity (Last 20 Blocks)</p>
          </div>
        </div>
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
          <Line options={chartOptions} data={lineData} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <header>
        <div className="header-content">
          <a href="/" className="logo">Sangoscan</a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span title="Statut Temps Réel (WebSockets)">{isConnected ? '🟢 Live' : '🔴 Hors-ligne'}</span>
            <span style={{ margin: '0 5px', color:'var(--border-color)' }}>|</span>
            <span className="link" style={{cursor:'pointer', color: 'var(--text-color)'}} onClick={() => setCurrentView('home')}>Home</span>
            <span className="link" style={{cursor:'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setCurrentView('blockchain')}><Cuboid size={16}/> Blockchain</span>
            <span className="link" style={{cursor:'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setCurrentView('mempool')}><Clock size={16}/> Mempool</span>
            <span className="link" style={{cursor:'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setCurrentView('richlist')}><Users size={16}/> Top Accounts</span>
            <span className="link" style={{cursor:'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setCurrentView('charts')}><BarChart2 size={16}/> Charts</span>
            
            <span style={{ margin: '0 10px', color:'var(--border-color)' }}>|</span>
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }} title={`Current theme: ${theme}`}>
              {theme === 'light' ? <Moon size={20} /> : theme === 'dim' ? <Moon size={20} color="#6c757d" /> : <Sun size={20} />}
            </button>
          </nav>
        </div>
      </header>
      
      <div className="container">
        <form className="search-box" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search by Address / Txn Hash / Block Index" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit"><Search size={20} /></button>
        </form>

        {currentView === 'home' && renderHome()}
        {currentView === 'blockchain' && renderBlockchain()}
        {currentView === 'block' && renderBlock()}
        {currentView === 'transaction' && renderTransaction()}
        {currentView === 'address' && renderAddress()}
        {currentView === 'mempool' && renderMempool()}
        {currentView === 'richlist' && renderRichList()}
        {currentView === 'charts' && renderCharts()}
      </div>
    </div>
  );
}

export default App;
