// Uploads a JSON object to Dropbox using the Content Upload API.
// Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-upload
export async function uploadJsonToDropbox(
  filename: string,
  data: unknown
): Promise<void> {
  const token = process.env.DROPBOX_ACCESS_TOKEN
  if (!token) {
    throw new Error("DROPBOX_ACCESS_TOKEN is not configured.")
  }

  const content = JSON.stringify(data, null, 2)

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Dropbox-API-Arg tells the API where to put the file and how to
      // handle name conflicts — sent as a JSON string in a header, not the body
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