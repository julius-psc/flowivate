"use client"

import { useState } from 'react';
import { Check, Circle, ChevronRight, Plus } from 'lucide-react';

type GoalCategory = 'personal' | 'work';
type GoalStatus = 'completed' | 'in-progress';

interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  status: GoalStatus;
  dueDate?: string;
}

export default function MinimalistGoals() {
  const [activeCategory, setActiveCategory] = useState<GoalCategory>('personal');
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  
  // Sample data
  const goals: Goal[] = [
    {
      id: '1',
      title: 'Read 20 pages daily',
      category: 'personal',
      status: 'in-progress',
      dueDate: '2025-05-15',
    },
    {
      id: '2',
      title: 'Learn React Server Components',
      category: 'work',
      status: 'in-progress',
      dueDate: '2025-05-10',
    },
    {
      id: '3',
      title: 'Morning meditation routine',
      category: 'personal',
      status: 'completed',
    },
    {
      id: '4',
      title: 'Complete project proposal',
      category: 'work',
      status: 'completed',
    },
  ];

  const filteredGoals = goals.filter(goal => goal.category === activeCategory);
  
  const toggleGoalDetails = (id: string) => {
    setActiveGoalId(activeGoalId === id ? null : id);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getCategoryEmoji = (category: GoalCategory) => {
    return category === 'personal' ? '🌱' : '💼';
  };

  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-slate-100">
        {(['personal', 'work'] as GoalCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 ${
              activeCategory === category
                ? 'text-blue-600 border-b border-blue-600 font-medium'
                : 'text-slate-500'
            }`}
          >
            <span>{getCategoryEmoji(category)}</span>
            <span className="capitalize">{category}</span>
          </button>
        ))}
      </div>
      
      <ul className="divide-y divide-slate-50">
        {filteredGoals.length === 0 ? (
          <li className="py-4 px-4 text-slate-400 text-sm text-center">
            No goals yet. What would you like to achieve? ✨
          </li>
        ) : (
          filteredGoals.map((goal) => (
            <li key={goal.id} className="text-sm">
              <div 
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => toggleGoalDetails(goal.id)}
              >
                <div className="flex items-center gap-3">
                  {goal.status === 'completed' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                  )}
                  <span className={goal.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}>
                    {goal.title}
                  </span>
                </div>
                {goal.dueDate && activeGoalId !== goal.id && (
                  <span className="text-xs text-slate-400">{formatDate(goal.dueDate)}</span>
                )}
                {!goal.dueDate && activeGoalId !== goal.id && (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </div>
              
              {activeGoalId === goal.id && (
                <div className="px-4 pb-3 pl-11 text-xs">
                  <div className="space-y-2 text-slate-500">
                    {goal.dueDate && (
                      <div>
                        <span>📅 When is this due? </span>
                        <span className="text-slate-700">{formatDate(goal.dueDate)}</span>
                      </div>
                    )}
                    <div>
                      <span>🎯 Why is this important? </span>
                      <span className="text-slate-400 italic">Tap to add...</span>
                    </div>
                    <div>
                      <span>🔄 How often? </span>
                      <span className="text-slate-400 italic">Tap to add...</span>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
      
      <div className="px-4 py-3 border-t border-slate-50">
        <button className="w-full py-2 text-blue-500 text-sm flex items-center justify-center gap-1 rounded-md border border-blue-100 hover:bg-blue-50">
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>
    </div>
  );
}