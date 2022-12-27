import Logo from "~components/Logo"

import NotionLogin from "./components/NotionLogin"
import SyncBookmark from "./components/Operations/SyncBookmark"

import "./popupStyle.scss"

function IndexPopup() {
  return (
    <div className="popup-body">
      <h2 className="popup-title">Connect browser with Notion</h2>
      {/* <img src={icNotion} className="popup-logo" /> */}
      <Logo />
      <NotionLogin
        notLoginFallback={
          <div>
            <h4>What is it for?</h4>
            <ul>
              <li> sync browser bookmark to your Notion account</li>
              <li>collect your interested site url to you Notion page</li>
            </ul>
          </div>
        }
        loginedRender={
          <div className="operation-list">
            <SyncBookmark />
          </div>
        }
      />
    </div>
  )
}

export default IndexPopup
