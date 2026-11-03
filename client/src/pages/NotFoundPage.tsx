import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <Leaf className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl text-muted-foreground">Oops! This page doesn&apos;t exist.</p>
      <Link
        to="/"
        className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  )
}
