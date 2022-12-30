/**
 * 不绑定 window，适合后台运行
 */
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints"

import { getBookmarkTree } from "~utils/bookmark"
import parseBookmarksTreeToCheckboxTree from "~utils/parseBookmarksData"
import type { CheckboxTreeNode } from "~utils/parseBookmarksData"
import { serialExcutePromises } from "~utils/promise"

import type { AccessNotionWrappedFn } from "./base"

type BookmarkTreeNode = CheckboxTreeNode
type Params = {
  notionPageId: string
  setBookmarkNotionBlockIdByPageId: (
    pageId: string,
    bookmarkBlockIds: string[],
    statusBlockId: string
  ) => void
  getBookmarkNotionBlockIdByPageId: (pageId: string) => {
    bookmarkBlockIds: string[]
    statusBlockId: string
  }
}

export const _exportBookmarkToNotionPage: AccessNotionWrappedFn<
  Params,
  void
> = async (client, params) => {
  const {
    notionPageId,
    setBookmarkNotionBlockIdByPageId,
    getBookmarkNotionBlockIdByPageId
  } = params
  const bookmarkTree = await getBookmarkTree()
  const parsed: BookmarkTreeNode[] = bookmarkTree.map((node) =>
    parseBookmarksTreeToCheckboxTree(node)
  )
  // check existed database id
  const {
    statusBlockId: maybeStatusBlockId,
    bookmarkBlockIds: maybeBookmarkBlockIds
  } = getBookmarkNotionBlockIdByPageId(notionPageId)

  let addLoadingBlockId
  const createTreeBlok = async (treeNodes: BookmarkTreeNode[]) => {
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
                  content: "loading bookmark from browser, wait for a while 🔄"
                },
                type: "text",
                annotations: { color: "orange" }
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
    setBookmarkNotionBlockIdByPageId(
      notionPageId,
      bookmarkBlockIds,
      addLoadingBlockId
    )
    await client.blocks.update({
      block_id: addLoadingBlockId,
      heading_2: {
        rich_text: [
          {
            text: {
              content: `loaded bookmark complete! ✅`
            },
            annotations: { color: "green_background" }
          },
          {
            text: {
              content: `latest update time: ${new Date().toLocaleString()}`
            },
            annotations: { color: "purple" }
          }
        ]
      }
    })
    return
  }

  const updateTreeBlok = async (
    treeNodes: BookmarkTreeNode[],
    statusBlockId: string,
    bookmarkBlockIds: string[]
  ) => {
    // delete existed
    // what fuck !? 必须要串行请求，不然 notion api 报错 "Conflict occurred while saving."
    await serialExcutePromises([
      () =>
        client.blocks.delete({
          block_id: statusBlockId
        }),
      ...bookmarkBlockIds.map(
        (id) => () =>
          client.blocks.delete({
            block_id: id
          })
      )
    ])
    // create new
    return await createTreeBlok(treeNodes)
  }
  if (maybeBookmarkBlockIds && maybeBookmarkBlockIds.length) {
    return await updateTreeBlok(
      parsed,
      maybeStatusBlockId,
      maybeBookmarkBlockIds
    )
  } else {
    // not exist, create a database
    return await createTreeBlok(parsed)
  }
}

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
