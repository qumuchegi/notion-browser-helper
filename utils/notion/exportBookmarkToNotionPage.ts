import type {
  CreateDatabaseParameters,
  UpdateDatabaseParameters
} from "@notionhq/client/build/src/api-endpoints"

import {
  cacheNotionBlockIdByPageId,
  getNotionDatabaseIdByPageId
} from "~storage"
import parseBookmarksTreeToCheckboxTree from "~utils/parseBookmarksData"
import type { CheckboxTreeNode } from "~utils/parseBookmarksData"

import { accessNotionWrapper } from "./base"
import type { AccessNotionWrappedFn } from "./base"

type BookmarkTreeNode = CheckboxTreeNode
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

    const createTreeBlok = async (treeNodes: BookmarkTreeNode[]) => {
      const normalizedTree = convertBookMarkTreeToNotionToggleBlock(treeNodes)
      console.log({ normalizedTree: JSON.stringify(normalizedTree) })
      const res = await client.blocks.children.append({
        block_id: notionPageId,
        children: normalizedTree
      })
      console.log({ res })
      // cacheNotionBlockIdByPageId(notionPageId, res1.)
      // console.log({ res })
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
      createTreeBlok(parsed)
    }
  })
}

export default accessNotionWrapper(exportBookmarkToNotionPage)

// 嵌套超过 3 层，notion api 返回失败
function convertBookMarkTreeToNotionToggleBlock(treeNodes: BookmarkTreeNode[]) {
  return treeNodes.map((node) => {
    if (node.children) {
      // bookmark directory
      return {
        type: "toggle",
        toggle: {
          rich_text: [
            {
              text: {
                content: node.title
              }
            }
          ],
          children: convertBookMarkTreeToNotionToggleBlock(node.children)
        }
      }
    }
    // bookmark
    return {
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            text: {
              content: "url",
              link: { url: node.extra.url }
            },
            annotations: {
              color: "blue"
            }
          },
          {
            text: {
              content: `  (${new Date(
                node.extra.addTime
              ).toLocaleDateString()})`
            },
            annotations: {
              color: "gray",
              italic: true
            }
          }
        ]
      }
    }
  })
}

// let test = [
//   {
//     type: "toggle",
//     toggle: {
//       rich_text: [
//         {
//           text: {
//             content: "1"
//           }
//         }
//       ],
//       children: [
//         {
//           type: "toggle",
//           toggle: {
//             rich_text: [
//               {
//                 text: {
//                   content: "1-1"
//                 }
//               }
//             ],
//             children: [
//               {
//                 type: "toggle",
//                 toggle: {
//                   rich_text: [
//                     {
//                       text: {
//                         content: "1-1-1"
//                       }
//                     }
//                   ]
//                   // children: [
//                   //   {
//                   //     type: "toggle",
//                   //     toggle: {
//                   //       rich_text: [
//                   //         {
//                   //           text: {
//                   //             content: "1-1-1-1"
//                   //           }
//                   //         }
//                   //       ]
//                   //     }
//                   //   }
//                   // ]
//                 }
//               }
//             ]
//           }
//         },
//         {
//           type: "bulleted_list_item",
//           bulleted_list_item: {
//             rich_text: [
//               {
//                 text: {
//                   content: "url",
//                   link: { url: "https://www.chegi.fun " }
//                 },
//                 annotations: {
//                   color: "blue"
//                 }
//               },
//               {
//                 text: { content: `  (2020/2/10)` },
//                 annotations: {
//                   color: "gray",
//                   italic: true
//                 }
//               }
//             ]
//           }
//         }
//       ]
//     }
//   }
// ]
