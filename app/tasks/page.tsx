'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, type Task } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Plus, Search, Edit2, Trash2, Play, Pause, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    logger.info('[v0] TasksPage: Component mounted');
    const users = Array.from((db as any).users.values());
    logger.info('[v0] TasksPage: Found users:', users.length);
    const user = users[0];

    if (user) {
      logger.info('[v0] TasksPage: Loading tasks for user:', user.id);
      const userTasks = db.getUserTasks(user.id);
      logger.info('[v0] TasksPage: Tasks loaded:', userTasks.length);
      setTasks(userTasks);
      setFilteredTasks(userTasks);
    } else {
      logger.warn('[v0] TasksPage: No users found');
    }
  }, []);

  useEffect(() => {
    const filtered = tasks.filter(task =>
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  const handleDelete = (taskId: string) => {
    logger.info('[v0] handleDelete: Attempting to delete task:', taskId);
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        db.deleteTask(taskId);
        logger.info('[v0] handleDelete: Task deleted successfully');
        setTasks(tasks.filter(t => t.id !== taskId));
      } catch (error) {
        logger.error('[v0] handleDelete: Error deleting task:', error);
      }
    }
  };

  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    logger.info('[v0] handleToggleStatus: Changing status of task:', task.id, 'to:', newStatus);
    try {
      db.updateTask(task.id, { status: newStatus as any });
      logger.info('[v0] handleToggleStatus: Status updated successfully');
      setTasks(tasks.map(t => (t.id === task.id ? { ...t, status: newStatus as any } : t)));
    } catch (error) {
      logger.error('[v0] handleToggleStatus: Error updating status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="ml-64 mt-16 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Tasks
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor your automation tasks
            </p>
          </div>
          <Link href="/tasks/new">
            <Button>
              <Plus size={20} className="mr-2" />
              Create New Task
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No tasks found. {tasks.length === 0 ? 'Create your first task to get started.' : 'Try a different search.'}
              </p>
              {tasks.length === 0 && (
                <Link href="/tasks/new">
                  <Button>
                    <Plus size={18} className="mr-2" />
                    Create Your First Task
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {task.name}
                        </h3>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            task.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-3">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Source:</p>
                          <p className="font-medium text-foreground">
                            {task.sourceAccounts.length} account(s)
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target:</p>
                          <p className="font-medium text-foreground">
                            {task.targetAccounts.length} account(s)
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type:</p>
                          <p className="font-medium text-foreground">
                            {task.executionType}
                          </p>
                        </div>
                        {task.lastExecuted && (
                          <div>
                            <p className="text-muted-foreground">Last run:</p>
                            <p className="font-medium text-foreground">
                              {new Date(task.lastExecuted).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleStatus(task)}
                      >
                        {task.status === 'active' ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}
                      </Button>

                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="outline" size="icon">
                          <Edit2 size={18} />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
                        className="text-destructive"
                      >
                        <Trash2 size={18} />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <Link href={`/tasks/${task.id}`}>
                          <ExternalLink size={18} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
