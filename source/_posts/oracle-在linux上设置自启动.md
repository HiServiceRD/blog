title: 'oracle 在linux上设置自启动'
date: 2014-06-01 15:28:35
categories:
- 服务器数据迁移
- oracle安装
tags:
- oracle
- shell
---


```shell
[root@197 init.d]# lsb_release -a
LSB Version:	:base-4.0-ia32:base-4.0-noarch:core-4.0-ia32:core-4.0-noarch:graphics-4.0-ia32:graphics-4.0-noarch:printing-4.0-ia32:printing-4.0-noarch
Distributor ID:	RedHatEnterpriseServer
Description:	Red Hat Enterprise Linux Server release 6.5 (Santiago)
Release:	6.5
Codename:	Santiago
```
####1 在root下修改/etc/oratab
找到最后一行：
``hiservicecrm:/u01/app/oracle/product/11.2.0/dbhome_1:N``
修改成如下：
``hiservicecrm:/u01/app/oracle/product/11.2.0/dbhome_1:Y``
将不允许自动启动改为允许自动启动。然后就可以通过oracle自身的启动和关闭脚本dbstart/dbstop来启动和关闭oracle
####2 在目录/etc/init.d/下创建启动脚本oracle内容如下
```shell
#!/bin/bash
# chkconfig: 2345 80 10
# description: Startup Script for oracle Databases 

ORACLE_HOME=/u01/app/oracle/product/11.2.0/dbhome_1
LOG=$ORACLE_HOME/oracle.log

case "$1" in
start)
echo "Starting Oracle Databases ... "
echo "-------------------------------------------------" >> $LOG 2>&1
date +" %T %a %D : Starting Oracle Databasee as part of system up." >> $LOG 2>&1
su - oracle -c "$ORACLE_HOME/bin/dbstart $ORACLE_HOME" >> $LOG 2>&1
echo "Done."
date +" %T %a %D : Finished." >> $LOG 2>&1
echo "-------------------------------------------------" >> $LOG 2>&1
touch /var/lock/subsys/oracle

;;
stop)
echo "Stopping Oracle Databases ... "
echo "-------------------------------------------------" >> $LOG 2>&1
date +" %T %a %D : Stopping Oracle Databases as part of system down." >> $LOG 2>&1
su - oracle -c "$ORACLE_HOME/bin/dbshut $ORACLE_HOME" >> $LOG 2>&1
echo "Done."
date +" %T %a %D : Finished." >> $LOG 2>&1
echo "-------------------------------------------------" >> $LOG 2>&1
rm -f /var/lock/subsys/oracle

;;
restart)
$0 stop
$0 start

;;
*)
echo "Usage: oracle {start|stop|restart}"
exit 1
esac
```
设置``touch /var/lock/subsys/oracle``和``rm -f /var/lock/subsys/oracle``的原因？
LINUX的判别一个服务是否被启动的依据是在/var/lock/subsys/目录下是否与服同名的文件，若有则表示这个服务已经被启动了，在系统关闭的时候，LINUX会把这里面列出的服务全部关闭，并删掉与服务同名的文件。若一个服务被启动了，但却在这个目录里没有那个服务的同名文件，则不会关闭那个服务。

####3 在root下修改/etc/oratab 将这个脚本注册成oracle服务。
```shell
chkconfig --add oracle
```
注意chkconfig 后面的启动和关闭的序号和opends和tomcat-org以及tomcat-zxmg有个顺序关系。最后重启电脑进行测试。

参考文章：
[ORACLE11g随RHEL5系统自动启动与关闭的设置方法](http://www.jb51.net/article/19823.htm)
[Linux下让Oracle服务自动启动与停止](http://blog.sina.com.cn/s/blog_3f2ef1180100budu.html)