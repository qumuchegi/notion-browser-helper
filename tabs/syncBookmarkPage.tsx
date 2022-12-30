import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  SyncOutlined
} from "@ant-design/icons"
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Modal,
  Select,
  Space,
  Spin,
  Tooltip,
  Tree
} from "antd"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react"

import { sendToBackground } from "@plasmohq/messaging"

import useSearchNotionPage from "~Hooks/useSerachNotionPage"
import Logo from "~components/Logo"
import parseBookmarksTreeToCheckboxTree from "~utils/parseBookmarksData"

import "./styles/syncBookmark.scss"

import { setBookmarkNotionBlockIdByPageId } from "~background"
import { addBookmarkListenerOnAllEvent } from "~bookmarkEvent"
import {
  cacheBookmarkNotionBlockIdByPageId,
  cacheSyncBookmarkPageId,
  getAllSyncBookmarkToPageIds,
  getBookmarkBlockIdByPageId
} from "~storage"
import exportBookmarkToNotionPage from "~utils/notion/exportBookmarkToNotionPage"
import { queueExcuteSyncBookmarkPromises } from "~utils/promise"

export default function SyncBookmarkPage() {
  const [bookmarkTree, setbookmarkTree] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([])
  const [searchPageValue, setSearchPageValue] = useState("")

  const [selectedNotionPageId, setSelectedNotionPageId] = useState<string>()
  const [isSearchingPage, startSerachTransition] = useTransition()
  const [isCheckedToSync, setIsCheckedToSync] = useState(false)
  const [syncBookmarkToPageIds, setSyncBookmarkToPageIds] = useState<string[]>(
    []
  )
  const [isShowSyncBookmarkLoading, setIsShowSyncBookmarkLoading] =
    useState(false)
  const getBookmarkTree = useCallback(() => {
    chrome.bookmarks.getTree((bookmarks) => {
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
    addBookmarkListenerOnAllEvent("display latest bookmark", () => {
      getBookmarkTree()
    })
  }, [getBookmarkTree])
  useEffect(() => {
    const allSyncTargetPageIds = getAllSyncBookmarkToPageIds()
    setSyncBookmarkToPageIds(allSyncTargetPageIds)
  }, [])
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
  const selectedPageInfo = useMemo(() => {
    if (!selectedNotionPageId) {
      return null
    }
    return searchResult.filter((i) => i.pageId === selectedNotionPageId)[0]
  }, [selectedNotionPageId])
  const syncBookmark = useCallback(() => {
    Modal.confirm({
      title: "Are you sure to sync bookmark?",
      onOk: async () => {
        setSyncBookmarkToPageIds((pre) => [...pre, selectedNotionPageId])

        const exportBookmark = async () => {
          setIsShowSyncBookmarkLoading(true)
          let r = await exportBookmarkToNotionPage({
            notionPageId: selectedNotionPageId,
            setBookmarkNotionBlockIdByPageId: (
              pageId,
              bookmarkBlockIds,
              statusBlockId
            ) => {
              cacheBookmarkNotionBlockIdByPageId(
                pageId,
                bookmarkBlockIds,
                statusBlockId
              )
              sendToBackground({
                name: "add_sync_bookmark_target_page",
                body: {
                  pageId: selectedNotionPageId,
                  bookmarkBlockIds,
                  statusBlockId
                }
              })
            },
            getBookmarkNotionBlockIdByPageId: (pageId) => {
              return getBookmarkBlockIdByPageId(pageId)
            }
          })
          setIsShowSyncBookmarkLoading(false)
          return r
        }

        cacheSyncBookmarkPageId(selectedNotionPageId)
        queueExcuteSyncBookmarkPromises(() => exportBookmark())
      }
    })
  }, [selectedNotionPageId])
  const selectNotionPageLink = useMemo(() => {
    if (!selectedPageInfo) {
      return null
    }
    return (
      <a
        href={selectedPageInfo.pageUrl}
        target="_blank"
        className="selected-page-url">
        {selectedPageInfo.title}
        <span style={{ color: "#bbb", fontSize: "0.9em" }}>
          (press for navigation to notion page)
        </span>
      </a>
    )
  }, [selectedPageInfo])
  return (
    <div className="sync-bookmark-page">
      <div className="page-header">
        <Logo size={{ width: 70, height: 70 }} />
        <h1 className="title">sync bookmark</h1>
      </div>
      <div className="operation">
        <div className="operation-item" style={{ position: "relative" }}>
          {isShowSyncBookmarkLoading && (
            <div className="bookmark-exporte-loaing">
              <div className="loaing-title">
                <Spin />
                <p>
                  bookmarks are being exported to notion, you can check the
                  progress on notion page: {selectNotionPageLink}
                </p>
              </div>
            </div>
          )}

          <h2>
            sync bookmark to notion page
            <Tooltip
              placement="topLeft"
              title="automaticlly keep bookmark syncronized to notion page instead of
            manual export.">
              <ExclamationCircleOutlined style={{ marginLeft: "10px" }} />
            </Tooltip>
          </h2>
          <div>
            <span>search for notion page:{"  "}</span>
            <Select
              showSearch
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
            {selectedPageInfo &&
              !syncBookmarkToPageIds.includes(selectedNotionPageId) && (
                <div className="check-target-page">
                  <Checkbox
                    checked={isCheckedToSync}
                    onChange={(e) => setIsCheckedToSync(e.target.checked)}
                  />
                  <span>make sure it is your target page:</span>
                  {selectNotionPageLink}
                </div>
              )}
            <div>
              <Button
                onClick={syncBookmark}
                type="primary"
                style={{ marginLeft: "0px", marginTop: "20px" }}
                icon={<SyncOutlined />}
                disabled={
                  !selectedNotionPageId ||
                  !isCheckedToSync ||
                  syncBookmarkToPageIds.includes(selectedNotionPageId)
                }>
                sync bookmark to this page
              </Button>
              {syncBookmarkToPageIds.includes(selectedNotionPageId) && (
                <Alert
                  message={
                    <p>
                      You have set this page as the result page for bookmark
                      synchronization, now it will listen the change of bookmark
                      then automaticly sync to notion page:
                      {selectNotionPageLink}
                    </p>
                  }
                  type="success"
                  style={{ margin: "10px 0" }}
                  showIcon
                  closable
                />
              )}
            </div>
          </div>
          <Alert
            message="can't search your target page? maybe you have not authorize this
            notion page. Please login out and re login in and authorize the
            page."
            type="info"
            style={{ margin: "10px 0" }}
            showIcon
          />
        </div>
      </div>
      <div className="bookmark-preview">
        <h2 className="title">bookmark preview</h2>
        <div className="bookmark-tree">
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
    </div>
  )
}
