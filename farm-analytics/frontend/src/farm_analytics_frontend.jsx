import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ChangePasswordModal from './ChangePasswordModal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const Dashboard = ({ token, onLogout }) => {
  const [kpis, setKpis] = useState(null);
  const [channelData, setChannelData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const authFetch = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      onLogout();
      throw new Error('Session expired');
    }
    return res.json();
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [kpiData, channelDataRes, dailyDataRes, abData, funnelData] = await Promise.all([
        authFetch('/kpis/summary'),
        authFetch('/campaigns/summary'),
        authFetch('/campaigns/daily'),
        authFetch('/ab-tests'),
        authFetch('/funnel')
      ]);

      setKpis(kpiData);
      setChannelData(channelDataRes);
      setDailyData(dailyDataRes);
      setAbTests(abData);
      setFunnel(funnelData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading Analytics Dashboard...</div>
      </div>
    );
  }

  const channelColors = {
    email: '#8b5cf6',
    social: '#06b6d4',
    paid_ads: '#ef4444',
    organic: '#10b981'
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerActions}>
          <button style={styles.headerButton} onClick={() => setShowChangePassword(true)}>Change Password</button>
          <button style={styles.headerButton} onClick={onLogout}>Log Out</button>
        </div>
        <h1>📊 Digital Marketing Analytics Dashboard</h1>
        <p style={styles.subtitle}>Real-time campaign performance tracking</p>
      </div>

      {showChangePassword && (
        <ChangePasswordModal token={token} onClose={() => setShowChangePassword(false)} />
      )}

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        {['overview', 'campaigns', 'testing', 'funnel'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab - KPIs */}
      {activeTab === 'overview' && kpis && (
        <div>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <KPICard label="Total Impressions" value={kpis.total_impressions.toLocaleString()} icon="👁️" />
            <KPICard label="Total Clicks" value={kpis.total_clicks.toLocaleString()} icon="🖱️" />
            <KPICard label="Total Conversions" value={kpis.total_conversions.toLocaleString()} icon="✅" />
            <KPICard label="Total Revenue" value={`$${kpis.total_revenue.toLocaleString()}`} icon="💰" />
          </div>

          <div style={styles.kpiGrid}>
            <KPICard label="Avg CTR %" value={kpis.avg_ctr.toFixed(2)} icon="📈" color="#06b6d4" />
            <KPICard label="Avg Conversion %" value={kpis.avg_conversion_rate.toFixed(2)} icon="🎯" color="#10b981" />
            <KPICard label="Avg CPA" value={`$${kpis.avg_cpa.toFixed(2)}`} icon="💳" color="#ef4444" />
            <KPICard label="Avg ROI %" value={kpis.avg_roi.toFixed(2)} icon="📊" color="#8b5cf6" />
          </div>

          {/* Channel Performance */}
          <div style={styles.section}>
            <h2>📢 Channel Performance Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="total_conversions" fill="#10b981" name="Conversions" />
                <Bar yAxisId="right" dataKey="total_spend" fill="#ef4444" name="Spend ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Metrics Table */}
          <div style={styles.section}>
            <h2>📋 Detailed Channel Metrics</h2>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Channel</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>Conversions</th>
                  <th>CTR %</th>
                  <th>Conv. Rate %</th>
                  <th>CPA</th>
                  <th>ROI %</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map(channel => (
                  <tr key={channel.channel} style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, fontWeight: 'bold', color: channelColors[channel.channel] }}>
                      {channel.channel}
                    </td>
                    <td style={styles.tableCell}>{channel.total_impressions.toLocaleString()}</td>
                    <td style={styles.tableCell}>{channel.total_clicks.toLocaleString()}</td>
                    <td style={styles.tableCell}>{channel.total_conversions.toLocaleString()}</td>
                    <td style={styles.tableCell}>{channel.avg_ctr.toFixed(2)}%</td>
                    <td style={styles.tableCell}>{channel.avg_conversion_rate.toFixed(2)}%</td>
                    <td style={styles.tableCell}>${channel.cpa.toFixed(2)}</td>
                    <td style={{ ...styles.tableCell, color: channel.roi > 0 ? '#10b981' : '#ef4444' }}>
                      {channel.roi.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns Tab - Daily Trends */}
      {activeTab === 'campaigns' && dailyData.length > 0 && (
        <div style={styles.section}>
          <h2>📅 Daily Campaign Trends (Last 30 Days)</h2>
          
          <div style={styles.chartRow}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ctr" stroke="#06b6d4" name="CTR %" />
                <Line type="monotone" dataKey="conversion_rate" stroke="#10b981" name="Conv. Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartRow}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#8b5cf6" name="Impressions" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#f59e0b" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartRow}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#ef4444" name="Spend ($)" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* A/B Testing Tab */}
      {activeTab === 'testing' && abTests.length > 0 && (
        <div style={styles.section}>
          <h2>🧪 A/B Test Results</h2>
          <div style={styles.testsGrid}>
            {abTests.map(test => (
              <div key={test.test_id} style={styles.testCard}>
                <div style={styles.testHeader}>
                  <h3>{test.test_id}</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: test.winner === 'A' ? '#3b82f6' : '#8b5cf6'
                  }}>
                    {test.winner === 'A' ? 'Variant A Wins' : 'Variant B Wins'}
                  </span>
                </div>
                
                <div style={styles.testContent}>
                  <p><strong>Metric:</strong> {test.metric.toUpperCase()}</p>
                  
                  <div style={styles.variantRow}>
                    <div>
                      <p style={styles.variantLabel}>Variant A</p>
                      <p style={styles.variantText}>{test.variant_a}</p>
                      <p style={styles.variantValue}>{test.variant_a_value}%</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={styles.variantLabel}>vs</p>
                    </div>
                    <div>
                      <p style={styles.variantLabel}>Variant B</p>
                      <p style={styles.variantText}>{test.variant_b}</p>
                      <p style={styles.variantValue}>{test.variant_b_value}%</p>
                    </div>
                  </div>
                  
                  <p><strong>Confidence:</strong> {test.confidence}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnel Tab */}
      {activeTab === 'funnel' && funnel.length > 0 && (
        <div style={styles.section}>
          <h2>🔗 Conversion Funnel Analysis</h2>
          
          <div style={styles.funnelContainer}>
            {funnel.map((stage, index) => (
              <div key={stage.stage} style={styles.funnelStage}>
                <div style={{
                  ...styles.funnelBar,
                  width: `${(stage.users / funnel[0].users) * 100}%`,
                  backgroundColor: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]
                }}>
                  <span style={styles.funnelText}>
                    {stage.stage}: {stage.users.toLocaleString()} users
                    {stage.drop_off_rate > 0 && ` (-${stage.drop_off_rate.toFixed(1)}%)`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.funnelStats}>
            <h3>Funnel Summary</h3>
            <p>Entry: {funnel[0]?.users.toLocaleString()} users</p>
            <p>Exit: {funnel[funnel.length - 1]?.users.toLocaleString()} users</p>
            <p>Overall Conversion: {((funnel[funnel.length - 1]?.users / funnel[0]?.users) * 100).toFixed(2)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard = ({ label, value, icon, color }) => (
  <div style={{
    ...styles.card,
    borderLeftColor: color || '#06b6d4'
  }}>
    <div style={styles.cardContent}>
      <span style={styles.cardIcon}>{icon}</span>
      <div>
        <p style={styles.cardLabel}>{label}</p>
        <p style={styles.cardValue}>{value}</p>
      </div>
    </div>
  </div>
);

// Styles
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    display: 'flex',
    gap: '10px',
  },
  headerButton: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 14px',
    color: '#e2e8f0',
    fontSize: '13px',
    cursor: 'pointer',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginTop: '5px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '1px solid #334155',
    paddingBottom: '10px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  tabActive: {
    color: '#06b6d4',
    borderBottom: '2px solid #06b6d4',
    paddingBottom: '8px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderLeft: '4px solid #06b6d4',
    borderRadius: '8px',
    padding: '20px',
    transition: 'all 0.3s',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
  },
  cardIcon: {
    fontSize: '32px',
  },
  cardLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '0 0 5px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
  },
  section: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '25px',
    marginBottom: '25px',
  },
  chartRow: {
    marginBottom: '30px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
  },
  tableHeader: {
    backgroundColor: '#0f172a',
    borderBottom: '2px solid #334155',
  },
  tableRow: {
    borderBottom: '1px solid #334155',
    transition: 'background-color 0.2s',
  },
  tableCell: {
    padding: '12px 15px',
    textAlign: 'left',
    fontSize: '13px',
  },
  testsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  testCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '20px',
  },
  testHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    borderBottom: '1px solid #334155',
    paddingBottom: '10px',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
  },
  testContent: {
    fontSize: '13px',
  },
  variantRow: {
    display: 'flex',
    justifyContent: 'space-around',
    margin: '15px 0',
    padding: '15px 0',
    borderTop: '1px solid #334155',
    borderBottom: '1px solid #334155',
  },
  variantLabel: {
    color: '#94a3b8',
    fontSize: '11px',
    margin: '0 0 5px 0',
    textTransform: 'uppercase',
  },
  variantText: {
    fontSize: '12px',
    margin: '5px 0',
  },
  variantValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '5px 0 0 0',
  },
  funnelContainer: {
    margin: '20px 0',
  },
  funnelStage: {
    marginBottom: '15px',
  },
  funnelBar: {
    minHeight: '40px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '15px',
    transition: 'width 0.3s',
  },
  funnelText: {
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
  },
  funnelStats: {
    backgroundColor: '#0f172a',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
    fontSize: '13px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#94a3b8',
  },
};

export default Dashboard;
