# Foundation Desktop 共用介面

`sunshine-frame.html` 是 Desktop 的代理驗證與連線入口。通過驗證後，主視窗開啟 Sunshine 提供的共用 Vue 前端，由主專案的 `SharedShell.vue` 組合此子模組的 `SidebarMenu.vue`；瀏覽器也使用相同頁面。沿用原 Control Panel 的設定面板與 1600×1000 視窗規格，不建立 iframe。

此目錄保留共用翻譯、淺色／深色主題、設定元件和主機 API 包裝。原全螢幕遊戲庫、手把導覽、遊戲啟動與遊玩統計已移除。`--desktop` 舊捷徑改開啟唯一主視窗，不再建立第二套介面。

串流的手把、鍵盤、滑鼠輸入屬於 Sunshine 核心，與已移除的本地遊戲庫導覽無關。
