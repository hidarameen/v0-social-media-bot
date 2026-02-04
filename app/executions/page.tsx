'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskExecution } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Search, Download, RefreshCw, ChevronDown } from 'lucide-react';

interface ExpandedExecution extends TaskExecution {
  taskName?: string;
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExpandedExecution[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<ExpandedExecution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/executions?userId=demo-user');
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load executions');
      }

      const sorted = (payload.executions as ExpandedExecution[]).sort(
        (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
      );
      setExecutions(sorted);
      setFilteredExecutions(sorted);
    } catch (error) {
      logger.error('[v0] ExecutionsPage: Failed to load executions:', error);
    }
  };

  useEffect(() => {
    void loadExecutions();
  }, []);

  useEffect(() => {
    let filtered = executions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        e =>
          e.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.originalContent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    setFilteredExecutions(filtered);
  }, [searchTerm, statusFilter, executions]);

  const handleRefresh = () => {
    void loadExecutions();
  };

  const stats = {
    total: executions.length,
    successful: executions.filter(e => e.status === 'success').length,
    failed: executions.filter(e => e.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="ml-64 mt-16 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Execution History
            </h1>
            <p className="text-muted-foreground">
              Track all your task executions and their results
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download size={18} className="mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Executions</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.successful}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.failed}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by task name or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Successful</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executions List */}
        {filteredExecutions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No executions found. {executions.length === 0 ? 'Create and run some tasks to see execution history.' : 'Try a different search filter.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExecutions.map(execution => (
              <Card
                key={execution.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6">
                  <div
                    className="flex items-start justify-between"
                    onClick={() =>
                      setExpandedId(
                        expandedId === execution.id ? null : execution.id
                      )
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {execution.taskName}
                        </h4>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            execution.status === 'success'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {execution.status}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Executed {new Date(execution.executedAt).toLocaleString()}
                      </p>

                      {execution.status === 'failed' && execution.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          Error: {execution.error}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <ChevronDown
                        size={20}
                        className={`transition-transform text-muted-foreground ${
                          expandedId === execution.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === execution.id && (
                    <div className="mt-6 pt-6 border-t border-border space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">
                          Original Content
                        </h5>
                        <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-sm text-foreground max-h-32 overflow-y-auto">
                          {execution.originalContent}
                        </div>
                      </div>

                      {execution.transformedContent && (
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-2">
                            Transformed Content
                          </h5>
                          <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-sm text-foreground max-h-32 overflow-y-auto">
                            {execution.transformedContent}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Source Account
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {execution.sourceAccount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Target Account
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {execution.targetAccount}
                          </p>
                        </div>
                      </div>

                      {execution.responseData && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Response Data
                          </p>
                          <pre className="p-3 rounded-lg bg-card/50 border border-border/50 text-xs text-foreground overflow-x-auto">
                            {JSON.stringify(execution.responseData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
