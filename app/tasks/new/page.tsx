'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { PlatformAccount } from '@/lib/db';

import { db, type PlatformAccount } from '@/lib/db'; 
import { logger } from '@/lib/logger';
import { platformConfigs } from '@/lib/platforms/handlers';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceAccounts: [] as string[],
    targetAccounts: [] as string[],
    executionType: 'immediate' as const,
    scheduleTime: '',
    recurringPattern: 'daily' as const,
  });

  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [selectedSourcePlatform, setSelectedSourcePlatform] = useState('');
  const [selectedTargetPlatform, setSelectedTargetPlatform] = useState('');

  useEffect(() => {
    const loadAccounts = async () => {
      logger.info('[v0] CreateTaskPage: Component mounted');
      try {
        const response = await fetch('/api/accounts?userId=demo-user');
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load accounts');
        }
        logger.info('[v0] CreateTaskPage: User accounts:', payload.accounts.length);
        setAccounts(payload.accounts);
      } catch (error) {
        logger.error('[v0] CreateTaskPage: Failed to load accounts:', error);
      }
    };

    void loadAccounts();


    logger.info('[v0] CreateTaskPage: Component mounted');
    const users = Array.from((db as any).users.values());
    logger.info('[v0] CreateTaskPage: Found users:', users.length);
    const user = users[0];
    if (user) {
      logger.info('[v0] CreateTaskPage: User found:', user.id);
      const userAccounts = db.getUserAccounts(user.id);
      logger.info('[v0] CreateTaskPage: User accounts:', userAccounts.length);
      setAccounts(userAccounts);
    } else {
      logger.warn('[v0] CreateTaskPage: No users found in database');
    }
  }, []);

  const sourcePlatformAccounts = accounts.filter(
    a => a.platformId === selectedSourcePlatform
  );
  const targetPlatformAccounts = accounts.filter(
    a => a.platformId === selectedTargetPlatform
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('[v0] handleSubmit: Form submitted');
    logger.info('[v0] formData:', formData);

    if (!formData.name || formData.sourceAccounts.length === 0 || formData.targetAccounts.length === 0) {
      logger.warn('[v0] handleSubmit: Validation failed - missing required fields');
      alert('Please fill in all required fields');
      return;
    }

    try {
      logger.info('[v0] handleSubmit: Creating task for user: demo-user');
      const response = await fetch('/api/tasks?userId=demo-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({

    const users = Array.from((db as any).users.values());
    logger.info('[v0] handleSubmit: Users found:', users.length);
    const user = users[0];

    if (user) {
      logger.info('[v0] handleSubmit: Creating task for user:', user.id);
      try {
        const taskId = db.createTask({
          userId: user.id,
          name: formData.name,
          description: formData.description,
          sourceAccounts: formData.sourceAccounts,
          targetAccounts: formData.targetAccounts,
          contentType: 'text',
          status: 'active',
          executionType: formData.executionType,
          scheduleTime: formData.scheduleTime || undefined,
          recurringPattern: formData.recurringPattern,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to create task');
      }

      logger.info('[v0] handleSubmit: Task created successfully:', payload.task?.id);
      router.push('/tasks');
    } catch (error) {
      logger.error('[v0] handleSubmit: Error creating task:', error);

      }

      logger.info('[v0] handleSubmit: Task created successfully:', payload.task?.id);
      router.push('/tasks');
    } catch (error) {
      logger.error('[v0] handleSubmit: Error creating task:', error);

        });
        logger.info('[v0] handleSubmit: Task created successfully:', taskId);
        router.push('/tasks');
      } catch (error) {
        logger.error('[v0] handleSubmit: Error creating task:', error);
      }
    } else {
      logger.error('[v0] handleSubmit: No user found');
 
    }
  };

  const toggleSourceAccount = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      sourceAccounts: prev.sourceAccounts.includes(accountId)
        ? prev.sourceAccounts.filter(id => id !== accountId)
        : [...prev.sourceAccounts, accountId],
    }));
  };

  const toggleTargetAccount = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      targetAccounts: prev.targetAccounts.includes(accountId)
        ? prev.targetAccounts.filter(id => id !== accountId)
        : [...prev.targetAccounts, accountId],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create New Task
          </h1>
          <p className="text-muted-foreground">
            Set up an automation task to transfer content between platforms
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Task Name *
                </label>
                <Input
                  placeholder="e.g., Facebook to Twitter Daily Sync"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Describe what this task does..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Source Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Source Account(s)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Source Platform
                </label>
                <Select value={selectedSourcePlatform} onValueChange={setSelectedSourcePlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose source platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSourcePlatform && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Accounts
                  </label>
                  {sourcePlatformAccounts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No accounts connected for this platform
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sourcePlatformAccounts.map(account => (
                        <div key={account.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`source-${account.id}`}
                            checked={formData.sourceAccounts.includes(account.id)}
                            onChange={() => toggleSourceAccount(account.id)}
                            className="rounded border-border"
                          />
                          <label
                            htmlFor={`source-${account.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            <span className="font-medium">{account.accountName}</span>
                            <span className="text-muted-foreground">
                              {' '}(@{account.accountUsername})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Target Account(s)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Platform(s)
                </label>
                <Select value={selectedTargetPlatform} onValueChange={setSelectedTargetPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTargetPlatform && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Accounts
                  </label>
                  {targetPlatformAccounts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No accounts connected for this platform
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {targetPlatformAccounts.map(account => (
                        <div key={account.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`target-${account.id}`}
                            checked={formData.targetAccounts.includes(account.id)}
                            onChange={() => toggleTargetAccount(account.id)}
                            className="rounded border-border"
                          />
                          <label
                            htmlFor={`target-${account.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            <span className="font-medium">{account.accountName}</span>
                            <span className="text-muted-foreground">
                              {' '}(@{account.accountUsername})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Execution Type
                </label>
                <Select
                  value={formData.executionType}
                  onValueChange={(value: any) =>
                    setFormData(prev => ({ ...prev, executionType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.executionType === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Schedule Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduleTime}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))
                    }
                  />
                </div>
              )}

              {formData.executionType === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Recurrence Pattern
                  </label>
                  <Select
                    value={formData.recurringPattern}
                    onValueChange={(value: any) =>
                      setFormData(prev => ({ ...prev, recurringPattern: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" size="lg">
              <Save size={20} className="mr-2" />
              Create Task
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push('/tasks')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
