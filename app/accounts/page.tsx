'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlatformAccount } from '@/lib/db';
import { platformConfigs, type PlatformId } from '@/lib/platforms/handlers';
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | ''>('');
  const [formData, setFormData] = useState({
    accountName: '',
    accountUsername: '',
    accessToken: '',
  });

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/accounts?userId=demo-user');
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load accounts');
      }
      setAccounts(payload.accounts);
    } catch (error) {
      logger.error('[v0] AccountsPage: Failed to load accounts:', error);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatform || !formData.accountName || !formData.accessToken) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/accounts?userId=demo-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          username: formData.accountUsername || formData.accountName,
          accountId: `${selectedPlatform}_${Date.now()}`,
          displayName: formData.accountName,
          accessToken: formData.accessToken,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to create account');
      }

      setFormData({
        accountName: '',
        accountUsername: '',
        accessToken: '',
      });
      setSelectedPlatform('');
      setOpen(false);

      await loadAccounts();
    } catch (error) {
      logger.error('[v0] AccountsPage: Failed to create account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        const response = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to delete account');
        }
        setAccounts(prev => prev.filter(a => a.id !== accountId));
      } catch (error) {
        logger.error('[v0] AccountsPage: Failed to delete account:', error);
      }
    }
  };

  const handleToggleStatus = async (account: PlatformAccount) => {
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update account');
      }
      setAccounts(prev =>
        prev.map(a => (a.id === account.id ? { ...a, isActive: !a.isActive } : a))
      );
    } catch (error) {
      logger.error('[v0] AccountsPage: Failed to update account:', error);
    }
  };

  const platformAccountsMap = platformConfigs;
  const accountsByPlatform = Object.entries(platformAccountsMap).reduce(
    (acc, [platformId]) => {
      acc[platformId] = accounts.filter(a => a.platformId === platformId);
      return acc;
    },
    {} as Record<string, PlatformAccount[]>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="ml-64 mt-16 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Connected Accounts
            </h1>
            <p className="text-muted-foreground">
              Manage your social media platform connections
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Connect a new social media account to your SocialFlow workspace
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Platform *
                  </label>
                  <Select
                    value={selectedPlatform}
                    onValueChange={(value: any) => setSelectedPlatform(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformAccountsMap).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.icon} {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Display Name *
                  </label>
                  <Input
                    placeholder="e.g., My Business Page"
                    value={formData.accountName}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        accountName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Username
                  </label>
                  <Input
                    placeholder="e.g., @myusername"
                    value={formData.accountUsername}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        accountUsername: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Access Token / API Key *
                  </label>
                  <Input
                    type="password"
                    placeholder="Paste your access token here"
                    value={formData.accessToken}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        accessToken: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Your token is encrypted and stored securely
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Account
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No accounts connected yet. Add your first account to get started.
              </p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={18} className="mr-2" />
                    Connect First Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Account</DialogTitle>
                  </DialogHeader>
                  {/* Form content same as above */}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(accountsByPlatform).map(([platformId, platformAccounts]) => {
              if (platformAccounts.length === 0) return null;

              const config = platformConfigs[platformId as PlatformId];
              return (
                <div key={platformId}>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    {config.icon} {config.name}
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {platformAccounts.map(account => (
                      <Card
                        key={account.id}
                        className={account.isActive ? '' : 'opacity-50'}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {account.accountName}
                                </h3>
                                {account.isActive ? (
                                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle size={16} />
                                    <span className="text-xs font-semibold">
                                      Connected
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <AlertCircle size={16} />
                                    <span className="text-xs font-semibold">
                                      Disconnected
                                    </span>
                                  </div>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground">
                                @{account.accountUsername || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Added {new Date(account.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(account)}
                              >
                                {account.isActive ? 'Disconnect' : 'Reconnect'}
                              </Button>

                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteAccount(account.id)}
                                className="text-destructive"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
