import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const decodeHtml = (value: string) => value
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/\s+/g, ' ').trim()

const metaValue = (html: string, names: string[]) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const name = tag.match(/(?:property|name|itemprop)=["']([^"']+)["']/i)?.[1]?.toLowerCase()
    if (!name || !names.includes(name)) continue
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1]
    if (content) return decodeHtml(content)
  }
  return ''
}

const profileUrls: Record<string, (username: string) => string> = {
  Instagram: username => 'https://www.instagram.com/' + encodeURIComponent(username) + '/',
  TikTok: username => 'https://www.tiktok.com/@' + encodeURIComponent(username),
  YouTube: username => 'https://www.youtube.com/@' + encodeURIComponent(username),
  Twitch: username => 'https://www.twitch.tv/' + encodeURIComponent(username),
  X: username => 'https://x.com/' + encodeURIComponent(username),
  Roblox: username => 'https://www.roblox.com/users/profile?username=' + encodeURIComponent(username),
  SoundCloud: username => 'https://soundcloud.com/' + encodeURIComponent(username),
}

const countFromText = (text: string, labels: string[]) => {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^\x24()|[\]\\]/g, '\\$&')
    const match = text.match(new RegExp('([\\d,.]+\\s?[KMB]?)\\s*' + escaped, 'i'))
    if (match) return match[1].replace(/\s+/g, '')
  }
  return ''
}

const getProfilePage = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MementoProfileLookup/1.0; +https://github.com/heartgallerie/memento)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
    },
    signal: AbortSignal.timeout(9000),
    redirect: 'follow',
  })
  if (!response.ok) {
    const reason = response.status === 403 || response.status === 429
      ? 'This platform is blocking anonymous profile requests right now.'
      : 'The platform returned HTTP ' + response.status + '.'
    throw new Error(reason)
  }
  return response.text()
}

const lookupRoblox = async (username: string) => {
  const lookup = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    signal: AbortSignal.timeout(9000),
  })
  if (!lookup.ok) throw new Error('Roblox username lookup returned HTTP ' + lookup.status + '.')
  const user = (await lookup.json()).data?.[0]
  if (!user) throw new Error('No Roblox account was found for that username.')
  const id = user.id
  const [detail, avatar, followers, friends] = await Promise.all([
    fetch('https://users.roblox.com/v1/users/' + id, { signal: AbortSignal.timeout(9000) }).then(r => r.ok ? r.json() : null),
    fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + id + '&size=150x150&format=Png&isCircular=false', { signal: AbortSignal.timeout(9000) }).then(r => r.ok ? r.json() : null),
    fetch('https://friends.roblox.com/v1/users/' + id + '/followers/count', { signal: AbortSignal.timeout(9000) }).then(r => r.ok ? r.json() : null),
    fetch('https://friends.roblox.com/v1/users/' + id + '/friends/count', { signal: AbortSignal.timeout(9000) }).then(r => r.ok ? r.json() : null),
  ])
  return {
    displayName: detail?.displayName || user.name,
    avatarUrl: avatar?.data?.[0]?.imageUrl || '',
    followers: followers?.count == null ? '' : String(followers.count),
    following: friends?.count == null ? '' : String(friends.count),
    bio: detail?.description || '',
    url: 'https://www.roblox.com/users/' + id + '/profile',
    message: 'Profile details retrieved from Roblox public endpoints.',
  }
}

const parseInstagramDescription = (description: string) => {
  const match = /^([\d.,]+[KMB]?)\s+Followers,\s+([\d.,]+[KMB]?)\s+Following,\s+([\d.,]+[KMB]?)\s+Posts/i.exec(description)
  const separator = description.indexOf(' - ')
  return {
    followers: match?.[1] || '',
    following: match?.[2] || '',
    bio: separator === -1 ? '' : description.slice(separator + 3).trim(),
  }
}

const lookupPublicProfile = async (platform: string, username: string) => {
  const urlBuilder = profileUrls[platform]
  if (!urlBuilder) throw new Error('Unsupported social platform.')
  if (platform === 'Roblox') return lookupRoblox(username)
  if (platform === 'TikTok') {
    throw new Error('TikTok blocks anonymous server-side profile lookups. Add the profile details manually.')
  }

  const url = urlBuilder(username)
  if (platform === 'SoundCloud') {
    const endpoint = 'https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(url)
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'MementoProfileLookup/1.0' },
      signal: AbortSignal.timeout(9000),
    })
    if (response.status === 404) throw new Error('No public SoundCloud profile was found for that username.')
    if (!response.ok) throw new Error('SoundCloud profile lookup returned HTTP ' + response.status + '.')
    const embed = await response.json()
    const displayName = embed.title || embed.author_name || ''
    if (!displayName) throw new Error('SoundCloud did not return profile metadata for that username.')
    return {
      displayName,
      avatarUrl: embed.thumbnail_url || '',
      followers: '',
      following: '',
      bio: '',
      url,
      message: 'SoundCloud returned public oEmbed profile metadata. Follower counts are not included in this endpoint.',
    }
  }

  const html = await getProfilePage(url)
  const title = metaValue(html, ['og:title', 'twitter:title'])
  const description = metaValue(html, ['og:description', 'description', 'twitter:description'])
  const avatarUrl = metaValue(html, ['og:image', 'og:image:secure_url', 'twitter:image'])
  let displayName = ''
  let bio = description
  let followers = ''
  let following = ''

  if (platform === 'X') {
    const match = /^(.+?)\s+\(@([A-Za-z0-9_]{1,20})\)\s+on X$/.exec(title)
    if (!match || match[2].toLowerCase() !== username.toLowerCase()) {
      throw new Error('X did not return matching public profile metadata. The account may be private or unavailable to anonymous visitors.')
    }
    displayName = match[1]
  } else if (platform === 'Instagram') {
    const match = /^\s*(.*?)\s*\(@([A-Za-z0-9_.]+)\)\s*•\s*Instagram/.exec(title)
    if (!match || match[2].toLowerCase() !== username.toLowerCase()) {
      throw new Error('Instagram did not expose matching public profile metadata. This does not necessarily mean the username is unavailable.')
    }
    displayName = match[1] || ''
    const parsed = parseInstagramDescription(description)
    followers = parsed.followers
    following = parsed.following
    bio = parsed.bio
  } else if (platform === 'Twitch') {
    const match = /^(.+?)\s+-\s+Twitch$/.exec(title)
    if (!match) {
      throw new Error('Twitch did not expose public profile metadata. A missing channel and a blocked lookup can look the same.')
    }
    displayName = match[1].trim()
  } else if (platform === 'YouTube') {
    if (!title || /^(youtube|log ?in|sign ?in)$/i.test(title)) {
      throw new Error('YouTube did not return public channel metadata for that handle.')
    }
    displayName = title
    const subscriberText = html.match(/"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/)?.[1]
      || html.match(/"subscriberCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/)?.[1]
    if (subscriberText) followers = countFromText(subscriberText, ['subscribers']) || subscriberText.replace(/\s*subscribers?/i, '')
  }

  const hasData = Boolean(displayName || avatarUrl || bio || followers || following)
  if (!hasData) throw new Error('The profile page did not expose readable public profile information. You can still enter the details manually.')
  const message = platform === 'Instagram'
    ? followers || following
      ? 'Instagram public profile metadata retrieved, including the counts it exposes. Some accounts hide these fields.'
      : 'Instagram profile metadata retrieved. Follower counts were not exposed.'
    : platform === 'Twitch'
      ? 'Twitch public profile metadata retrieved. Follower counts require Twitch API authorisation.'
      : platform === 'YouTube'
        ? followers
          ? 'YouTube channel metadata retrieved, including its public subscriber count.'
          : 'YouTube channel metadata retrieved. Subscriber count was not exposed in the public page.'
        : 'X public profile metadata retrieved. Only fields visible to anonymous visitors were filled.'
  return { displayName, avatarUrl, followers, following, bio, url, message }
}

const socialProfileMiddleware = (server: any) => {
  server.middlewares.use('/api/social-profile', async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST')
      res.end(JSON.stringify({ error: 'Use POST for profile lookups.' }))
      return
    }
    try {
      const bodyText = await new Promise<string>((resolve, reject) => {
        let raw = ''
        req.setEncoding('utf8')
        req.on('data', (chunk: string) => { raw += chunk })
        req.on('end', () => resolve(raw))
        req.on('error', reject)
      })
      const body = JSON.parse(bodyText)
      const platform = String(body.platform || '')
      const username = String(body.username || '').trim().replace(/^@/, '')
      if (!profileUrls[platform]) throw new Error('Unsupported social platform.')
      if (!username || username.length > 100) throw new Error('Enter a valid username.')
      const result = await lookupPublicProfile(platform, username)
      res.statusCode = 200
      res.end(JSON.stringify(result))
    } catch (error) {
      res.statusCode = 422
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Profile lookup failed.' }))
    }
  })
}

const socialProfileProxy = {
  name: 'memento-social-profile-proxy',
  configureServer: socialProfileMiddleware,
  configurePreviewServer: socialProfileMiddleware,
}

export default defineConfig({ plugins: [react(), socialProfileProxy] })
