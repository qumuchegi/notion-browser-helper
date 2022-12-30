import { Client } from "@notionhq/client"

import { addBookmarkListenerOnAllEvent } from "~bookmarkEvent"
import { AUTH_CACHE_KEY } from "~constant"
import { _exportBookmarkToNotionPage } from "~utils/notion/_exportBookmarkToNotionPage"
import { queueExcuteSyncBookmarkPromises } from "~utils/promise"

export {
  addPageId,
  initNotionClientOnBackground,
  setBookmarkNotionBlockIdByPageId,
  getBookmarkNotionBlockIdByPageId
}

let pageIds = []
let notionClient
let notionPageIdMap2BookmarkBlockIds = new Map<
  string,
  {
    bookmarkBlockIds: string[]
    statusBlockId: string
  }
>()
function addPageId(newPageId: string) {
  pageIds = [...new Set([...pageIds, newPageId])]
  registerBookmarkSyncListener()
}
function initNotionClientOnBackground(notionAccessToken: string) {
  notionClient = new Client({
    auth: notionAccessToken
  })
  return notionClient
}
function setBookmarkNotionBlockIdByPageId(
  pageId,
  bookmarkBlockIds,
  statusBlockId
) {
  notionPageIdMap2BookmarkBlockIds.set(pageId, {
    bookmarkBlockIds,
    statusBlockId
  })
}
function getBookmarkNotionBlockIdByPageId(pageId) {
  const maybeBookmarkAlreadySync = notionPageIdMap2BookmarkBlockIds.get(pageId)
  return {
    bookmarkBlockIds: maybeBookmarkAlreadySync?.bookmarkBlockIds ?? [],
    statusBlockId: maybeBookmarkAlreadySync?.statusBlockId ?? ""
  }
}

function registerBookmarkSyncListener() {
  pageIds.forEach((pageId) => {
    addBookmarkListenerOnAllEvent(pageId, () =>
      queueExcuteSyncBookmarkPromises(() => {
        return _exportBookmarkToNotionPage(notionClient, {
          notionPageId: pageId,
          setBookmarkNotionBlockIdByPageId,
          getBookmarkNotionBlockIdByPageId
        })
      })
    )
  })
}
