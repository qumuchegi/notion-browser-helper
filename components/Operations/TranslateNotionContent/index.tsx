import "./style.scss"

import icTranslate from "data-base64:~/assets/translate.png"

export default function TranslateNotionContent() {
  return (
    <div className="translate-notion-entry">
      <a target="_blank" href="/tabs/translateNotionContent.html">
        <img src={icTranslate} className="translate-notion-icon" />
        translate notilon content &gt;{" "}
      </a>
    </div>
  )
}
