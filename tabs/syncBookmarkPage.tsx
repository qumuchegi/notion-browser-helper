import {
  DownloadOutlined,
  LinkOutlined,
  LoadingOutlined,
  SyncOutlined
} from "@ant-design/icons"
import { Button, Checkbox, Divider, Modal, Select, Space, Tree } from "antd"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react"

import useSearchNotionPage from "~Hooks/useSerachNotionPage"
import Logo from "~components/Logo"
import parseBookmarksTreeToCheckboxTree from "~utils/parseBookmarksData"

import "./styles/syncBookmark.scss"

import { addBookmarkChangeListener } from "~background"
import exportBookmarkToNotionPage from "~utils/notion/exportBookmarkToNotionPage"

export default function SyncBookmarkPage() {
  const [bookmarkTree, setbookmarkTree] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([])
  const [searchPageValue, setSearchPageValue] = useState("")

  const [selectedNotionPageId, setSelectedNotionPageId] = useState<string>()
  const [isSearchingPage, startSerachTransition] = useTransition()
  const [isCheckedToSync, setIsCheckedToSync] = useState(false)
  const getBookmarkTree = useCallback(() => {
    chrome.bookmarks.getTree((bookmarks) => {
      console.log({ bookmarks })
      setbookmarkTree(bookmarks)
    })
  }, [])
  const {
    isLoading: isSearching,
    result: searchResult,
    search: searchNotionPage,
    hasMore,
    loadMore
  } = useSearchNotionPage()
  useEffect(() => {
    getBookmarkTree()
  }, [getBookmarkTree])
  const bookmarkTreeToCheckboxTree = useMemo(() => {
    return bookmarkTree.map((node) => parseBookmarksTreeToCheckboxTree(node))
  }, [bookmarkTree])
  const onSearchPageChange = useCallback((value) => {
    setSearchPageValue(value)
    startSerachTransition(() => {
      searchNotionPage({
        notionPageValue: value
      })
    })
  }, [])
  const onSelectNotionPage = useCallback((pageId: string) => {
    setSelectedNotionPageId(pageId)
  }, [])

  console.log({ searchResult })
  const selectedPageInfo = useMemo(() => {
    if (!selectedNotionPageId) {
      return null
    }
    return searchResult.filter((i) => i.pageId === selectedNotionPageId)[0]
  }, [selectedNotionPageId])
  console.log({ selectedPageInfo })
  const syncBookmark = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to sync bookmark?",
      onOk: async () => {
        exportBookmarkToNotionPage({
          notionPageId: selectedNotionPageId
        })
        addBookmarkChangeListener([
          {
            type: "bookmarkChange",
            listener: (id, changeInfo) => {
              console.log({ id, changeInfo })
            }
          },
          {
            type: "bookmarkCreate",
            listener: (id, bookmark) => {
              console.log({ id, bookmark })
            }
          }
        ])
      }
    })
  }, [selectedNotionPageId])
  return (
    <div className="sync-bookmark-page">
      <div className="page-header">
        <Logo size={{ width: 70, height: 70 }} />
        <h1 className="title">sync bookmark</h1>
      </div>
      <div className="operation">
        <div className="operation-item">
          <h3>select a notion page</h3>
          <p>
            automaticlly keep bookmark syncronized to notion page instead of
            manual export.
          </p>
          <p className="search-tip-warn" style={{ fontWeight: "bolder" }}>
            note ⚠️ !!: make sure that selected page is your target page, the
            content of bookmark will override the original content of the
            selected page
          </p>
          <div>
            <Select
              showSearch
              placeholder="search for notion page"
              className="search-notion-page-input"
              allowClear
              value={searchPageValue}
              loading={isSearching}
              onSearch={() =>
                searchNotionPage({
                  notionPageValue: searchPageValue
                })
              }
              onSelect={onSelectNotionPage}
              onChange={onSearchPageChange}
              notFoundContent={null}
              defaultActiveFirstOption={false}
              showArrow={false}
              filterOption={false}
              style={{ width: 400 }}
              options={searchResult.map((r) => ({
                value: r.pageId,
                label: r.title
              }))}
              dropdownRender={(menu) => {
                if (hasMore) {
                  return (
                    <>
                      {menu}
                      <Divider style={{ margin: "0" }} />
                      <Space
                        style={{
                          padding: "5px",
                          display: "flex",
                          justifyContent: "center"
                        }}>
                        <Button
                          type="primary"
                          size="small"
                          onClick={loadMore}
                          icon={isSearching ? <LoadingOutlined /> : null}
                          className="load-more-search-result"
                          style={{
                            flex: 1,
                            textAlign: "center"
                          }}>
                          load more
                        </Button>
                      </Space>
                    </>
                  )
                }
                return menu
              }}
            />
            {isSearching && <LoadingOutlined style={{ marginLeft: "10px" }} />}
            {selectedPageInfo && (
              <div className="check-target-page">
                <Checkbox
                  checked={isCheckedToSync}
                  onChange={(e) => setIsCheckedToSync(e.target.checked)}
                />
                <span>make sure it is your target page:</span>
                <a
                  href={selectedPageInfo.pageUrl}
                  target="_blank"
                  className="selected-page-url">
                  {selectedPageInfo.title}
                  <span style={{ color: "#bbb", fontSize: "0.9em" }}>
                    (press for navigation to notion page)
                  </span>
                </a>
              </div>
            )}
            <div>
              <Button
                onClick={syncBookmark}
                type="primary"
                style={{ marginLeft: "0px", marginTop: "20px" }}
                icon={<SyncOutlined />}
                disabled={!selectedNotionPageId || !isCheckedToSync}>
                sync bookmark to this page
              </Button>
            </div>
          </div>
          <p className="search-tip-light-warn">
            can't search your target page? maybe you have not authorize this
            notion page. Please login out and re login in and authorize the
            page.
          </p>
        </div>
        <div className="operation-item">
          <Button type="primary" icon={<DownloadOutlined />}>
            export bookmark
          </Button>
        </div>
      </div>
      <h2>bookmark preview:</h2>
      <div className="bookmark-content">
        <div>
          <Tree
            treeData={bookmarkTreeToCheckboxTree}
            selectable={false}
            defaultExpandAll={true}
            defaultExpandParent
            titleRender={(node) => {
              const isDir = !!node.children
              if (isDir) {
                return (
                  <div className="bookmark-dir">
                    {node.title}
                    <span className="bookmark-add-time">
                      added at{" "}
                      {new Date(node.extra.addTime).toLocaleDateString()}
                    </span>
                  </div>
                )
              }
              return (
                <div className="bookmark-node">
                  <a
                    href={node.extra?.url}
                    className="bookmark-url-title"
                    target="_blank">
                    <LinkOutlined
                      style={{ fontSize: "1rem", marginRight: "10px" }}
                    />
                    {node.title}
                    {"  "}
                    <span className="bookmark-add-time">
                      added at {new Date(node.extra.addTime).toLocaleString()}
                    </span>
                  </a>
                </div>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}
