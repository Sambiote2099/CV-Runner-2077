// Uploads a JSON object to Dropbox using the Content Upload API.
// Uses a refresh token to get a fresh short-lived access token on every
// call — refresh tokens don't expire, so this avoids the manual token
// regeneration we hit with the App Console's "Generate access token" button.

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.DROPBOX_REFRESH_TOKEN!,
    client_id: process.env.DROPBOX_APP_KEY!,
    client_secret: process.env.DROPBOX_APP_SECRET!,
  })

  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Dropbox token refresh failed: ${error}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function uploadJsonToDropbox(
  filename: string,
  data: unknown
): Promise<void> {
  const accessToken = await getAccessToken()
  const content = JSON.stringify(data, null, 2)

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: `/support-tickets/${filename}`,
        mode: "add",
        autorename: true,
        mute: false,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: content,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Dropbox upload failed: ${res.status} — ${errorText}`)
  }
}