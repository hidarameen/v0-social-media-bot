'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/common/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    successRate: '0',
    averageExecutionTime: '0ms',
  });

  const [taskStats, setTaskStats] = useState<any[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics?userId=demo-user');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load analytics');
        }

        setStats(payload.stats);
        setTaskStats(payload.taskStats ?? []);
      } catch (error) {
        logger.error('[v0] AnalyticsPage: Failed to load analytics:', error);
      }
    };

    void loadAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground">
            Monitor task performance and execution statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Executions"
            value={stats.totalExecutions}
            icon={Zap}
            color="primary"
          />
          <StatCard
            title="Successful"
            value={stats.successfulExecutions}
            icon={CheckCircle}
            color="secondary"
          />
          <StatCard
            title="Failed"
            value={stats.failedExecutions}
            icon={AlertCircle}
            color="primary"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={TrendingUp}
            color="accent"
          />
          <StatCard
            title="Avg. Time"
            value={stats.averageExecutionTime}
            icon={Clock}
            color="primary"
          />
        </div>

        {/* Task Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Task</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No execution data available yet. Create and run some tasks to see analytics.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Task Name
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">
                        Total Runs
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">
                        Successful
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">
                        Failed
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {taskStats.map(stat => (
                      <tr key={stat.taskId} className="hover:bg-card/50 transition-colors">
                        <td className="py-4 px-4 text-foreground font-medium">
                          {stat.taskName}
                        </td>
                        <td className="py-4 px-4 text-center text-foreground">
                          {stat.totalExecutions}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {stat.successful}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {stat.failed > 0 ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {stat.failed}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-foreground font-semibold">
                          {stat.successRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Best Performing Tasks
                </h3>
                <div className="space-y-2">
                  {taskStats
                    .sort((a, b) => Number(b.successRate) - Number(a.successRate))
                    .slice(0, 3)
                    .map(stat => (
                      <div
                        key={stat.taskId}
                        className="flex items-center justify-between p-3 rounded-lg bg-card/50"
                      >
                        <span className="text-sm text-foreground">
                          {stat.taskName}
                        </span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {stat.successRate}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Recent Executions
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Execution Summary
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last 24 hours
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {stats.totalExecutions} runs
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        System Health
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Overall
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Excellent
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
