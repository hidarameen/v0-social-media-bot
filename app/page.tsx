'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/common/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, type Task } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BarChart3, Zap, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalAccounts: 0,
    activeTasksCount: 0,
    totalExecutions: 0,
  });

  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);

  useEffect(() => {
    logger.info('[v0] Dashboard: Component mounted');
    
    try {
      // جلب البيانات
      const users = Array.from((db as any).users.values());
      logger.info('[v0] Dashboard: Found users:', users.length);
      const user = users[0];

      if (user) {
        logger.info('[v0] Dashboard: Loading data for user:', user.id);
        const userTasks = db.getUserTasks(user.id);
        const userAccounts = db.getUserAccounts(user.id);
        const activeTasks = userTasks.filter(t => t.status === 'active');

        logger.info('[v0] Dashboard: Tasks:', userTasks.length);
        logger.info('[v0] Dashboard: Accounts:', userAccounts.length);
        logger.info('[v0] Dashboard: Active tasks:', activeTasks.length);

        const allExecutions = userTasks.flatMap(t => {
          const execs = db.getTaskExecutions(t.id);
          return Array.isArray(execs) ? execs : [];
        });
        
        logger.info('[v0] Dashboard: Total executions:', allExecutions.length);

        setStats({
          totalTasks: userTasks.length,
          totalAccounts: userAccounts.length,
          activeTasksCount: activeTasks.length,
          totalExecutions: allExecutions.length,
        });

        setRecentTasks(userTasks.slice(-5).reverse());

        setRecentExecutions(
          allExecutions
            .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
            .slice(0, 5)
        );
        
        logger.info('[v0] Dashboard: Dashboard data loaded successfully');
      } else {
        logger.warn('[v0] Dashboard: No users found');
      }
    } catch (error) {
      logger.error('[v0] Dashboard: Error loading dashboard data:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to SocialFlow
          </h1>
          <p className="text-muted-foreground">
            Manage and automate your social media content across multiple platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon={Zap}
            color="primary"
            trend={{ value: 12, direction: 'up' }}
          />
          <StatCard
            title="Connected Accounts"
            value={stats.totalAccounts}
            icon={Users}
            color="accent"
            trend={{ value: 5, direction: 'up' }}
          />
          <StatCard
            title="Active Tasks"
            value={stats.activeTasksCount}
            icon={TrendingUp}
            color="secondary"
          />
          <StatCard
            title="Total Executions"
            value={stats.totalExecutions}
            icon={BarChart3}
            color="primary"
            trend={{ value: 24, direction: 'up' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Link href="/tasks">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No tasks created yet
                  </p>
                  <Link href="/tasks/new">
                    <Button>
                      <Plus size={18} className="mr-2" />
                      Create First Task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {task.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.sourceAccounts.length} sources →{' '}
                          {task.targetAccounts.length} targets
                        </p>
                      </div>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Executions</CardTitle>
              <Link href="/executions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentExecutions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No executions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExecutions.map((execution, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <ArrowRight
                          size={16}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Transfer executed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.executedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          execution.status === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {execution.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-8 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Ready to Automate?
              </h3>
              <p className="text-muted-foreground">
                Create your first task to start syncing content across platforms
              </p>
            </div>
            <Link href="/tasks/new">
              <Button size="lg">
                <Plus size={20} className="mr-2" />
                Create New Task
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
