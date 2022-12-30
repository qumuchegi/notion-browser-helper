import { Client } from "@notionhq/client"
import { message } from "antd"

import { sendToBackground } from "@plasmohq/messaging"

import { getAuthInfo } from "~storage"

let notionClient

export const initNotionClient = (authToken: string) => {
  if (!notionClient) {
    notionClient = new Client({
      auth: authToken
    })
  }
  sendToBackground({
    name: "init_notion_client",
    body: {
      notionAccessToken: authToken
    }
  })
  return notionClient
}

export const getNotionClient = () => {
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
    let accessToken
    try {
      const authInfo = getAuthInfo()
      accessToken = authInfo.access_token
    } catch (err) {
      // not authorized
      message.error(
        "you are not authorized to Notion, please first login in Notion"
      )
    }

    const client = initNotionClient(accessToken)
    if (!client) {
      return
    }
    return notionApiFn(client, p)
  }
}
