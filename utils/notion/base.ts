import { Client } from "@notionhq/client"

import { getAuthInfo } from "~storage"

let notionClient

export const initNotionClient = (authToken: string) => {
  if (!notionClient) {
    notionClient = new Client({
      auth: authToken
    })
  }
  return notionClient
}

export const killNotionClient = () => {
  notionClient = null
}

export type AccessNotionWrappedFn<T, R> = (
  notionClient: Client,
  params: T
) => Promise<R>

export const accessNotionWrapper = <T, R>(
  notionApiFn: AccessNotionWrappedFn<T, R>
) => {
  return async (p: T) => {
    const authInfo = getAuthInfo()
    const accessToken = authInfo.access_token
    const client = initNotionClient(accessToken)
    if (!client) {
      return
    }
    return notionApiFn(client, p)
  }
}
