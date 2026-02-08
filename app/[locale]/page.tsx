import { routes } from '@/utils/routes'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../features/auth/server/auth-options'

const Home = async () => {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(routes.signIn())
  }

  return redirect(routes.dashboard())
}

export default Home
