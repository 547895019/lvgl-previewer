# LVGL Previewer 开发记录

## 项目架构

这是一个本地 LVGL XML 预览工具，支持多项目管理、实时预览、XML 编辑和编译功能。

### 核心文件
- `index.html` - 项目管理器 UI
- `viewer.html` - 预览和编辑器界面
- `server.js` - Node.js HTTP 服务器

### 加载序列
1. 写入二进制资源到 Emscripten 虚拟文件系统 `/fonts/` 和 `/images/`
2. 调用 `lvrt_initialize('#canvas')` 初始化 LVGL
3. 调用项目初始化函数 `{projectName}_init('A:')` 注册字体、图片等资源
4. 通过 WASM trick 加载 globals（注入 `<view/>` 到 `<globals>` 根）
5. 注册所有 components：`lvrt_xml_load_component_data(name, xml)`
6. 渲染 screen：`lvrt_process_data(xml, name, 0, 'screen', language)`（第 5 参数必须传语言，否则内部会调用 `lv_translation_set_language('')` 清空语言）

**注意**：LVGL VFS 驱动器是 `A:`，不是 `/`。Emscripten 会将 `A:` 映射到 `/`。

---

## 问题解决记录

### 1. 多屏幕导航问题

**现象**：在 `4_screens` 项目中，从 `screen_main` 点击按钮切换到 `screen_about` 时，`screen_load_event` 找不到 `screen_main`。

**原因**：只注册了当前 screen，没有注册所有 screens。非 permanent screen 加载时需要找到 permanent screen。

**解决**：加载 screen 时先注册所有 screens，再创建 permanent screens：
```javascript
// 1. 注册所有 screens
for (const screenName of screens) {
  Module.ccall('lvrt_xml_load_component_data', 'number',
    ['string', 'string'], [screenName, screenXml]);
}

// 2. 创建 permanent screens
for (const screenName of screens) {
  if (screenXml.includes('permanent="true"')) {
    Module.ccall('lvrt_component_create', 'number',
      ['string', 'string'], [screenName, '']);
  }
}

// 3. 加载目标 screen
Module.ccall('lvrt_process_data', 'number', ...);
```

### 2. `ui_screens_init: not found` 错误

**现象**：项目初始化函数找不到。

**原因1**：`preview-bin/lved-runtime.js` 加载时不带 `?project=` 参数，服务器无法识别应该用哪个项目的 runtime，导致使用了错误的 fallback。

**解决**：修改 `locateFile` 和动态脚本加载，传递 project 参数：
```javascript
locateFile: f => 'preview-bin/' + f + '?project=' + encodeURIComponent(PROJECT_PATH)
```

**原因2**：Emscripten 的 `ccall` 内部会自动给函数名加下划线前缀 `Module["_" + ident]`。

**解决**：调用时不需要加下划线：
```javascript
// 正确
Module.ccall('ui_screens_init', 'void', ['string'], ['A:'])
// 错误（会变成查找 Module['_ui_screens_init'] 导致失败）
Module.ccall('_ui_screens_init', ...)
```

### 3. 内联事件处理程序错误

**现象**：`saveCurrentFile is not defined`、`loadScreen is not defined`、`clearLog is not defined`

**原因**：HTML 中的 `onclick`、`onchange` 属性在函数定义之前执行，导致函数未定义。

**解决**：使用事件监听器方式绑定：
```javascript
// 移除 HTML 中的 onclick
<button id="save-btn">Save</button>

// 在 script 中绑定
document.getElementById('save-btn').addEventListener('click', saveCurrentFile);
```

### 4. 配置文件预览问题

**现象**：点击 `globals.xml` 和 `project.xml` 时预览区尝试渲染，导致错误。

**解决**：在 `previewXmlFile` 函数开头跳过这些文件：
```javascript
if (filePath === 'globals.xml' || filePath === 'project.xml') {
  return;
}
```

### 5. Console 窗口大小调整

**实现**：添加一个 6px 高的 resizer 元素，监听 mouse 事件调整高度。

---

## WASM Runtime 导出函数

从 `lved-runtime.js` 查看可用导出：
```javascript
// 核心函数
_lvrt_initialize
_lvrt_process_data
_lvrt_xml_load_component_data
_lvrt_component_create
_lvrt_refresh

// 项目特定函数（因项目而异）
_ui_screens_init      // 4_screens 项目
_ui_animations_init   // 8_animations 项目
```

**查找方法**：
```bash
grep 'wasmExports\[".*_init"\]' preview-bin/lved-runtime.js
```

---

## 调试技巧

1. **查看 Module 导出**：`Object.keys(Module).filter(k => k.includes('init'))`
2. **检查函数是否存在**：`typeof Module['_function_name'] === 'function'`
3. **浏览器缓存**：WASM 文件更新后需要强制刷新 `Ctrl+Shift+R`

---

## 参考

- 在线预览器：https://viewer.lvgl.io/
- LVGL 文档：https://docs.lvgl.io/

---

## 额外修复记录

### WASM Runtime 缓存问题

**现象**：切换不同项目时，加载的是错误的 runtime（如 `examples` 的 `_examples_init` 而不是目标项目的 `_ui_translations_init`）

**原因**：浏览器缓存了 `preview-bin/lved-runtime.js` 和 `.wasm` 文件

**解决**：
1. 在 `locateFile` 返回的 URL 中添加时间戳参数 `&t=${Date.now()}`
2. 服务器端为 preview-bin 文件添加 `Cache-Control: no-cache` 响应头

**代码变更**：
- `viewer.html`: `locateFile: f => 'preview-bin/' + f + '?project=' + encodeURIComponent(PROJECT_PATH) + '&t=' + Date.now()`
- `server.js`: 新增 `serveFileWithNoCache()` 函数用于 preview-bin 文件

### translations.xml 支持与语言设置

**现象**：加载带翻译的项目时出现警告 `lv_translation_get: `` language is not found, using the 'dog' as translation.`

**根本原因**：`lvrt_process_data` 的函数签名是：
```c
int lvrt_process_data(const char *xml_definition, const char *name,
                      const char *display_style[], const char *xml_type,
                      const char *language);
```
第 5 个参数 `language` 在内部直接调用 `lv_translation_set_language(language)`。我们一直传的是空字符串 `''`，导致每次渲染前语言都被重置为空。

**解决**：
1. 在文件树 Configuration 部分添加 `translations.xml` 条目
2. 在 `initWASM()` 中加载 `translations.xml`，调用 `lvrt_xml_load_translations_data` 和 `lvrt_xml_load_translations`（文件路径版）
3. 从 `translations.xml` 的 `languages="en de"` 属性解析可用语言，在工具栏添加语言选择下拉框
4. **关键修复**：调用 `lvrt_process_data` 时将所选语言作为第 5 个参数传入：
```javascript
const lang = document.getElementById('lang-select').value || '';
Module.ccall('lvrt_process_data', 'number',
  ['string', 'string', 'number', 'string', 'string'],
  [xmlToRender, name, 0, 'screen', lang]);  // ← 第5个参数传语言
```

**注意**：**不能**单独调用 `lvrt_translation_set_language`，它在 `runtime.c` 中的实现是：
```c
void lvrt_translation_set_language(const char *language) {
  lv_translation_set_language(language);
  lv_obj_clean(screen);
  lv_xml_create(screen, "thisview", NULL);  // 用于运行时动态切换语言
}
```
在初始化阶段（screen 未加载时）调用它会触发 `lv_xml_create("thisview")` 但 "thisview" 尚未注册，导致警告 `lv_xml_create: 'thisview' is not a known widget`。语言通过 `lvrt_process_data` 第 5 参数传入即可。

**注意**：`lvrt_xml_load_translations_data` 和 `lvrt_xml_load_translations` 返回 `0` 表示 `LV_RESULT_INVALID`（失败），返回 `1` 表示 `LV_RESULT_OK`（成功）。

**注意**：`extract_view_content()` 在 `lv_xml_component.c` 中通过查找 `<view` 字符串提取组件视图内容。**不能**把 XML 中的 `<view>` 替换为 `<lv_obj>`，否则会导致 `Failed to extract view content` 错误，渲染完全失败。

**加载序列更新**（第 6 步）：
```
6. 渲染 screen：lvrt_process_data(xml, name, 0, 'screen', language)
                                                              ↑ 必须传语言
```

### Animations 面板与组件预览

**功能**：在底部面板添加 Console / Animations 标签页，从当前预览文件的 XML 中解析 `<animations>` 下的 `<timeline>` 元素，显示 Play 按钮。

**解析方式**（与在线预览器一致）：
```javascript
const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');
for (const el of doc.querySelectorAll('animations > *')) {
  const name = el.getAttribute('name');
  // ...
}
```

**播放方式**（与在线预览器一致）：
```javascript
Module.ccall('lvrt_play_timeline', 'boolean', ['string'], [timelineName]);
Module.ccall('lvrt_refresh', 'void', [], []);
```

**`lvrt_play_timeline` 内部机制**（`runtime.c:621`）：
```c
bool lvrt_play_timeline(const char * timeline_name) {
    lv_obj_t * target = lv_obj_find_by_name(lv_screen_active(), "thisview_0");
    if(target == NULL) target = lv_screen_active();
    
    lv_anim_timeline_t ** timeline_array = NULL;
    lv_obj_send_event(target, lv_event_xml_store_timeline, &timeline_array);
    // 在 thisview_0 上查找 timeline...
}
```
关键：`lvrt_play_timeline` 在 `thisview_0` 对象上查找 timelines。

**组件预览的关键问题**：

**现象**：组件内定义的 timeline（如 `show_up`、`list_open`）点击 Play 报错 `No timelines are found`。

**原因**：之前组件预览使用 `<view>` 包装器：
```javascript
// 错误做法 — thisview_0 是 <view> 包装器，没有 animations
const previewXml = `<view>\n  <${compName} />\n</view>`;
Module.ccall('lvrt_process_data', ..., [previewXml, 'preview', 0, 'screen', lang]);
```
`lvrt_process_data` 将 `previewXml` 注册为 "thisview"，所以 `thisview_0` 是 `<view>` 包装器，它没有 `<animations>` 定义。实际组件的 animations 在包装器的子对象上，`lvrt_play_timeline` 找不到。

**解决**：将组件 XML 直接传给 `lvrt_process_data`，让 "thisview" 就是组件本身：
```javascript
// 正确做法 — thisview_0 就是组件，带有 animations
Module.ccall('lvrt_xml_load_component_data', 'number',
  ['string', 'string'], [compName, xmlToRender]);
Module.ccall('lvrt_process_data', 'number',
  ['string', 'string', 'number', 'string', 'string'],
  [xmlToRender, compName, 0, 'component', lang]);
```
这样 `thisview_0` 就是组件实例，`lvrt_play_timeline` 可以在其上找��� timeline。

**注意**：Animations 面板只显示当前预览文件的 timelines（与在线预览器行为一致），按字母排序。

