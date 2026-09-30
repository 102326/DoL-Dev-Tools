# DoL Dev Tools

DoL 电脑端开发工具：构建与测试入口、ADB WebView 检查和本地备份。适合开发者排查问题，不是游戏模组，也不提供游戏资源。

## 构建与桌面测试

构建脚本和完整桌面回归已经随 [DoL Game UI](https://github.com/102326/DoL-Game-UI) 公开，继续在该仓库维护，避免两份代码漂移。需要 Node.js 22.12+ 和 Python 3.10+。

```sh
git clone https://github.com/102326/DoL-Game-UI.git
cd DoL-Game-UI
npm ci
npm run test:quick
npm run package
npm run test:release -- --plan
```

完整游戏集成与性能测试需要自行取得游戏资源和 Microsoft Edge；`--plan` 只列计划和缺少的资源。详见该仓库的 [开发文档](https://github.com/102326/DoL-Game-UI/blob/main/docs/DEVELOPMENT.md)。本仓库不自动下载游戏或安装浏览器。

## ADB 检查

安装 Android SDK Platform Tools，使 `adb` 可用；开启设备 USB 调试。应用必须支持 WebView 调试。以下命令中的 `DEVICE_SERIAL` 和 `SOCKET_NAME` 必须替换为实际值。

```sh
adb devices
adb -s DEVICE_SERIAL shell cat /proc/net/unix
adb -s DEVICE_SERIAL forward tcp:50806 localabstract:SOCKET_NAME
node scripts/adb-evaluate.cjs probes/status.js
node scripts/adb-evaluate.cjs probes/wardrobe.js artifacts/wardrobe.json
```

从 `/proc/net/unix` 查找对应应用的 `webview_devtools_remote` socket，去掉开头的 `@`；不要使用另一应用的 socket。应用重启后需重新核对。先创建 `artifacts` 目录；输出文件已存在时不会覆盖。

端口可通过环境变量 `DOL_CDP_URL` 调整。PowerShell 示例：

```powershell
$env:DOL_CDP_URL = 'http://127.0.0.1:50806'
node scripts/adb-evaluate.cjs probes/shop.js
```

附带探针只读取版本、页面和布局统计，不购买、换装、加载存档或推进剧情。执行器本身会执行你指定的任意 JavaScript，因此只运行检查过的脚本。接口不存在时返回空值，不代表该版本已验证兼容。

## 私有应用数据备份

先在游戏里保存并退出应用，避免文件在读取期间发生变化；本工具不停止应用，不操作存档槽，不恢复数据。

```sh
python scripts/adb-backup-app-data.py --serial DEVICE_SERIAL --label before-test
```

ADB 不在 PATH 时使用 `--adb` 指定路径；其他包名使用 `--package`。需要应用允许 `run-as`，不支持时明确失败，不尝试 root 或绕过限制。输出默认在已忽略的 `backups/` 中，包含真实私有数据，不要上传。TAR 可读性及 SHA256 检查不等于恢复验收。

## 验证与范围

```sh
npm test
python -m unittest discover -s tests -p "test_*.py"
```

离线测试验证执行器成功/报错/超时、目标选择与输出保护，以及模拟 ADB 备份成功/失败和参数校验，不连接真实设备。既有内部脚本曾用于 DoL 0.5.11.9 / Lyra；本仓库整理后的版本仍需在你的设备核验。

首批仅收录通用执行器、只读探针和备份。针对旧版本的模组安装、热补丁和临时实验脚本未收录。游戏内 DoLWorkbench 与 Mod Center 不属于此仓库。

MIT 许可只适用于本仓库工具源码，不涵盖游戏、加载器或其他模组。不要提交真实存档、日志、截图、凭据、第三方资源或 APK。
