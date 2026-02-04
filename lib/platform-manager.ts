import { SocialPlatform, PlatformAccount, ContentItem, AutomationTask } from './types'
import { FacebookClient } from '@/platforms/facebook/client'
import { TwitterClient } from '@/platforms/twitter/client'
import { InstagramClient } from '@/platforms/instagram/client'
import { TikTokClient } from '@/platforms/tiktok/client'
import { YouTubeClient } from '@/platforms/youtube/client'
import { TelegramClient } from '@/platforms/telegram/client'
import { logger } from '@/lib/logger'

/**
 * Unified Platform Manager - Handles all social media platforms
 */
export class PlatformManager {
  private facebookClients: Map<string, FacebookClient> = new Map()
  private twitterClients: Map<string, TwitterClient> = new Map()
  private instagramClients: Map<string, InstagramClient> = new Map()
  private tiktokClients: Map<string, TikTokClient> = new Map()
  private youtubeClients: Map<string, YouTubeClient> = new Map()
  private telegramClients: Map<string, TelegramClient> = new Map()

  /**
   * Initialize client for a platform account
   */
  async initializeClient(account: PlatformAccount): Promise<void> {
    const { platform, id, credentials } = account

    try {
      switch (platform) {
        case 'facebook':
          if (credentials.accessToken) {
            this.facebookClients.set(id, new FacebookClient(credentials.accessToken))
          }
          break

        case 'instagram':
          if (credentials.accessToken) {
            this.instagramClients.set(
              id,
              new InstagramClient(credentials.accessToken, account.accountId)
            )
          }
          break

        case 'twitter':
          if (credentials.accessToken) {
            this.twitterClients.set(id, new TwitterClient(credentials.accessToken))
          }
          break

        case 'tiktok':
          if (credentials.accessToken && credentials.customData?.clientKey) {
            this.tiktokClients.set(
              id,
              new TikTokClient(credentials.accessToken, credentials.customData.clientKey)
            )
          }
          break

        case 'youtube':
          if (credentials.accessToken) {
            this.youtubeClients.set(id, new YouTubeClient(credentials.accessToken))
          }
          break

        case 'telegram':
          if (credentials.customData?.botToken) {
            this.telegramClients.set(
              id,
              new TelegramClient(credentials.customData.botToken)
            )
          }
          break
      }
    } catch (error) {
      logger.error(`Failed to initialize ${platform} client:`, error)
      throw error
    }
  }

  /**
   * Publish content to a specific platform account
   */
  async publishContent(
    account: PlatformAccount,
    content: ContentItem
  ): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
    const { platform, id } = account

    try {
      switch (platform) {
        case 'facebook': {
          const client = this.facebookClients.get(id)
          if (!client) throw new Error('Facebook client not initialized')

          const result = await client.publishPost(account.accountId, {
            message: content.text,
            link: content.link,
            type: 'status',
            published: true,
          })

          return { success: true, postId: result.id, url: result.url }
        }

        case 'instagram': {
          const client = this.instagramClients.get(id)
          if (!client) throw new Error('Instagram client not initialized')

          if (content.media && content.media.length > 0) {
            const result = await client.publishMedia(
              content.media[0].url,
              content.text,
              'IMAGE'
            )
            return { success: true, postId: result.id }
          }

          return { success: false, error: 'Instagram requires media content' }
        }

        case 'twitter': {
          const client = this.twitterClients.get(id)
          if (!client) throw new Error('Twitter client not initialized')

          const result = await client.tweet({
            text: content.text,
          })

          return {
            success: true,
            postId: result.id,
            url: `https://twitter.com/i/web/status/${result.id}`,
          }
        }

        case 'tiktok': {
          const client = this.tiktokClients.get(id)
          if (!client) throw new Error('TikTok client not initialized')

          if (!content.media || content.media.length === 0) {
            return { success: false, error: 'TikTok requires video content' }
          }

          // Note: In production, you'd download the video from the URL first
          return { success: false, error: 'TikTok video upload requires binary data' }
        }

        case 'youtube': {
          const client = this.youtubeClients.get(id)
          if (!client) throw new Error('YouTube client not initialized')

          if (!content.media || content.media.length === 0) {
            return { success: false, error: 'YouTube requires video content' }
          }

          return { success: false, error: 'YouTube video upload requires binary data' }
        }

        case 'telegram': {
          const client = this.telegramClients.get(id)
          if (!client) throw new Error('Telegram client not initialized')

          if (content.media && content.media.length > 0) {
            const result = await client.sendPhoto(
              account.accountId,
              content.media[0].url,
              content.text
            )
            return { success: true, postId: result.messageId.toString() }
          }

          const result = await client.sendMessage(account.accountId, content.text)
          return { success: true, postId: result.messageId.toString() }
        }

        case 'linkedin':
        case 'threads':
          return { success: false, error: `${platform} client not yet implemented` }

        default:
          return { success: false, error: `Unknown platform: ${platform}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Distribute content to multiple platform accounts
   */
  async distributeContent(
    accounts: PlatformAccount[],
    content: ContentItem,
    transformation?: (text: string, platform: SocialPlatform) => string
  ): Promise<Array<{ accountId: string; platform: SocialPlatform; result: any }>> {
    const results = []

    for (const account of accounts) {
      try {
        // Transform content if needed
        let transformedContent = { ...content }
        if (transformation) {
          transformedContent.text = transformation(content.text, account.platform)
        }

        const result = await this.publishContent(account, transformedContent)
        results.push({
          accountId: account.id,
          platform: account.platform,
          result,
        })
      } catch (error) {
        results.push({
          accountId: account.id,
          platform: account.platform,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }

    return results
  }

  /**
   * Verify all account credentials
   */
  async verifyAccounts(accounts: PlatformAccount[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const account of accounts) {
      try {
        let isValid = false

        switch (account.platform) {
          case 'facebook': {
            const client = this.facebookClients.get(account.id)
            if (client) {
              const result = await client.verifyToken()
              isValid = result.isValid
            }
            break
          }

          case 'instagram': {
            const client = this.instagramClients.get(account.id)
            if (client) {
              isValid = await client.verifyToken()
            }
            break
          }

          case 'twitter': {
            const client = this.twitterClients.get(account.id)
            if (client) {
              isValid = await client.verifyAccess()
            }
            break
          }

          case 'youtube': {
            const client = this.youtubeClients.get(account.id)
            if (client) {
              isValid = await client.verifyToken()
            }
            break
          }

          case 'telegram': {
            const client = this.telegramClients.get(account.id)
            if (client) {
              isValid = await client.verifyToken()
            }
            break
          }
        }

        results[account.id] = isValid
      } catch (error) {
        results[account.id] = false
      }
    }

    return results
  }

  /**
   * Clear clients
   */
  clearClients(): void {
    this.facebookClients.clear()
    this.twitterClients.clear()
    this.instagramClients.clear()
    this.tiktokClients.clear()
    this.youtubeClients.clear()
    this.telegramClients.clear()
  }
}

// Singleton instance
export const platformManager = new PlatformManager()
