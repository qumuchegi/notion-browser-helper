import type {
  BlockObjectRequest,
  CreateDatabaseParameters,
  UpdateDatabaseParameters
} from "@notionhq/client/build/src/api-endpoints"
import { type } from "os"

import {
  cacheBookmarkNotionBlockIdByPageId,
  getBookmarkBlockIdByPageId
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
    const [maybeStatusBlockId, maybeBookmarkBlockIds] =
      getBookmarkBlockIdByPageId(notionPageId)
    console.log({ maybeBookmarkBlockIds })

    let addLoadingBlockId
    const createTreeBlok = async (treeNodes: BookmarkTreeNode[]) => {
      console.log({ treeNodes })
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
                    content:
                      "loading bookmark from browser..., wait for a while"
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
      const bookmarkBlockIds = await convertBookMarkTreeToNotionToggleBlock(
        treeNodes,
        notionPageId,
        async (blocks, parentBlockId) => {
          try {
            const res = await client.blocks.children.append({
              block_id: parentBlockId,
              children: blocks
            })
            return { nodeBlockIds: res.results.map((r) => r.id) }
          } catch (err) {
            console.error(err)
            return { nodeBlockIds: [] }
          }
        }
      )
      // remove loading on nottion page
      addLoadingBlockId = addLoadingBlockRes.results[0].id
      cacheBookmarkNotionBlockIdByPageId(
        notionPageId,
        bookmarkBlockIds,
        addLoadingBlockId
      )
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

    const updateDatabase = async (
      treeNodes: BookmarkTreeNode[],
      statusBlockId: string,
      bookmarkBlockIds: string[]
    ) => {
      await Promise.all([
        client.blocks.delete({
          block_id: statusBlockId
        }),
        ...bookmarkBlockIds.map((id) =>
          client.blocks.delete({
            block_id: id
          })
        )
      ])
      createTreeBlok(treeNodes)
    }
    if (maybeBookmarkBlockIds) {
      console.log("update existed databse")
      updateDatabase(parsed, maybeStatusBlockId, maybeBookmarkBlockIds)
    } else {
      // not exist, create a database
      await createTreeBlok(parsed)
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
  const blockIds = await serialExcutePromises(
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
                }
              }
            ],
            parentBlockId
          )
          console.log({ nodeBlockIds, node })
          await convertBookMarkTreeToNotionToggleBlock(
            node.children,
            nodeBlockIds[0],
            handleNodesSameParent
          )
          return nodeBlockIds
        } else {
          // bookmark
          // validate url
          const isUrlValid = node.extra.url?.match(/^https?/)
          leaveNodes.push({
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                {
                  text: isUrlValid
                    ? {
                        content: node.title,
                        link: { url: node.extra.url }
                      }
                    : {
                        content: node.title
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
              ].concat(
                isUrlValid
                  ? []
                  : [
                      {
                        text: {
                          content: `  invalid url (${node.extra.url})`
                        },
                        annotations: {
                          color: "red"
                        }
                      }
                    ]
              )
            }
          })
          return undefined
        }
      }
    })
  )
  const { nodeBlockIds } = leaveNodes.length
    ? await handleNodesSameParent(leaveNodes, parentBlockId)
    : { nodeBlockIds: [] }
  return nodeBlockIds.concat(blockIds.flat().filter((i) => !!i))
}
