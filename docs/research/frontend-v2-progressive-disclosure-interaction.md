# 调研材料：可逆的展开/折叠与渐进式披露交互

> 调研目的：针对 `site/app.js` / `site/styles.css` 中「今日摘要」看板的不可逆展开问题，给出高置信度、可在纯静态原生 HTML/CSS/JS 中落地的改造建议。报告只讨论交互模式与实现方向，不直接改代码。
>
> 调研时间：2026-07-03
>
> 证据分级：高 = W3C / WCAG / WAI-ARIA / MDN / web.dev / Apple / Material / USWDS 等官方一手资料，或成熟高星开源实现的明确共识；中 = 官方资料未把项目级细节写死，但多源可推导的工程建议；低 = 单一来源或仅项目内推断。本报告尽量避免低置信度结论。

---

## 0. 仓库现状（已阅读）

- `site/app.js`
  - `overviewCategoryCard()` / `overviewBriefsCard()` 只先渲染前三条。
  - `overviewMoreButton()` 点击后执行 `onExpand()`，然后直接 `button.remove()`。
  - `evidencePanel()` 采用 `details > summary`，已经是原生 disclosure 模式。
- `site/styles.css`
  - `.overview-more` 当前是 `12px` 的下划线文字按钮，`padding: 2px 0`，点击热区很小。
  - `.overview-more:focus-visible` 只改颜色并 `outline: none`，焦点反馈偏弱。
  - `.evidence-trigger` 已有清晰的 `details[open]` 图标旋转和 focus ring，可作为站内正面对照。

### 现状问题归纳

1. `overviewMoreButton()` 是一次性动作，不是可逆状态组件。
2. 展开后触发器消失，用户没有收起路径，也缺少“当前处于已展开状态”的持续提示。
3. 目前实现是把剩余项直接 append 到已显示列表里；如果未来简单“保留按钮”，按钮还会被自己展开出的内容往下推，容易造成滚动迷失。
4. `.overview-more` 的热区明显不利于移动端点击。
5. 如果未来 extra items 内有链接或按钮，折叠时还需要明确的焦点回收策略。

---

## 1. 先给结论

1. 对 `overviewCategoryCard` / `overviewBriefsCard`，推荐使用 **自定义 button 驱动的 reversible disclosure**，不要机械改成 `<details>/<summary>`。原因是这里的触发器文案要带动态计数（“其余 N 条”），并且最合适的位置不是列表标题本身，而是“前三条之后、补充内容之前”的稳定锚点。
2. 对 `evidencePanel`，继续使用 **原生 `<details>/<summary>`** 是正确的：它表达的是“二级证据区块”，不是“同一列表的剩余项补充”。
3. Q1 的直接修复方案不是“展开后额外生成一个收起按钮”，而是把 DOM 改成：**前三条列表 -> 持久 toggle 按钮 -> 可折叠 extra panel**。这样展开时按钮不会被自己推走，收起路径也始终存在。
4. 对于 inline 的 show more / show less，要先澄清一个事实：**只要展开内容真实占据页面高度，后续内容必然下移，不存在严格意义上的视觉零位移**。当前更合理的目标不是“绝对不动”，而是“没有意外跳动、没有逐帧布局抖动、没有用户迷失”。
5. 对这个纯静态站，最稳妥的权衡是：**按钮图标做 `transform` 旋转，补充内容做轻量 `opacity` / 微位移入场，面板本身用一次性 `hidden` 切换，不做逐帧 `height` / `max-height` 动画**。

---

## 2. 标准模式：什么时候用哪种

### 2.1 Show more / show less toggle

适用场景：

- 同一张卡片/同一信息单元里，先展示摘要，用户可按需看“剩余内容”。
- 展开与收起是同一个对象的两个状态，而不是一组并列 section 的切换。
- 用户大概率想先看前三条，再决定是否继续看完整列表。

交互惯例：

- 同一个按钮负责“展开”和“收起”，状态可逆。
- 按钮应保留在 DOM 中，不应展开后消失。
- 按钮文本应提供足够的信息 scent，说明“会展开什么”；状态改变后按钮文本也应改变。
- 可以配合 chevron / caret 提示当前状态，但不要只靠颜色表达状态。

来源：

- WAI-ARIA APG Disclosure pattern（button + `aria-expanded` + toggle）  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- MDN `aria-expanded`（控制元素的可访问名称应反映状态变化）  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded
- USWDS Accordion guidance（使用有意义的展开按钮文案，避免 “Click here”）  
  https://designsystem.digital.gov/components/accordion/

置信度：高

### 2.2 Disclosure widget

适用场景：

- 隐藏的是一个“二级内容区块”，比如证据、FAQ 答案、注释、元数据。
- 触发器本身就是该区块的标题/摘要。
- 用户在当前语境中展开即可，不需要切换页面或打开模态层。

交互惯例：

- 触发器是 `button`（自定义）或 `summary`（原生 `details`）。
- 状态必须可逆；展开和收起都留在当前上下文中。
- 图标方向要和状态一致变化。

来源：

- WAI-ARIA APG Disclosure pattern  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- MDN `<details>` / `<summary>`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary

置信度：高

### 2.3 Accordion

适用场景：

- 有多个并列 section，每个 section 都有自己的 header 和 panel。
- 用户通常只需要其中少数 section，而不是一次看完全部。
- 主要价值是“减少纵向滚动”，不是“补完同一列表的剩余项”。

不适合当前 `overviewCategoryCard` 的原因：

- 每张摘要卡只有一个“剩余列表”，不是多个并列 section。
- 把每张卡整体做 accordion 会提高首屏摘要的阅读成本。
- USWDS 明确提醒：如果用户需要看“大多数或全部信息”，accordion 会增加认知负担和交互成本。

来源：

- WAI-ARIA APG Accordion pattern  
  https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- USWDS Accordion — When to use / When to consider something else  
  https://designsystem.digital.gov/components/accordion/

置信度：高

---

## 3. 无障碍：WAI-ARIA 与原生 / 自定义取舍

### 3.1 自定义按钮 disclosure 的最低要求

高置信度要求：

- 触发器用原生 `<button type="button">`。
- `aria-expanded="false|true"` 实时反映状态。
- `aria-controls` 指向被控制面板的唯一 `id`。
- 折叠时面板应用 `hidden` 或 `display: none`，让内部可聚焦元素退出可访问树和 Tab 顺序。
- 键盘至少支持 `Enter` 和 `Space` 触发切换。
- 展开/收起后按钮仍可聚焦、可再次操作。

来源：

- WAI-ARIA APG Disclosure pattern  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- MDN `aria-expanded`  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded
- Reach UI disclosure source（成熟实现）  
  https://github.com/reach/reach-ui/blob/dev/packages/disclosure/src/reach-disclosure.tsx
- Radix UI collapsible source（成熟实现）  
  https://github.com/radix-ui/primitives/blob/main/packages/react/collapsible/src/collapsible.tsx

置信度：高

### 3.2 原生 `<details>/<summary>` 的优点

- 自带 disclosure 语义与键盘交互。
- 自带 open / closed 状态，浏览器和辅助技术会理解。
- 可用 `toggle` 事件监听状态变化。
- 纯静态站最省 JS，渐进增强更稳。
- 很适合“证据与来源”这种二级区块。

来源：

- MDN `<details>`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
- MDN `<summary>`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary

置信度：高

### 3.3 原生 `<details>/<summary>` 的局限

- MDN 明确提示：`summary` 在不同浏览器 / 辅助技术上的角色暴露仍有差异；把 heading 直接塞进 `summary` 需要多端测试。
- `<details>` 没有内建的展开 / 折叠过渡动画。
- 当触发器最合适的位置不是“这一段内容的标题本身”，而是一个动态的计数按钮（如“展开其余 N 条”），自定义 button 往往更直观。
- 对原生 `details / summary`，通常不需要再额外手动维护一份 `aria-expanded`；原生 open / closed 状态已经存在。

来源：

- MDN `<summary>` warning  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary
- MDN `<details>`（no built-in way to animate）  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details

置信度：高（关于原生行为与限制）；中（关于“更适合 overview-more”的项目级选择）

### 3.4 对本项目的取舍建议

- `overviewMoreButton` / `overviewCategoryCard` / `overviewBriefsCard`：用 **自定义 `<button>` + `aria-expanded` + `aria-controls` + `hidden` panel**。
- `evidencePanel`：继续用 **`<details>/<summary>`**，因为它已经符合 disclosure 区块语义，而且当前 `summary` 内容很简单，没有 heading 嵌套问题。

置信度：高

---

## 4. 动画、布局稳定与性能取舍

### 4.1 先澄清一个常被混淆的点

如果“剩余条目”真的要以内联方式出现在卡片里，并占据真实页面高度，那么下面的内容必然下移。也就是说：

- **完全零位移** 只适用于 overlay / absolute-positioned / 预留固定空间的方案。
- **当前场景真正可追求的目标** 是：
  1. 位移由用户主动触发；
  2. 触发器位置稳定；
  3. 不做逐帧 reflow 的高度 tween；
  4. 不让用户在展开 / 收起后迷失。

web.dev 对 CLS 的关键结论是：

- 用户主动触发后 500ms 内发生的位移通常不计入“意外 CLS”，但这不等于视觉上一定舒服。
- 动态插入内容靠近视口顶部时，更容易让人感到跳动。
- 改变 `top` / `left` 等会触发布局；`transform` 类动画不会。

来源：

- web.dev Optimize CLS（2025 更新）  
  https://web.dev/articles/optimize-cls

置信度：高

### 4.2 为什么不推荐对 `overview` 做逐帧 `height` / `max-height` 动画

不推荐原因：

- `height` / `max-height` 会让浏览器在动画期间不断重排。
- `max-height` 需要猜一个上限；内容越不确定，时长与 easing 越不自然。
- 对首屏摘要卡而言，收益很小，复杂度和抖动风险更高。
- MDN 明确指出 `details` 也没有内建的展开动画，说明这本就不是原生优先路径。

来源：

- web.dev Optimize CLS（避免会触发布局的动画）  
  https://web.dev/articles/optimize-cls
- MDN `<details>`（no built-in way to animate）  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details

置信度：高

### 4.3 更稳妥的做法：只动画“感知层”，不动画“布局层”

推荐策略：

- 面板显示 / 隐藏本身用 `hidden` 切换，产生一次性、可预期的布局变化。
- 按钮前的 chevron / caret 用 `transform` 旋转。
- 面板内部内容可做 120–180ms 的 `opacity` 或极轻微 `translateY` 入场。
- 在 `prefers-reduced-motion: reduce` 下关闭这些非必要动画，保留瞬时状态切换。

这样做的好处：

- 布局只变一次，不会每一帧都 reflow。
- 视觉上仍有“展开了”的反馈。
- 纯原生 CSS / JS 足够实现。

来源：

- web.dev Optimize CLS（`transform` 不影响其他元素，不计入 CLS）  
  https://web.dev/articles/optimize-cls
- MDN `prefers-reduced-motion`  
  https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- MDN Using media queries for accessibility  
  https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility

置信度：高

### 4.4 如果团队坚持“高度动画”

可以做，但应视为次优方案：

- 用 JS 先测量展开高度，再把高度写到 CSS 自定义属性，再做短时 transition。
- 这是成熟库会采用的做法之一；例如 Radix Collapsible 会在布局阶段测量内容高度并设置 `--radix-collapsible-content-height`。
- 代价是实现复杂、仍属于 layout-bound 动画、对低端机不如纯 `transform / opacity` 稳。

来源：

- Radix UI collapsible source  
  https://github.com/radix-ui/primitives/blob/main/packages/react/collapsible/src/collapsible.tsx

置信度：中

---

## 5. 移动端：点击热区、反馈与样式落地

### 5.1 最低门槛与推荐门槛

- WCAG 2.2 AA 的最低门槛是 **24×24 CSS px**，或满足等效间距例外。
- Apple 官方建议触控目标至少 **44×44 pt**。
- Material 官方建议至少 **48×48 dp**，并保留约 **8dp** 间距。

对这个站点的“摘要卡展开按钮”，推荐直接按 **44×44px 以上** 做，而不是只满足 24×24 的法律底线。

来源：

- WCAG 2.2 SC 2.5.8 Understanding  
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Apple UI Design Dos and Don’ts  
  https://developer.apple.com/design/tips/
- Material Accessibility / Touch targets  
  https://m1.material.io/usability/accessibility.html

置信度：高

### 5.2 对当前 `.overview-more` 的映射

当前样式：

- `font-size: 12px`
- `padding: 2px 0`
- 仅下划线文字样式

这意味着：

- 触控热区大概率达不到 44×44。
- 在移动端很容易点偏。
- 作为“状态切换按钮”，它的视觉重量也偏弱。

具体方向：

- 不要只把文本做成细小下划线；应把**整个按钮盒子**做成可点击区域。
- 可以保持暖色羊皮纸基调，做成“低强调文本按钮 / 细边框 pill / 柔和底色条”，但热区要大。
- 按钮至少 `min-height: 44px`，推荐左右 padding 10–12px。
- Hover / active / focus-visible 要有清晰反馈；不要只靠颜色从 `--muted` 变成 `--accent-ink`。
- 保持墨绿主题：文字 / 图标可用 `var(--accent-ink)`，focus ring 沿用 `var(--accent)`，背景可用 `var(--accent-soft)` 的极轻版本或站内已有纸色 / 描边。

来源：

- Apple 44pt hit target  
  https://developer.apple.com/design/tips/
- Material 48dp + spacing  
  https://m1.material.io/usability/accessibility.html
- web.dev control focus warning（隐藏 outline 是常见问题）  
  https://web.dev/articles/control-focus-with-tabindex

置信度：高（热区与反馈）；中（具体视觉形式为项目级设计建议）

---

## 6. 焦点与滚动：如何避免用户“迷失”

### 6.1 展开时

推荐：

- **不要在展开后自动把焦点移入新内容。** 对于“查看更多条目”这类简单 disclosure，保持焦点在按钮上更稳定。
- **不要自动滚动。** 用户刚点了按钮，最重要的是让他保有当前位置判断。

原因：

- APG disclosure 只要求按钮可切换，不要求展开后转移焦点。
- web.dev 的 focus management 强调：焦点管理的目标是让“视觉上下文”和“感知上下文”同步；简单 disclosure 不应无故夺走焦点。

来源：

- WAI-ARIA APG Disclosure  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- web.dev Control focus with tabindex  
  https://web.dev/articles/control-focus-with-tabindex

置信度：高

### 6.2 收起时

必须处理两种情况：

1. **焦点仍在 toggle 按钮上**
   - 直接收起即可，不需要额外 focus 操作。

2. **焦点已进入 extra panel 内部（例如简讯链接）**
   - 收起前先把焦点移回 toggle 按钮，再隐藏 panel。
   - 否则会把当前聚焦元素直接从可见 DOM / 可访问树里拿掉，用户会“失去位置”。

来源：

- MDN `aria-hidden` / `hidden` 相关行为（被隐藏内容会退出可访问树与焦点流）  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden
- web.dev Focus management（必要时显式调用 `focus()` 以维持上下文）  
  https://web.dev/articles/control-focus-with-tabindex

置信度：高

### 6.3 滚动位置

对本项目最关键的不是“展开后滚到哪里”，而是**不要让按钮自己被展开内容推走**。

因此推荐的 DOM 顺序是：

1. 前三条可见列表
2. toggle 按钮
3. hidden extra panel

而不是：

1. 前三条列表
2. extra items
3. toggle 按钮

这样做的好处：

- 用户点击后，按钮仍留在原位附近，马上就能再次“收起”。
- 展开内容往按钮下方长，不会把刚点击的触发器顶出视口。
- 滚动迷失感显著降低。

如果收起后按钮不在视口内，再用最轻量的修正：

- `button.focus({ preventScroll: true })`
- 必要时 `button.scrollIntoView({ block: "nearest" })`

这比“展开后强制滚动到新内容”更符合摘要卡的轻交互模式。

来源：

- web.dev Focus management（用 `focus()` 保持上下文）  
  https://web.dev/articles/control-focus-with-tabindex
- web.dev dialog（关闭后把焦点还给触发器，是一致的可理解模式）  
  https://web.dev/learn/html/dialog

置信度：中高（属于基于官方 focus 原则的组件级落地建议）

---

## 7. 直接映射到你们组件

### 7.1 `overviewMoreButton`：现状问题 -> 原则 -> 改法方向

#### 现状问题

- 点击后 `onExpand()` 追加剩余项，然后 `button.remove()`。
- 这违反了 disclosure 的“可逆状态”。
- 用户没有明确的“当前已展开”提示，也没有收起路径。

对应代码点：

- `site/app.js` 的 `overviewMoreButton()`
- `site/app.js` 的 `overviewCategoryCard()` / `overviewBriefsCard()`

#### 适用原则

- disclosure / show more 是可展开也可收起的状态组件，不是一次性动作。
- 控制元素应保留，并通过 `aria-expanded` 暴露状态。
- 控制元素的名称应随状态变化而变化。
- 控制器应有足够大的 hit target，且状态反馈清楚。

来源：

- APG Disclosure  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- MDN `aria-expanded`  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded
- Apple / Material / WCAG target size guidance  
  https://developer.apple.com/design/tips/  
  https://m1.material.io/usability/accessibility.html  
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

置信度：高

#### 具体改法方向

推荐把它改成**有状态 toggle**，而不是“单次展开按钮”：

- 初始：`aria-expanded="false"`，文案 `展开其余 N 条`
- 展开：`aria-expanded="true"`，文案变为 `收起`
- 按钮永远保留，不执行 `remove()`
- 按钮控制一个单独的 extra panel，而不是直接往前面的可见 list 中无结构地 append

项目级推荐 DOM 结构（示意）：

```html
<div class="overview-category">
  <div class="overview-category-head">...</div>

  <ul class="overview-bullets">
    <!-- 固定显示前 3 条 -->
  </ul>

  <button
    type="button"
    class="overview-more"
    aria-expanded="false"
    aria-controls="overview-extra-<id>">
    <span class="overview-more__label">展开其余 4 条</span>
  </button>

  <div id="overview-extra-<id>" class="overview-extra" hidden>
    <ul class="overview-bullets overview-bullets--extra">
      <!-- 其余条目 -->
    </ul>
  </div>
</div>
```

为什么推荐“按钮在 extra panel 之前”：

- 按钮位置稳定；
- 点击后不需要“找收起”；
- 减少滚动迷失；
- 更接近用户对 show more / show less 的心智模型。

置信度：高

### 7.2 `overviewCategoryCard`

#### 现状问题

- 目前剩余条目是直接 append 到已显示列表末尾，没有“状态容器”。
- 这使得无障碍属性和动画策略都难以落位。

#### 适用原则

- 一个 toggle 应控制一个明确的“被控制区域”。
- `aria-controls` 指向的应该是稳定存在、可被隐藏 / 显示的面板容器，而不是“动态增加到现有 list 里的不定节点”。

来源：

- APG Disclosure  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- MDN `aria-expanded`  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded

置信度：高

#### 具体改法方向

- 前 3 条和其余条目分成两个层级：`always-visible list` + `extra panel`
- 保持卡片头部不交互；只让“展开其余 N 条”这一颗按钮承担 disclosure 语义
- 若 extra items 很多，可在 panel 尾部补一个“收起”次按钮，但这属于增强项，不是修 bug 的必需项

置信度：中高

### 7.3 `overviewBriefsCard`

#### 现状问题

- 简讯 extra items 里可能是外链 `<a>`；如果将来用户用键盘进入这些链接，再收起时必须回收焦点。

#### 适用原则

- 被折叠掉的内容不应继续可聚焦。
- 收起时若焦点在被隐藏内容中，必须把焦点移回控制按钮。

来源：

- MDN `hidden` / `aria-hidden`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden

置信度：高

#### 具体改法方向

- extra brief links 放进 `hidden` panel
- 收起逻辑先检查 `panel.contains(document.activeElement)`
- 若为真，先 `button.focus({ preventScroll: true })` 再隐藏 panel

置信度：高

### 7.4 `evidencePanel`

#### 现状问题

- 不算 bug；它反而是站内最接近标准 disclosure 的实现。
- 当前已经有 `details[open]` 的视觉反馈和 `summary` focus style。

#### 适用原则

- 原生 `details / summary` 适合二级证据区块。
- 不需要在 `summary` 上再手动维护一份 `aria-expanded`。
- 如需更复杂标题结构或高度动画，再考虑自定义 button；当前无需。

来源：

- MDN `<details>` / `<summary>`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary

置信度：高

#### 具体改法方向

- 保持 `evidencePanel` 的原生方向不变
- 如果未来要统一视觉语言，可把 `overview-more` 的 chevron / focus ring 风格向 `evidence-trigger` 靠拢
- 但不要为了统一而把 `overview-more` 也机械改成 `details / summary`

置信度：高

---

## 8. Q1「不可逆展开」的推荐修复方案

### 8.1 推荐方案（首选）

把现在的“单次 append + remove button”改为：

- **状态模型**：`collapsed | expanded`
- **结构模型**：`summary list (3 items) + persistent toggle + extra panel`
- **可访问性模型**：`button[aria-expanded][aria-controls]` + `panel[hidden]`
- **动效模型**：只做图标旋转与内容淡入；不做逐帧高度动画
- **滚动模型**：展开不自动滚；收起时仅在必要时把按钮滚回视口
- **移动端模型**：按钮 hit target >= 44×44px

为什么这是首选：

1. 直接修复“不可逆”。
2. 触发器始终可见，不再“找不到收起入口”。
3. 纯静态原生 HTML / CSS / JS 足够实现。
4. 与 `evidencePanel` 形成一致的 disclosure 心智，但保留各自最合适的技术实现。
5. 对性能更友好，比 `height / max-height` tween 更稳。

置信度：高

### 8.2 推荐文案

首选：

- 收起前：`展开其余 N 条`
- 展开后：`收起`

更强调信息 scent 的版本：

- 收起前：`展开其余 N 条摘要`
- 展开后：`收起补充摘要`

如果担心“收起”过短，可用：

- `收起，回到前 3 条`

不建议：

- `更多`
- `点击展开`
- `查看详情`

原因：

- 太泛，信息 scent 弱。
- 不说明展开的对象。
- 与当前列表语义不匹配。

来源：

- USWDS meaningful labels  
  https://designsystem.digital.gov/components/accordion/
- MDN `aria-expanded`（状态变化时控制元素名称也应随之表达清楚）  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded

置信度：高

### 8.3 一个容易忽视但很关键的实现细节

不要把 extra items 插在按钮前面再展开。

正确顺序应是：

```text
[前三条]
[展开/收起按钮]
[其余条目面板]
```

不是：

```text
[前三条]
[其余条目面板]
[展开/收起按钮]
```

前者可以显著减少“按钮被自己推走”的问题，是本项目里最值钱的交互细节之一。

置信度：中高

---

## 9. 反模式清单（建议作为开发验收 checklist）

- 一次性不可逆展开：点击后按钮消失，用户无法收起。
- 只有“更多”而没有“更少”。
- 只变颜色，不暴露展开状态。
- 用 `div` 假装按钮，却不补键盘与 ARIA。
- 折叠时内容 visually hidden 但仍可 Tab 到内部链接。
- 收起时把当前 focus 直接删掉，不还给 trigger。
- 触控目标过小，只有细小下划线文本可点。
- 只靠 hover 提示；移动端无明确 pressed / active 反馈。
- 为了“丝滑”去做长时 `height` / `max-height` 动画，导致移动端抖动。
- 展开后自动滚动到远处，打断用户当前位置。
- 没有 `prefers-reduced-motion` 兜底。
- 把用户大概率都要看的主体内容塞进 accordion / disclosure，增加交互成本。

---

## 10. 建议的最小验收标准

- 用户可重复执行“展开 -> 收起 -> 再展开”。
- 键盘 Tab 能到达 toggle；`Enter` 和 `Space` 都能切换。
- 屏幕阅读器可获知 expanded / collapsed 状态。
- 折叠后 extra panel 内部链接不再可 Tab 到。
- 按钮在手机上容易点中。
- `prefers-reduced-motion: reduce` 下无非必要动画。
- 展开 / 收起后用户不需要滚很远去找回按钮。
- 视觉风格仍保持暖纸色 + 墨绿，不降低现有对比度目标。

---

## 11. 参考来源（按权威性排序）

### A 级：标准 / 官方文档

- WAI-ARIA APG Disclosure Pattern  
  https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- WAI-ARIA APG Accordion Pattern  
  https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- WCAG 2.2 Understanding SC 2.5.8 Target Size (Minimum)  
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- MDN `<details>`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details
- MDN `<summary>`  
  https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary
- MDN `aria-expanded`  
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded
- MDN `prefers-reduced-motion`  
  https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- MDN Using media queries for accessibility  
  https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility
- web.dev Optimize CLS  
  https://web.dev/articles/optimize-cls
- web.dev Control focus with tabindex  
  https://web.dev/articles/control-focus-with-tabindex
- web.dev Dialog（用于“关闭后焦点回到 trigger”的通用 focus 模式参照）  
  https://web.dev/learn/html/dialog
- USWDS Accordion  
  https://designsystem.digital.gov/components/accordion/
- Apple UI Design Dos and Don’ts  
  https://developer.apple.com/design/tips/
- Material Accessibility / Touch targets  
  https://m1.material.io/usability/accessibility.html

### B 级：成熟开源实现

- Reach UI Disclosure source  
  https://github.com/reach/reach-ui/blob/dev/packages/disclosure/src/reach-disclosure.tsx
- Radix UI Collapsible source  
  https://github.com/radix-ui/primitives/blob/main/packages/react/collapsible/src/collapsible.tsx

---

## 最终判断（给架构师 / 实施者）

对 `overview` 摘要卡，最合适的不是“accordion 化”，也不是“沿用 `<details>` 机械套壳”，而是：

**保留自定义按钮，但把它升级为标准 disclosure toggle：按钮常驻、`aria-expanded` 可逆、控制独立 extra panel、按钮放在面板之前、展开只做轻量感知动画。**

这能在不引入框架、不依赖外部资源、且不破坏暖纸色 + 墨绿主题的前提下，最直接修复当前 Q1 的“不可逆展开”问题，并把无障碍、移动端可点性、滚动稳定性一起补齐。
