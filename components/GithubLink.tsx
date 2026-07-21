import { GitFork } from 'lucide-react'

const REPOSITORY_URL = 'https://github.com/Neveryu/react-fund'

export default function GithubLink() {
  return (
    <a
      href={REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="查看 GitHub 代码仓库"
      title="查看 GitHub 代码仓库"
      className="group fixed bottom-20 right-0 z-40 flex h-11 items-center gap-2 rounded-l-lg border border-r-0 border-border/80 bg-card/95 px-3 text-card-foreground shadow-lg backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:bottom-auto sm:top-1/2 sm:h-12 sm:-translate-y-1/2 sm:px-3.5"
    >
      <GitFork className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:max-w-24 group-hover:opacity-100 sm:block">
        GitHub
      </span>
    </a>
  )
}
