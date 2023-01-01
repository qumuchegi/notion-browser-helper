import type { PlasmoMessaging } from "@plasmohq/messaging"

import { addPageId, setBookmarkNotionBlockIdByPageId } from "~background/index"

export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { pageId, bookmarkBlockIds, statusBlockId } = req.body
  console.log("add_sync_bookmark_target_page", { pageId })
  addPageId(pageId)
  setBookmarkNotionBlockIdByPageId(pageId, bookmarkBlockIds, statusBlockId)
  res.send({})
}
