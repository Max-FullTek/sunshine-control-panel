# Foundation Desktop (Tauri)

以原 Sunshine Control Panel 為基礎的單一 Windows 桌面設定程式，使用 Tauri 2 + Vue 3。主視窗維持 1600×1000，透過 Rust API 與本機代理連接 Sunshine 核心；部分設定頁仍沿用嵌入式 Web UI。

## 保留功能

- 串流設定、應用程式設定與用戶端配對。
- 虛擬顯示器、虛擬滑鼠與控制器設定。
- 托盤代理、剪貼簿同步、日誌與必要診斷。
- 開機啟動、通知、繁體中文／簡體中文／英文，以及純色淺色／深色主題。

原全螢幕遊戲型 Desktop 已移除，包括遊戲庫、主機本地啟動遊戲、遊玩時間統計、介面手把導覽與螢幕鍵盤。這不影響 Sunshine 核心的串流手把與鍵鼠輸入。舊 `--desktop` 捷徑統一開啟主設定視窗。

主入口為 `src/renderer/sunshine-frame.html`；共用介面說明見 [desktop/README.md](src/renderer/desktop/README.md)。

## 前置要求

- Node.js 和 npm
- Rust 和 Cargo (用于 Tauri)
- Windows SDK (Windows)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（代理到 Sunshine 服务）
npm run dev

# 仅启动前端开发服务器
npm run dev:renderer
```

### WebUI 联调开发模式

当需要同时开发 WebUI 和 Tauri GUI 时，可以使用 `dev-webui` 模式让 Tauri 代理服务器转发请求到 WebUI 开发服务器：

```bash
# 终端 1：在项目根目录启动 WebUI 开发服务器（端口 3000）
cd ../../../..  # 回到 Sunshine 根目录
npm run dev-server

# 终端 2：在 sunshine-control-panel 目录启动 Tauri（代理到 WebUI 开发服务器）
npm run dev-webui
```

这种模式下：
- WebUI 开发服务器运行在 `https://localhost:3000`
- Tauri 代理服务器会将请求转发到 WebUI 开发服务器
- 支持 HMR（热模块替换），修改 WebUI 代码会实时生效
- API 请求仍会被 WebUI 开发服务器代理到 Sunshine 服务（`https://localhost:47990`）

## 构建

```bash
# 构建渲染进程
npm run build:renderer

# 构建完整应用
npm run build

# Windows 构建
npm run build:win
```

## 项目结构

```
src-tauri/           # Tauri 后端 (Rust)
  ├── src/
  │   ├── main.rs            # 主入口、命令注册
  │   ├── proxy_server.rs    # Axum 本地代理 (Sunshine/Steam API/CORS)
  │   ├── sunshine.rs        # Sunshine 进程管理、路径工具
  │   ├── system.rs          # 系统信息 (WMI 进程查询、内存统计)
  │   ├── fs_utils.rs        # 文件系统、游戏扫描、Steam 封面搜索/上传
  │   ├── commands.rs        # HTTP 客户端、应用启动
  │   ├── vdd.rs             # VDD 驱动管理
  │   └── windows.rs         # Windows 注册表/autostart
  ├── inject-script.js       # 注入到 Sunshine Web UI 的脚本
  └── Cargo.toml

src/renderer/        # 前端 (Vue 3)
  ├── desktop/              # Desktop UI (独立 SPA)
  │   ├── views/            # 页面视图 (Dashboard、Apps、Settings...)
  │   ├── components/       # 组件 (AppGrid、ContextMenu、CoverPicker...)
  │   ├── composables/      # 组合式函数 (useApps、useTauri...)
  │   └── i18n/             # 国际化 (zh、en)
  ├── components/           # 共享组件
  └── styles/               # Less 样式

vite.config.js       # Vite 构建配置
package.json         # NPM 依赖
```

## 技术栈

- **前端**: Vue 3 + Less + 自定义组件
- **后端**: Rust + Tauri 2
- **HTTP**: Axum (代理)、reqwest (HTTP 客户端)
- **系统**: WMI (进程查询)、Win32 API (内存统计)、Windows Registry
- **构建**: Vite

## 集成到 Sunshine

编译后的 GUI 会自动安装到 Sunshine 的 `assets/gui` 目录：

```
Sunshine/
  └── assets/
      └── gui/
          └── sunshine-gui.exe
```

## 注意事项

- Tauri GUI 是可选组件，不影响 Sunshine 核心功能
- 需要 Rust 工具链才能构建 Tauri 应用
- 首次构建会下载并编译 Rust 依赖，需要较长时间
