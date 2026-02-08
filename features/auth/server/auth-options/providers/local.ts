import Credentials from 'next-auth/providers/credentials'

const MOCK_USER = {
  address: process.env.MOCK_USER_ADDRESS ?? '0x00000000000000000000000000000000',
}

export const localProvider = Credentials({
  id: 'local',
  name: 'local',
  credentials: {},
  async authorize() {
    return {
      id: MOCK_USER.address,
    }
  },
})
