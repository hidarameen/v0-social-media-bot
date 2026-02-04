'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Plus,
  Trash2,
  Facebook,
  Instagram,
  Twitter,
  Music,
  Play,
  MessageCircle,
  Linkedin,
} from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'twitter', name: 'Twitter', icon: Twitter },
  { id: 'tiktok', name: 'TikTok', icon: Music },
  { id: 'youtube', name: 'YouTube', icon: Play },
  { id: 'telegram', name: 'Telegram', icon: MessageCircle },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
]

export default function CreateTaskPage() {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [sourcePlatforms, setSourcePlatforms] = useState<string[]>([])
  const [destPlatforms, setDestPlatforms] = useState<string[]>([])
  const [frequency, setFrequency] = useState('daily')
  const [addHashtags, setAddHashtags] = useState('')
  const [prependText, setPrependText] = useState('')
  const [appendText, setAppendText] = useState('')
  const [includeSource, setIncludeSource] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const handleAddSource = (platformId: string) => {
    setSourcePlatforms(prev =>
      prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]
    )
  }

  const handleAddDest = (platformId: string) => {
    setDestPlatforms(prev =>
      prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskName.trim()) {
      toast.error('Task name is required')
      return
    }

    if (sourcePlatforms.length === 0) {
      toast.error('Select at least one source platform')
      return
    }

    if (destPlatforms.length === 0) {
      toast.error('Select at least one destination platform')
      return
    }

    // In production, save to database
    const taskData = {
      id: crypto.randomUUID(),
      name: taskName,
      description,
      sourcePlatforms,
      destPlatforms,
      frequency,
      transformations: {
        addHashtags: addHashtags.split('\n').filter(h => h.trim()),
        prependText,
        appendText,
        includeSource,
      },
      isActive,
      createdAt: new Date().toISOString(),
    }

    logger.info('[v0] New task created:', taskData)
    toast.success('Automation task created successfully!')
    
    // Reset form
    setTaskName('')
    setDescription('')
    setSourcePlatforms([])
    setDestPlatforms([])
    setAddHashtags('')
    setPrependText('')
    setAppendText('')
    setIncludeSource(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Automation Task</h1>
            <p className="text-muted-foreground">Set up automatic cross-platform content distribution</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Give your automation task a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name *</Label>
                <Input
                  id="taskName"
                  placeholder="e.g., Daily Blog Post Distribution"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this task will do..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Select source and destination platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source Platforms */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Source Platform(s) *</Label>
                <p className="text-sm text-muted-foreground mb-3">Posts from these platforms will be forwarded</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platforms.map(platform => {
                    const Icon = platform.icon
                    const isSelected = sourcePlatforms.includes(platform.id)
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handleAddSource(platform.id)}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border/40 hover:border-border/60'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">{platform.name}</span>
                        {isSelected && <Badge className="mt-1">Selected</Badge>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Flow Arrow */}
              <div className="flex justify-center py-2">
                <ArrowRight className="w-6 h-6 text-primary/50 rotate-90" />
              </div>

              {/* Destination Platforms */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Destination Platform(s) *</Label>
                <p className="text-sm text-muted-foreground mb-3">Posts will be sent to these platforms</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platforms.map(platform => {
                    const Icon = platform.icon
                    const isSelected = destPlatforms.includes(platform.id)
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handleAddDest(platform.id)}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border/40 hover:border-border/60'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">{platform.name}</span>
                        {isSelected && <Badge className="mt-1">Selected</Badge>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Transformation */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Content Transformation</CardTitle>
              <CardDescription>Customize how content is transformed when posted to different platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prependText">Prepend Text</Label>
                <Textarea
                  id="prependText"
                  placeholder="Text to add at the beginning of each post"
                  value={prependText}
                  onChange={e => setPrependText(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="appendText">Append Text</Label>
                <Textarea
                  id="appendText"
                  placeholder="Text to add at the end of each post"
                  value={appendText}
                  onChange={e => setAppendText(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="hashtags">Hashtags (one per line)</Label>
                <Textarea
                  id="hashtags"
                  placeholder="#marketing&#10;#socialmedia&#10;#automation"
                  value={addHashtags}
                  onChange={e => setAddHashtags(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/40">
                <Switch id="includeSource" checked={includeSource} onCheckedChange={setIncludeSource} />
                <Label htmlFor="includeSource" className="cursor-pointer">
                  <span className="font-medium">Add source attribution</span>
                  <span className="text-muted-foreground text-sm block">[Cross-posted via SocialFlow]</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>When and how often this task should run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Run Once</SelectItem>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Every Day</SelectItem>
                    <SelectItem value="weekly">Every Week</SelectItem>
                    <SelectItem value="monthly">Every Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/40">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive" className="cursor-pointer">
                  <span className="font-medium">Task is active</span>
                  <span className="text-muted-foreground text-sm block">Enable this task to start automation</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Automation Task
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
