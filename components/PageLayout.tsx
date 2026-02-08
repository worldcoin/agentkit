import { clsx } from '@/utils/clsx'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export const Page = ({ children, className }: Props) => {
  return <div className={clsx('flex min-h-dvh flex-col', className)}>{children}</div>
}

const Header = ({ children, className }: Props) => {
  return (
    <header className={clsx('flex justify-center border-none', className)}>{children}</header>
  )
}

const Main = ({ children, className }: Props) => {
  return (
    <main className={clsx('scrollbar-hide grow overflow-y-auto', className)}>{children}</main>
  )
}

const Footer = ({ children, className }: Props) => {
  return <footer className={clsx(className)}>{children}</footer>
}

Page.Header = Header
Page.Main = Main
Page.Footer = Footer
