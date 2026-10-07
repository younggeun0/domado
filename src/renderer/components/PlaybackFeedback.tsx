import {
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/solid'

interface PlaybackFeedbackProps {
  mode: 'play' | 'pause'
}

export default function PlaybackFeedback({ mode }: PlaybackFeedbackProps) {
  const Icon = mode === 'play' ? PlayIcon : PauseIcon

  return (
    <div className="playback-feedback pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="flex h-12 w-12 min-[240px]:h-20 min-[240px]:w-20 items-center justify-center rounded-full bg-black/25 text-white/70 backdrop-blur-sm">
        <Icon className="h-6 w-6 min-[240px]:h-10 min-[240px]:w-10" />
      </div>
    </div>
  )
}
