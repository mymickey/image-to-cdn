#分析css内 图片上传图片到CDN 并用线上地址替换本地路径
---
无需.att文件,

--
安装
----
首先确保安装了[`att`](https://github.com/colorhook/att)，然后执行以下命令

```shell
att install image-to-cdn
```
```shell
#直接上传到  正式 预发 测试 三个环境
att igo style.css
```

```css
a{background-image:url(image/a.png)}
```
igo after
```css
a{background-image:url(alicdn.com/x/a-size.png)}
```