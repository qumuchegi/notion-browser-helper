export type CheckboxTreeNode = {
  key: string
  title: string
  children?: CheckboxTreeNode[]
  extra: {
    url?: string
    addTime: number
    lastModified?: number
  }
}
export default function parseBookmarksTreeToCheckboxTree(
  bookmarkTreeNode: chrome.bookmarks.BookmarkTreeNode
): CheckboxTreeNode {
  if (bookmarkTreeNode.children && bookmarkTreeNode.children.length > 0) {
    return {
      key: bookmarkTreeNode.id,
      title: bookmarkTreeNode.title || "无标题",
      children: bookmarkTreeNode.children.map((node) =>
        parseBookmarksTreeToCheckboxTree(node)
      ),
      extra: {
        addTime: bookmarkTreeNode.dateAdded,
        lastModified: bookmarkTreeNode.dateGroupModified
      }
    }
  } else {
    return {
      key: bookmarkTreeNode.id,
      title: bookmarkTreeNode.title,
      extra: {
        url: bookmarkTreeNode.url,
        addTime: bookmarkTreeNode.dateAdded
      }
    }
  }
}
