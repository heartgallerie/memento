import { Fragment, type ReactNode } from 'react'

import helloKitty from '../custom-emojis/hello-kitty-fbnujaer33.png'
import helloKittyAlt from '../custom-emojis/hello-kitty-lukxhnroe6t.png'
import snoopy from '../custom-emojis/snoopy-nc0wjfatcfe.png'
import pinkBow from '../custom-emojis/pink-bow-qzncwquzfzd.png'
import wingKitty from '../custom-emojis/hello-kitty-with-wings-uaqro87c4ng.png'
import gunKitty from '../custom-emojis/hello-kitty-whit-a-gun-abpawe9qyud.png'
import sleepKitty from '../custom-emojis/hello-kitty-sleep-rbx5ide1ve.png'
import onesieKitty from '../custom-emojis/my-melody-hello-kitty-emoji-xnqrqhcuyf.png'
import ash from '../custom-emojis/tortie-munchkin-cat-sitting-7atxencxtuz.png'
import cherryKitty from '../custom-emojis/hello-kitty-with-cherry-roy1mu6qjkp.png'

export const customEmojiImages: Record<string, string> = {
  hk: helloKitty,
  hellokitty: helloKittyAlt,
  snoopy,
  pinkbow: pinkBow,
  wingkitty: wingKitty,
  gunkitty: gunKitty,
  sleepkitty: sleepKitty,
  onesiekitty: onesieKitty,
  ash,
  cherrykitty: cherryKitty,
}

export const emojiShortcodes: Record<string, string> = {
  sob:'😭',cry:'😢',crying:'😢',joy:'😂',laughing:'😆',laugh:'🤣',lol:'😂',
  smile:'😊',smiley:'😃',grin:'😁',happy:'😄',blush:'☺️',heart:'❤️',love:'❤️',
  broken_heart:'💔',heart_eyes:'😍',purple_heart:'💜',blue_heart:'💙',white_heart:'🤍',
  black_heart:'🖤',sparkles:'✨',sparkle:'✨',star:'⭐',star2:'🌟',eyes:'👀',
  skull:'💀',fire:'🔥',angry:'😠',rage:'😡',sad:'🙁',pleading:'🥺',plead:'🥺',
  pray:'🙏',thumbsup:'👍',thumbs_up:'👍',thumbsdown:'👎',wave:'👋',thinking:'🤔',
  wink:'😉',kiss:'😘',kissing_heart:'😘',cool:'😎',sweat:'😅',cry_laugh:'😂',
  clap:'👏',party:'🥳',tada:'🎉',hundred:'💯',check:'✅',warning:'⚠️',
  cat:'🐱',smiley_cat:'😺',heart_eyes_cat:'😻',dog:'🐶',panda:'🐼',rabbit:'🐰',
  moon:'🌙',sun:'☀️',flower:'🌸',cherry_blossom:'🌸',rose:'🌹',tulip:'🌷',
  butterfly:'🦋',bee:'🐝',rainbow:'🌈',cloud:'☁️',cloudy:'🌥️',snowflake:'❄️',
  coffee:'☕',tea:'🍵',pizza:'🍕',cake:'🍰',strawberry:'🍓',cherries:'🍒',
  peach:'🍑',apple:'🍎',sparkling_heart:'💖',two_hearts:'💕',revolving_hearts:'💞',
  gift:'🎁',balloon:'🎈',music:'🎵',headphones:'🎧',camera:'📷',film:'🎬',
  computer:'💻',phone:'📱',zzz:'💤',sleeping:'😴',scream:'😱',surprised:'😮',
  neutral_face:'😐',expressionless:'😑',unamused:'😒',relieved:'😌',thinking_face:'🤔',
  upside_down:'🙃',upside_down_face:'🙃',skull_and_crossbones:'☠️',poop:'💩',
  ok_hand:'👌',ok:'👌',clap_hands:'👏',muscle:'💪',pray_hands:'🙏',
  eyes2:'👀',handshake:'🤝',peace:'✌️',v:'✌️',rocket:'🚀',sparkling:'✨',
  x:'❌',cross:'❌',no:'🚫',heartpulse:'💗',heartbeat:'💓',orange_heart:'🧡',
  yellow_heart:'💛',green_heart:'💚',brown_heart:'🤎',gift_heart:'💝',
}

export function replaceEmojiShortcodes(value: string) {
  return value.replace(/:([a-z0-9_+-]+):/gi, (match, name: string) =>
    emojiShortcodes[name.toLowerCase()] || match
  )
}


export function renderEmojiShortcodesInHtml(html: string) {
  return html.replace(/>([^<>]+)</g, (_match, content: string) => {
    const rendered = content.replace(/:([a-z0-9_+-]+):/gi, (token, rawName: string) => {
      const name = rawName.toLowerCase()
      const src = customEmojiImages[name]
      if (src) return `<img class="memento-custom-emoji" src="${src}" alt=":${name}:" title=":${name}:" draggable="false"/>`
      return emojiShortcodes[name] || token
    })
    return `>${rendered}<`
  })
}

export function EmojiText({ text, className }: { text: string; className?: string }) {
  const pattern = /:([a-z0-9_+-]+):/gi
  const parts: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const name = match[1].toLowerCase()
    const src = customEmojiImages[name]
    const unicode = emojiShortcodes[name]
    if (src) {
      parts.push(<img key={match.index} className="memento-custom-emoji" src={src} alt={`:${name}:`} title={`:${name}:`} draggable={false}/>)
    } else if (unicode) {
      parts.push(<Fragment key={match.index}>{unicode}</Fragment>)
    } else {
      parts.push(match[0])
    }
    last = pattern.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span className={className}>{parts}</span>
}
