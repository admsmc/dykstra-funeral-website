'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, User, Calendar, Filter, Plus, Search, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Staff Tasks Page - Linear/Notion Style
 * Task assignment and tracking
 * 
 * Features:
 * - Kanban-style task board
 * - Task priority levels
 * - Assignment tracking
 * - Due date management
 * - Status-based filtering
 */

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
  caseId?: string;
}


export default function TasksPage() {
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tasks from API
  const { data: tasks = [], isLoading, error } = trpc.task.list.useQuery({
    status: 'all',
    priority: 'all',
  });

  // Client-side filtering for search
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  const dueTodayCount = tasks.filter(t => t.dueDate === '2024-12-05' && t.status !== 'completed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Tasks</h1>
        <p className="text-lg text-gray-600">Task assignment and tracking across all cases</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading tasks...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load tasks. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={CheckCircle} label="Total Tasks" value={totalTasks.toString()} color="indigo" delay={0} />
        <StatsCard icon={Clock} label="Completed" value={completedCount.toString()} color="green" delay={0.1} />
        <StatsCard icon={Calendar} label="High Priority" value={highPriorityCount.toString()} color="red" delay={0.2} />
        <StatsCard icon={User} label="Due Today" value={dueTodayCount.toString()} color="amber" delay={0.3} />
      </div>
      )}

      {/* Controls */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
              <FilterButton active={filter === 'todo'} onClick={() => setFilter('todo')}>To Do</FilterButton>
              <FilterButton active={filter === 'in-progress'} onClick={() => setFilter('in-progress')}>In Progress</FilterButton>
              <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>Completed</FilterButton>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-3 gap-6">
          <TaskColumn title="To Do" tasks={todoTasks} status="todo" count={todoTasks.length} />
          <TaskColumn title="In Progress" tasks={inProgressTasks} status="in-progress" count={inProgressTasks.length} />
          <TaskColumn title="Completed" tasks={completedTasks} status="completed" count={completedTasks.length} />
        </div>
      </motion.div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function FilterButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function TaskColumn({ title, tasks, status, count }: any) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-amber-600" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{count}</span>
      </div>

      <div className="space-y-3 min-h-[400px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No tasks</p>
          </div>
        ) : (
          tasks.map((task: Task, index: number) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                {getStatusIcon(task.status)}
                <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>

              <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {task.assignee}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {task.dueDate}
                </div>
              </div>

              {task.caseId && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-indigo-600 font-medium">{task.caseId}</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
