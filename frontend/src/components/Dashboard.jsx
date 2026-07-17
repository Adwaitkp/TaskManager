import { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Plus,
  LogOut,
  Calendar,
  Flag,
  ListTodo,
  Clock3,
  TrendingUp,
  Inbox,
  AlertTriangle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  Low: 'bg-accent/10 text-accent border-accent/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  High: 'bg-destructive/10 text-destructive border-destructive/20',
};

const EMPTY_FORM = { title: '', description: '', dueDate: '', priority: 'Medium' };

function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-foreground/55 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-0.5 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="h-3 w-16 bg-foreground/10 rounded mb-3" />
      <div className="h-6 w-10 bg-foreground/10 rounded" />
    </div>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium
      }`}
    >
      <Flag size={11} />
      {priority}
    </span>
  );
}

function DueDate({ dueDate, status }) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const overdue = status !== 'Completed' && date < new Date(new Date().toDateString());
  return (
    <span className={`inline-flex items-center gap-1 ${overdue ? 'text-destructive font-medium' : 'text-foreground/50'}`}>
      {overdue ? <AlertTriangle size={13} /> : <Calendar size={13} />}
      {overdue && 'Overdue · '}
      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </span>
  );
}

function TaskSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-foreground/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-foreground/10 rounded w-2/5" />
          <div className="h-3 bg-foreground/10 rounded w-3/5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const { data } = await API.get('/tasks');
      setTasks(data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await API.put(`/tasks/${editingId}`, formData);
        toast.success('Task updated');
      } else {
        await API.post('/tasks', formData);
        toast.success('Task added');
      }
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      await API.delete(`/tasks/${task._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
    try {
      await API.put(`/tasks/${task._id}`, { status: newStatus });
    } catch (error) {
      toast.error('Failed to update status');
      fetchTasks();
    }
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate?.split('T')[0] || '',
      priority: task.priority,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTasks = tasks
    .filter((task) => filter === 'All' || task.status === filter)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Completed' ? 1 : -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    pending: tasks.filter((t) => t.status === 'Pending').length,
  };
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const filters = [
    { key: 'All', count: stats.total },
    { key: 'Pending', count: stats.pending },
    { key: 'Completed', count: stats.completed },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <ListTodo size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">Task Manager</h1>
              <p className="text-xs text-foreground/50">Organize and track your work</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total tasks" value={stats.total} icon={ListTodo} iconBg="bg-foreground/10" iconColor="text-foreground/70" />
              <StatCard label="Pending" value={stats.pending} icon={Clock3} iconBg="bg-warning/10" iconColor="text-warning" />
              <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} iconBg="bg-accent/10" iconColor="text-accent" />
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/55 text-xs font-medium uppercase tracking-wide">Completion</p>
                  <TrendingUp size={15} className="text-accent" />
                </div>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{completionRate}%</p>
                <div className="h-1.5 bg-foreground/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-foreground">
                  {editingId ? 'Edit task' : 'New task'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-foreground/40 hover:text-foreground/70 transition-colors"
                    aria-label="Cancel edit"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Finish quarterly report"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <textarea
                    placeholder="Add details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Due date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <Plus size={16} />
                    {editingId ? 'Update task' : 'Add task'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 bg-background border border-border text-sm text-foreground rounded-lg hover:bg-foreground/5 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Tasks List */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6 flex-wrap">
              {filters.map(({ key, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    filter === key
                      ? 'bg-accent text-white'
                      : 'bg-card border border-border text-foreground/70 hover:bg-foreground/5'
                  }`}
                >
                  {key}
                  <span className={`text-xs ${filter === key ? 'text-white/80' : 'text-foreground/40'}`}>{count}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <TaskSkeleton key={i} />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-3">
                  <Inbox size={20} className="text-foreground/40" />
                </div>
                <p className="text-foreground/60 font-medium text-sm">No tasks found</p>
                <p className="text-foreground/40 text-xs mt-1">
                  {filter === 'All' ? 'Create your first task to get started' : `No ${filter.toLowerCase()} tasks right now`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`group bg-card border border-border rounded-xl p-4 transition-all hover:shadow-md hover:border-foreground/15 ${
                      task.status === 'Completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleStatus(task)}
                        className="shrink-0 mt-0.5 text-foreground/30 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-full"
                        aria-label={task.status === 'Completed' ? 'Mark as pending' : 'Mark as completed'}
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle2 size={22} className="text-accent" />
                        ) : (
                          <Circle size={22} />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-foreground text-sm ${
                            task.status === 'Completed' ? 'line-through text-foreground/50' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-foreground/55 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
                          <DueDate dueDate={task.dueDate} status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 text-foreground/50 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          aria-label="Edit task"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 text-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                          aria-label="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}