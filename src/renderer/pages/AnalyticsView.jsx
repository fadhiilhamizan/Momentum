import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import {
  CheckCircle2, Flame, ListTodo, Trophy, TrendingUp, PieChart as PieIcon, CalendarDays, Lightbulb,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import Heatmap from '../components/Heatmap';
import CountUp from '../components/CountUp';
import {
  PERIODS, periodDays, completionsByDay, projectBreakdown, heatmap, insights,
} from '../utils/analyticsHelpers';
import { levelFromXp, xpFromCompletions } from '../utils/gamification';

export default function AnalyticsView() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const streak = useUserStore((s) => s.streak);
  const theme = useUserStore((s) => s.settings.theme);
  const [period, setPeriod] = useState('month');

  const isLight = theme === 'light';
  const tooltipStyle = {
    background: isLight ? '#ffffff' : '#1a1815',
    border: `1px solid ${isLight ? '#e3ddd0' : '#2a251f'}`,
    borderRadius: 8,
    color: isLight ? '#1f1c17' : '#f5f5f0',
    fontSize: 12,
    boxShadow: isLight ? '0 4px 14px rgba(60,50,20,0.12)' : 'none',
  };

  const data = useMemo(() => {
    const days = periodDays(period);
    const completed = tasks.filter((t) => t.isCompleted).length;
    const open = tasks.filter((t) => !t.isCompleted).length;
    return {
      daily: completionsByDay(tasks, days),
      breakdown: projectBreakdown(tasks, projects),
      hm: heatmap(tasks, 13),
      ins: insights(tasks),
      lvl: levelFromXp(xpFromCompletions(completed)),
      completed,
      open,
    };
  }, [tasks, projects, period]);

  const cards = [
    { icon: CheckCircle2, label: 'Completed', value: data.completed, color: 'var(--success)' },
    { icon: ListTodo, label: 'Active', value: data.open, color: 'var(--energy)' },
    { icon: Flame, label: 'Current streak', value: streak.currentStreak, color: 'var(--gold-text)' },
    { icon: Trophy, label: 'Longest streak', value: streak.longestStreak, color: 'var(--gold-text)' },
  ];

  const tickInterval = Math.max(0, Math.floor(data.daily.length / 6) - 1);

  return (
    <div className="view">
      <div className="view-head" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-4)' }}>
        <div style={{ flex: 1 }}>
          <div className="view-title">Analytics</div>
          <div className="view-subtitle">
            Level {data.lvl.level} · {data.lvl.title}
          </div>
        </div>
        <div className="segmented">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={period === p.value ? 'active' : ''}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-4)' }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--sp-4)',
              }}
            >
              <Icon size={18} color={c.color} />
              <div style={{ fontSize: 'var(--fs-display)', fontWeight: 700, marginTop: 'var(--sp-2)' }}>
                <CountUp value={c.value} />
              </div>
              <div style={{ fontSize: 'var(--fs-tiny)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-grid" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="panel">
          <div className="panel-title">
            <TrendingUp size={15} color="var(--gold-text)" /> Completion trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.daily} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                interval={tickInterval}
                tick={{ fontSize: 10, fill: '#8b8680' }}
                axisLine={{ stroke: '#2a251f' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#8b8680' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: isLight ? '#d8d1c2' : '#3a3430' }} />
              <Area
                type="monotone"
                dataKey="count"
                name="Completed"
                stroke="#d4af37"
                strokeWidth={2}
                fill="url(#goldFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-title">
            <PieIcon size={15} color="var(--gold-text)" /> By project
          </div>
          {data.breakdown.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
              <div style={{ width: 180, height: 190, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.breakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {data.breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {data.breakdown.slice(0, 6).map((b) => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-small)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: b.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 'var(--sp-8) 0' }}>
              Complete tasks to see your breakdown.
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="panel-title">
          <CalendarDays size={15} color="var(--gold-text)" /> Activity — last 13 weeks
        </div>
        <Heatmap data={data.hm} />
      </div>

      <div className="panel">
        <div className="panel-title">
          <Lightbulb size={15} color="var(--gold-text)" /> Insights
        </div>
        {data.ins.map((line, i) => (
          <div className="insight-row" key={i}>
            <Lightbulb size={16} className="ico" />
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
