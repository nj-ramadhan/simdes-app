import statIconPeople from '../../assets/icon-people.png';
import statIconData from '../../assets/icon-data.png';
import statIconOldman from '../../assets/icon-oldman.png';
import statIconMoney from '../../assets/icon-money.png';

const ICON_MAP = {
  blue: statIconPeople,
  green: statIconData,
  yellow: statIconOldman,
  red: statIconMoney,
};

const STYLE_MAP = {
  blue: {
    bg: 'linear-gradient(135deg, #e0f7ff, #d4efff)',
    accent: '#0066cc',
    icon: '#0066cc',
  },
  green: {
    bg: 'linear-gradient(135deg, #d4ffd4, #b3f0b3)',
    accent: '#00a84d',
    icon: '#00a84d',
  },
  yellow: {
    bg: 'linear-gradient(135deg, #fff5d4, #ffe6a3)',
    accent: '#ff9900',
    icon: '#ff9900',
  },
  red: {
    bg: 'linear-gradient(135deg, #ffd4d4, #ffb3b3)',
    accent: '#cc0000',
    icon: '#cc0000',
  },
};

export default function StatCard({ label, value, color = 'blue' }) {
  const styles = STYLE_MAP[color] || STYLE_MAP.blue;
  const icon = ICON_MAP[color] || ICON_MAP.blue;

  return (
    <div className="stat-card" style={{ background: styles.bg }}>
      <div className="stat-icon" style={{ color: styles.icon }}>
        <img src={icon} alt="" />
      </div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value" style={{ color: styles.accent }}>
          {value}
        </p>
      </div>
      <div className="stat-accent" style={{ background: styles.accent }}></div>
    </div>
  );
}
