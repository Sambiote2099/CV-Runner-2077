// Salesforce REST API helper.
// Handles authentication via OAuth 2.0 Client Credentials Flow and provides
// a function to create-or-update an Account with a linked Contact.
//
// Client Credentials Flow is the recommended approach for server-to-server
// integrations where there's no specific end-user context needed — the app
// authenticates as itself (via a pre-configured integration user on the
// Connected App), not as any particular Salesforce user. No password is
// ever transmitted.

type SalesforceTokenResponse = {
  access_token: string
  instance_url: string
  token_type: string
}

type SalesforceCreateResponse = {
  id: string
  success: boolean
  errors: string[]
}

type SalesforceQueryResponse<T> = {
  totalSize: number
  done: boolean
  records: T[]
}

// Step 1 — authenticate with Salesforce and get an access token.
// Client Credentials flow: exchange the Connected App's client_id/client_secret
// directly for a token. Requires "Enable Client Credentials Flow" to be turned
// on for the Connected App, with an integration user assigned under Manage.
async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SALESFORCE_CLIENT_ID!,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
  })

  // Must use the org's My Domain URL — login.salesforce.com / test.salesforce.com
  // are not supported for this flow.
  const res = await fetch(
    `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Salesforce auth failed: ${error}`)
  }

  return res.json()
}

// The data we collect from the user to create the Salesforce records.
export type SalesforceContactData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  site: string           // → Account site (e.g. "Headquarters", "Remote")
  jobTitle: string        // → Contact title
  department: string      // → Contact department
  birthdate: string        // → Contact birthdate, expected as "YYYY-MM-DD"
  languages: string        // → Contact languages — NOTE: confirm the real API name
                            // for this field in your org (Setup → Object Manager →
                            // Contact → Fields & Relationships). "Languages" is not
                            // a standard Salesforce field; if it's custom the API
                            // name is likely "Languages__c" — update the field name
                            // below if so.
  description: string     // → Contact description
}

// Step 2 — create or update an Account + linked Contact for this person.
// Looks up an existing Contact by email first:
//   - if found, updates that Contact (and its linked Account) in place
//   - if not found, creates a new Account + Contact as before
// This avoids Salesforce's built-in duplicate-detection rule blocking the
// insert when the same person is submitted more than once, and avoids
// leaving an orphan Account behind when that happens.
export async function createSalesforceContact(
  data: SalesforceContactData
): Promise<{ accountId: string; contactId: string }> {
  const { access_token, instance_url } = await getSalesforceToken()

  const authHeaders = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  }

  // POST — create a new record. Returns { id, success, errors }.
  async function sfCreate(object: string, body: Record<string, string>) {
    const res = await fetch(
      `${instance_url}/services/data/v59.0/sobjects/${object}/`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Salesforce ${object} creation failed: ${error}`)
    }

    return res.json() as Promise<SalesforceCreateResponse>
  }

  // PATCH — update an existing record by Id. Salesforce returns 204 No
  // Content on success, so there's no JSON body to parse.
  async function sfUpdate(object: string, id: string, body: Record<string, string>) {
    const res = await fetch(
      `${instance_url}/services/data/v59.0/sobjects/${object}/${id}`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Salesforce ${object} update failed: ${error}`)
    }
  }

  // SOQL query via GET — used to look up an existing Contact by email.
  async function sfQuery<T>(soql: string) {
    const res = await fetch(
      `${instance_url}/services/data/v59.0/query/?q=${encodeURIComponent(soql)}`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Salesforce query failed: ${error}`)
    }

    return res.json() as Promise<SalesforceQueryResponse<T>>
  }

  const fullName = `${data.firstName} ${data.lastName}`.trim()

  // Escape single quotes in the email before dropping it into SOQL, to avoid
  // malformed queries (basic safety, not a full SOQL-injection defense —
  // email is validated upstream so this is a low-risk field regardless).
  const safeEmail = data.email.replace(/'/g, "\\'")

  const existing = await sfQuery<{ Id: string; AccountId: string | null }>(
    `SELECT Id, AccountId FROM Contact WHERE Email = '${safeEmail}' LIMIT 1`
  )

  const accountFields = {
    Name: fullName,
    Phone: data.phone,
    Site: data.site,
    Description: `Created from CV Management System for ${data.email}`,
  }

  const contactFields = {
    FirstName: data.firstName,
    LastName: data.lastName,
    Email: data.email,
    Phone: data.phone,
    Title: data.jobTitle,
    Department: data.department,
    Birthdate: data.birthdate,
    Languages__c: data.languages, // ← adjust to "Languages__c" if this is a custom field in your org
    Description: data.description,
  }

  if (existing.totalSize > 0) {
    // Contact already exists — update it and its linked Account in place.
    const contactId = existing.records[0].Id
    const accountId = existing.records[0].AccountId

    if (accountId) {
      await sfUpdate("Account", accountId, accountFields)
    }
    await sfUpdate("Contact", contactId, contactFields)

    return {
      accountId: accountId ?? "",
      contactId,
    }
  }

  // No existing Contact — create a fresh Account + Contact.
  const accountResult = await sfCreate("Account", accountFields)

  if (!accountResult.success) {
    throw new Error(`Failed to create Salesforce Account: ${accountResult.errors.join(", ")}`)
  }

  const contactResult = await sfCreate("Contact", {
    ...contactFields,
    AccountId: accountResult.id, // ← links Contact to the Account we just created
  })

  if (!contactResult.success) {
    throw new Error(`Failed to create Salesforce Contact: ${contactResult.errors.join(", ")}`)
  }

  return {
    accountId: accountResult.id,
    contactId: contactResult.id,
  }
}