import { Preferences } from '@capacitor/preferences'

const accessTokenKey = 'auth.accessToken'
const pendingNameKey = 'auth.pendingProfileName'

export async function loadStoredSession(): Promise<{
  accessToken: string | null
  pendingProfileName: string | null
}> {
  const [token, name] = await Promise.all([
    Preferences.get({ key: accessTokenKey }),
    Preferences.get({ key: pendingNameKey }),
  ])

  return {
    accessToken: token.value,
    pendingProfileName: name.value,
  }
}

export async function storeAccessToken(token: string): Promise<void> {
  await Preferences.set({ key: accessTokenKey, value: token })
}

export async function removeAccessToken(): Promise<void> {
  await Preferences.remove({ key: accessTokenKey })
}

export async function storePendingProfileName(name: string): Promise<void> {
  await Preferences.set({ key: pendingNameKey, value: name })
}

export async function removePendingProfileName(): Promise<void> {
  await Preferences.remove({ key: pendingNameKey })
}
