import type {
  BlockObjectRequest,
  CreateDatabaseParameters,
  UpdateDatabaseParameters
} from "@notionhq/client/build/src/api-endpoints"
import { type } from "os"

import {
  cacheNotionBlockIdByPageId,
  getNotionDatabaseIdByPageId
} from "~storage"
import parseBookmarksTreeToCheckboxTree from "~utils/parseBookmarksData"
import type { CheckboxTreeNode } from "~utils/parseBookmarksData"
import { serialExcutePromises } from "~utils/promise"

import { accessNotionWrapper } from "./base"
import type { AccessNotionWrappedFn } from "./base"

type BookmarkTreeNode = CheckboxTreeNode
// 叶子节点，无子节点
type BookmarkTreeLeaveNode = Omit<BookmarkTreeNode, "children">
// 有子节点的节点
type BookmarkTreeParentNode = BookmarkTreeNode
type Params = {
  notionPageId: string
}
const exportBookmarkToNotionPage: AccessNotionWrappedFn<Params, void> = async (
  client,
  params
) => {
  const { notionPageId } = params
  chrome.bookmarks.getTree(async (bookmarkTree) => {
    const parsed: BookmarkTreeNode[] = bookmarkTree.map((node) =>
      parseBookmarksTreeToCheckboxTree(node)
    )
    // check existed database id
    const maybeDatabaseId = getNotionDatabaseIdByPageId(notionPageId)
    console.log({ maybeDatabaseId })

    // show loading on nottion page
    const addLoadingBlockRes = await client.blocks.children.append({
      block_id: notionPageId,
      children: [
        {
          type: "heading_2",
          heading_2: {
            rich_text: [
              {
                text: {
                  content: "loading bookmark from browser..., wait for a while"
                },
                type: "text",
                annotations: { color: "blue_background" }
              },
              {
                text: { content: "❗️" },
                type: "text",
                annotations: {
                  color: "gray_background"
                }
              }
            ]
          }
        }
      ]
    })
    const addLoadingBlockId = addLoadingBlockRes.results[0].id
    const createTreeBlok = async (treeNodes: BookmarkTreeNode[]) => {
      console.log({ treeNodes })
      return convertBookMarkTreeToNotionToggleBlock(
        treeNodes,
        notionPageId,
        async (blocks, parentBlockId) => {
          const res = await client.blocks.children.append({
            block_id: parentBlockId,
            children: blocks
          })
          return { nodeBlockIds: res.results.map((r) => r.id) }
        }
      )
    }

    const updateDatabase = async (treeNodes: BookmarkTreeNode[]) => {
      // await client.databases.update({
      //   database_id: maybeDatabaseId,
      //   properties
      // })
    }
    if (maybeDatabaseId) {
      console.log("update existed databse")
      updateDatabase(parsed)
    } else {
      // not exist, create a database
      await createTreeBlok(parsed)
      // remove loading on nottion page
      client.blocks.update({
        block_id: addLoadingBlockId,
        heading_2: {
          rich_text: [
            {
              text: { content: "loaded bookmark complete! ✅" },
              annotations: { color: "green_background" }
            }
          ]
        }
      })
    }
  })
}

export default accessNotionWrapper(exportBookmarkToNotionPage)

async function convertBookMarkTreeToNotionToggleBlock(
  treeNodes: BookmarkTreeNode[],
  parentBlockId: string,
  handleNodesSameParent: (
    blocks: BlockObjectRequest[],
    parentBlockId: string
  ) => Promise<{ nodeBlockIds: string[] }>
) {
  let leaveNodes = []
  await serialExcutePromises(
    treeNodes.map((node) => {
      return async () => {
        if (node.children) {
          // bookmark directory
          const { nodeBlockIds } = await handleNodesSameParent(
            [
              {
                type: "toggle",
                toggle: {
                  rich_text: [
                    {
                      text: {
                        content: node.title
                      }
                    }
                  ]
                  // children: []
                }
              }
            ],
            parentBlockId
          )
          console.log({ nodeBlockIds, node })
          return convertBookMarkTreeToNotionToggleBlock(
            node.children,
            nodeBlockIds[0],
            handleNodesSameParent
          )
        } else {
          // bookmark
          leaveNodes.push({
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                {
                  text: {
                    content: node.title,
                    link: { url: node.extra.url }
                  },
                  annotations: {
                    color: "blue"
                  }
                },
                {
                  text: {
                    content: `    add at ${new Date(
                      node.extra.addTime
                    ).toLocaleDateString()}`
                  },
                  annotations: {
                    color: "gray",
                    italic: true
                  }
                }
              ]
            }
          })
        }
      }
    })
  )
  return leaveNodes.length && handleNodesSameParent(leaveNodes, parentBlockId)
}
