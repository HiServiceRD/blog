海斯维思研发团队博客生成工具
====

###说明
本博客为海斯维思研发团队共同维护，使用NodeJS的Hexo进行搭建，版权及一切解释权归海斯维思研发团队所有

###安装教程
安装前请保证已正常安装NodeJS+NPM环境

使用命令`git clone git@github.com:HiServiceRD/blog.git`下载项目到本地文件夹

移动到项目文件夹下，运行命令`npm install`安装依赖的包（需要NPM）

安装完成后，运行命令`grunt init`初始化项目


###编写及修改文章
博客使用Markdown编写文章，具体编写方式请参见[Markdown语法说明](http://wowubuntu.com/markdown/)

编写后的markdown文章添加在`/source/_posts/`目录下

请按照[Hexo的文章编写规则](http://hexo.io/docs/writing.html)进行编写

###本地调试
使用命令`grunt server`启动服务器，然后使用`http://127.0.0.1:4000`查看效果

###发布

使用`grunt publish`进行发布，发布后访问`http://hiservicerd.github.io/`查看发布是否成功，如果成功，在项目目录下运行如下命令同步博客项目:
```
git add . -A
git commit -m "修改说明"
git push origin master
```

**请在本地测试成功后进行发布**

###其他
如有疑问，请联系天镶(lingyucoder@gmail.com)


