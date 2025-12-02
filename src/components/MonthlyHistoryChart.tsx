import { HistoryPoint } from "../models/historyPoint";
import { formatMonthLabel, formatCurrency } from "../utils/formatters";

interface MonthlyHistoryChartProps {
  points: HistoryPoint[];
}

type ChartPoint = {
  x: number;
  y: number;
};

function buildHistoryChartData(history: HistoryPoint[]): {
  path: string;
  points: ChartPoint[];
} {
  if (!history || history.length < 2) {
    return { path: "", points: [] };
  }

  const maxAmount = Math.max(...history.map((point) => point.amount || 0));
  if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
    return { path: "", points: [] };
  }

  const count = history.length;
  const chartPoints = history.map((point, index) => {
    const ratio = (point.amount || 0) / maxAmount;
    const x = count === 1 ? 50 : (index / (count - 1)) * 100;
    const y = 95 - ratio * 80;
    return { x, y };
  });

  const path = chartPoints
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  return { path, points: chartPoints };
}

function MonthlyHistoryChart({ points }: MonthlyHistoryChartProps) {
  if (!points.length) {
    return (
      <p className="page-message">אין נתוני היסטוריה להצגה.</p>
    );
  }

  const safePoints = points.filter((p) =>
    typeof p.amount === "number" && Number.isFinite(p.amount)
  );

  const { path, points: chartPoints } = buildHistoryChartData(safePoints);

  if (!path || chartPoints.length < 2) {
    return (
      <p className="page-message">אין נתוני היסטוריה חיוביים להצגה.</p>
    );
  }

  return (
    <div className="chart-container">
      <h2 className="chart-title">התפתחות סכום הקופות לפי חודשים</h2>
      <div className="chart-body">
        <div className="history-chart">
          <svg
            viewBox="0 0 100 100"
            className="history-chart-svg"
            preserveAspectRatio="none"
          >
            <path d={path} className="history-chart-line" />
            {chartPoints.map((point, index) => (
              <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={point.x}
                cy={point.y}
                r={1.5}
                className="history-chart-point"
              />
            ))}
          </svg>
          <div className="history-chart-labels">
            {safePoints.map((p) => (
              <div key={p.month} className="history-chart-label">
                <span className="history-chart-label-month">
                  {formatMonthLabel(p.month)}
                </span>
                <span className="history-chart-label-value">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyHistoryChart;
