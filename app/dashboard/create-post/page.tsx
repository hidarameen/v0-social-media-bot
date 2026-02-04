'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Facebook,
  Instagram,
  Twitter,
  Music,
  Play,
  MessageCircle,
  Linkedin,
  ImageIcon,
  Video,
  Clock,
  Send,
  Calendar,
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

export default function CreatePostPage() {
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [newMediaUrl, setNewMediaUrl] = useState('')

  const charCount = content.length
  const charLimit = 280

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]
    )
  }

  const handleAddMedia = () => {
    if (newMediaUrl.trim()) {
      setMediaUrls([...mediaUrls, newMediaUrl])
      setNewMediaUrl('')
      toast.success('Media added')
    }
  }

  const handleRemoveMedia = (idx: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== idx))
  }

  const handlePublish = () => {
    if (!content.trim()) {
      toast.error('Post content is required')
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform')
      return
    }

    if (scheduleType === 'later' && (!scheduleDate || !scheduleTime)) {
      toast.error('Select date and time for scheduled post')
      return
    }

    const postData = {
      id: crypto.randomUUID(),
      content,
      platforms: selectedPlatforms,
      media: mediaUrls,
      scheduledFor: scheduleType === 'now' ? new Date() : new Date(`${scheduleDate}T${scheduleTime}`),
      status: scheduleType === 'now' ? 'publishing' : 'scheduled',
    }

    logger.info('[v0] Post created:', postData)
    toast.success(scheduleType === 'now' ? 'Post published!' : 'Post scheduled!')

    // Reset form
    setContent('')
    setSelectedPlatforms([])
    setMediaUrls([])
    setScheduleType('now')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Post</h1>
            <p className="text-muted-foreground">Publish content to multiple platforms instantly</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Editor */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="content">What's on your mind?</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post here... Share your thoughts, updates, and ideas!"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <div className="mt-2 text-sm text-muted-foreground text-right">
                    {charCount} / {charLimit} characters
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-lg">Add Media</CardTitle>
                <CardDescription>Images, videos, and other media files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste media URL"
                    value={newMediaUrl}
                    onChange={e => setNewMediaUrl(e.target.value)}
                  />
                  <Button onClick={handleAddMedia} variant="outline" size="sm">
                    Add
                  </Button>
                </div>

                {mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    {mediaUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/40">
                        <span className="text-sm truncate">{url}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMedia(idx)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {mediaUrls.length === 0 && (
                  <div className="p-8 rounded-lg border-2 border-dashed border-border/40 text-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No media added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Platforms</CardTitle>
                <CardDescription>Select where to publish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {platforms.map(platform => {
                  const Icon = platform.icon
                  const isSelected = selectedPlatforms.includes(platform.id)
                  return (
                    <div key={platform.id} className="flex items-center gap-3">
                      <Checkbox
                        id={platform.id}
                        checked={isSelected}
                        onCheckedChange={() => handleTogglePlatform(platform.id)}
                      />
                      <Label
                        htmlFor={platform.id}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Icon className="w-4 h-4" />
                        {platform.name}
                      </Label>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Publish Type</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="now"
                        value="now"
                        checked={scheduleType === 'now'}
                        onChange={e => setScheduleType(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="now" className="cursor-pointer flex items-center gap-2 flex-1">
                        <Send className="w-4 h-4" />
                        Publish Now
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="later"
                        value="later"
                        checked={scheduleType === 'later'}
                        onChange={e => setScheduleType(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="later" className="cursor-pointer flex items-center gap-2 flex-1">
                        <Clock className="w-4 h-4" />
                        Schedule
                      </Label>
                    </div>
                  </div>
                </div>

                {scheduleType === 'later' && (
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-border/40 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPlatforms.length > 0 ? (
                      selectedPlatforms.map(platformId => {
                        const platform = platforms.find(p => p.id === platformId)
                        return <Badge key={platformId}>{platform?.name}</Badge>
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">None selected</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-1" variant={content.trim() ? 'default' : 'secondary'}>
                    {content.trim() ? 'Ready' : 'Incomplete'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Publish Button */}
            <Button
              onClick={handlePublish}
              disabled={!content.trim() || selectedPlatforms.length === 0}
              className="w-full gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
