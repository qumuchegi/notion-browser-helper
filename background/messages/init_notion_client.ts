import type { PlasmoMessaging } from "@plasmohq/messaging"

import { initNotionClientOnBackground } from "~background"

export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const notionAccessToken = req.body.notionAccessToken
  console.log("init_notion_client:", { notionAccessToken })
  initNotionClientOnBackground(notionAccessToken)
  res.send({})
}
