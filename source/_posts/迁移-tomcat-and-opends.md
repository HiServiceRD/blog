title: '迁移 tomcat and OpenDS'
date: 2014-06-01 15:42:11
categories:
- 服务器数据迁移
tags:
- tomcat
- opends
- jailkit
- iptables
---

#### Part1: 设置jail
Jail作用更改某个进程所能看到的根目录，即将某进程限制在指定目录中，保证该进程只能对该目录及其子目录的文件有所动作，从而保证整个服务器的安全。
将tomcat和OpenDS 以一个权限很低的用户运行,限制在指定的一个目录下。
下面使用Jailkit来实现参考：[JailKit](http://olivier.sessink.nl/jailkit/)

下载并安装JailKit
```shell
tar -zxvf jailkit-2.17\ \(1\).tar.gz
cd jailkit-2.17
./configure
make;make install
```

设置jail
```shell
1. useradd mais           
2. passwd mais
3. mkdir /home/jail
4. chown root:root /home/jail
5. jk_init -v -j /home/jail basicshell editors extendedshell netutils ssh sftp scp
6. mkdir /home/jail/usr/sbin
7. cp /usr/sbin/jk_lsh /home/jail/usr/sbin/jk_lsh
8. mkdir /home/jail/tmp
9. chmod a+rwx /home/jail/tmp
10. cd /home/jail/
11. mkdir proc
12. mount -t proc proc /home/jail/proc
注意12条会在开机后失效如果想使得在开机后生效则需要按一定规则写入文件/etc/fstab中添加
如下:
proc                    /home/jail/proc         proc    defaults        0 0


13. /dev/MAKEDEV -d /home/jail/dev null random urandom zero loop log console
14. jk_jailuser -m -j /home/jail mais
15. vi /etc/passwd
    mais:x:1016:1016::/home/jail/./home/mais:/usr/sbin/jk_chrootsh
修改jail中的passwd文件中mais的登录shell为/bin/bash 不然不能以mais用户登录
16. vi /home/jail/etc/passwd
    mais:x:1016:1016::/home/mais:/bin/bash
17. cat /home/jail/etc/group
    mais:x:1016


jk_cp will copy any file into a jail on the identical location, with identical permissions and (if required) including any required libraries. It will remove any set user id (setuid) or set group id (setgid) permissions from all files and directories copied.

jk_cp 将会将执行该命令所需的所有文件拷贝到jail中。并去掉setuid 和 setgid 的标识，这样用户执行时就不能获取其他用户或者用户组的权限了。

jk_cp -j /home/jail /usr/bin/id
jk_cp -j /home/jail /usr/java/jdk1.6.0_26 (拷贝自己设定的jdk目录)
jk_cp -j /home/jail /bin/uname
jk_cp -j /home/jail /usr/bin/dirname
jk_cp -j /home/jail /usr/bin/tty
jk_cp -j /home/jail /usr/bin/nohup
jk_cp -j /home/jail /etc/localtime
jk_cp -j /home/jail /usr/bin/expr
jk_cp -j /home/jail /etc/sysconfig/clock
```
``jk_cp 的命令参数含义参考前面给的jailkit链接或者直接man jk_cp``

> 手动将tomcat-org tomcat-zxmg OpenDS 从/root(之前你自己存放的目录) cp到/home/jail/home/mais下面
修改用户和属组都为mais ``chown -R mais:mais /home/jail/home/mais`` 接下来尝试启动OpenDS 和 tomcat-org、tomcat-zxmg检查是否不能够正常启动并以mais的用户身份启动。因为可能是环境变量的问题找不到jdk所在的目录。导致不能启动
查看/etc/profile 是否包含jdk环境变量。当然这里的/etc/profile指的是/home/jail下的。如果含有可以通过``source /etc/profile``使环境变量立即生效。然后启动OpenDS和tomcat并可以将环境变量设置在``/home/mais/.bash_profile``这个文件中。使得下次以这个用户启动时可以读到jdk的环境变量。


Part2: 设置tomcat,OpenDS以服务的方式启动

先关闭防火墙不然会阻止tomcat的端口和OpenDS的端口的。其次注意OpenDS的监听端口不能为389在以非根用户启动的情况下,可以设置成4389。
在/home/jail/homa/mais/目录下创建以下脚本：``start-zxmg.sh/stop-zxmg.sh``,``start-org.sh/stop-org.sh``,``start-opends.sh/stop-opends.sh``,``start-ALL.sh/stop-ALL.sh`` 具体每个脚本内容如下:


*  start-zxmg.sh

```shell
#!/bin/bash
#注意这里的jdk目录对应自己安装的jdk目录
export JAVA_HOME=/opt/jdk1.6.0_43/
export TOMCAT_ZXMG_HOME=/home/mais/tomcat-zxmg
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export TZ="Asia/Shanghai"
export LANG="en_US.UTF-8"

$TOMCAT_ZXMG_HOME/bin/startup.sh
```

* stop-zxmg.sh

```shell
#!/bin/bash

export JAVA_HOME=/opt/jdk1.6.0_43/
export TOMCAT_ZXMG_HOME=/home/mais/tomcat-zxmg
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

$TOMCAT_ZXMG_HOME/bin/shutdown.sh
```
start-org.sh stop-org.sh 大同小异

*  start-opends.sh


```shell
#!/bin/bash

export JAVA_HOME=/opt/jdk1.6.0_43/
export LDAP_HOME=/home/mais/OpenDS
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export TZ="Asia/Shanghai"
export LANG="en_US.UTF-8"

$LDAP_HOME/bin/start-ds
```


* stop-opends.sh

```shell
#!/bin/bash

export JAVA_HOME=/opt/jdk1.6.0_43/
export LDAP_HOME=/home/mais/OpenDS
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

$LDAP_HOME/bin/stop-ds
```

* start-ALL.sh

```shell
#!/bin/bash


export JAVA_HOME=/opt/jdk1.6.0_43/
export LDAP_HOME=/home/mais/OpenDS
export TOMCAT_ORG_HOME=/home/mais/tomcat-org
export TOMCAT_ZXMG_HOME=/home/mais/tomcat-zxmg
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export TZ="Asia/Shanghai"
export LANG="en_US.UTF-8"

$LDAP_HOME/bin/start-ds
$TOMCAT_ORG_HOME/bin/startup.sh
$TOMCAT_ZXMG_HOME/bin/startup.sh
```

* stop-ALL.sh

```shell
#!/bin/bash

export JAVA_HOME=/opt/jdk1.6.0_43/
export LDAP_HOME=/home/mais/OpenDS
export TOMCAT_ORG_HOME=/home/mais/tomcat-org
export TOMCAT_ZXMG_HOME=/home/mais/tomcat-zxmg
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

$LDAP_HOME/bin/stop-ds
$TOMCAT_ORG_HOME/bin/shutdown.sh
$TOMCAT_ZXMG_HOME/bin/shutdown.sh
```

然后去目录/etc/init.d/下设置服务启动脚本
分别创建``tomcat-org`` ``tomcat-zxmg`` ``opends``三个服务启动脚本内容如下：

* tomcat-org

```shell
#!/bin/sh
# chkconfig: 345 90 11
# description: crm start/stop/restart script

# host 231
CRM_OWNR="mais"

case "$1" in
	start)

	echo "Starting Tomcat ORG ... "
	su - mais -c /home/mais/start-org.sh
	echo "Start Tomcat ORG OK"
	;;
	stop)
	echo "Stoping Tomcat ORG ... "
	su - mais -c /home/mais/stop-org.sh
	sleep 5
	ps aux|grep tomcat-org|grep startup|awk '{print $2}'|xargs kill -9
	echo "Stop Tomcat ORG OK"
	;;
	restart)
	$0 stop
	$0 start
	;;
	*)
	echo "Usage: $0 {start|stop|restart}"
exit 1
esac
```

``# chkconfig: 345 90 11``解释下这行的含义：表示在启动级别3 4 5 这三个级别该服务自启动。启动序号为90 关闭序号为11 即在所有服务中启动顺序排90位进行启动。关闭顺序排在11位

* tomcat-zxmg

```shell
#!/bin/sh
# chkconfig: 345 90 11
# description: crm start/stop/restart script

# host 231
CRM_OWNR="mais"

case "$1" in
	start)

	echo "Starting Tomcat ZXMG ... "
	su - mais -c /home/mais/start-zxmg.sh
	echo "Start Tomcat ZXMG OK"
	;;
	stop)
	echo "Stoping Tomcat ZXMG ... "
	su - mais -c /home/mais/stop-zxmg.sh
	sleep 5
	ps aux|grep tomcat-zxmg|grep startup|awk '{print $2}'|xargs kill -9

	echo "Stop Tomcat ZXMG OK"
	;;
	restart)
	$0 stop
	$0 start
	;;
	*)
	echo "Usage: $0 {start|stop|restart}"
exit 1
esac
```
* opends

```shell
#!/bin/sh
# chkconfig: 345 90 11
# description: crm start/stop/restart script

# host 231
#CRM_OWNR="crm"
CRM_OWNR="mais"

case "$1" in
	start)

	echo "Starting OpenDS ... "
	su - mais -c /home/mais/start-opends.sh
	echo "Start OK"
	;;
	stop)
	echo "Stoping OpenDS ... "
	su - mais -c /home/mais/stop-opends.sh
	echo "Stop OK"
	;;
	restart)
	$0 stop
	$0 start
	;;
	*)
	echo "Usage: $0 {start|stop|restart}"
exit 1
esac
```
添加服务
```shell
chkconfig --add opends
chkconfig --add tomcat-org
chkconfig --add tomcat-zxmg
```
这之后就可以通过service tomcat-zxmg stop/start/restart 来关闭启动重启tomcat-zxmg。其他类推

####Part3: 设置防火墙
在这之前都是先为了能够正常访问8080,8088,4389防火墙都是关闭的。
首先可以导出原197上的防火墙规则命令如下:
``iptales-save /opt/iptables_rules.txt``
然后修改规则文件去掉不需要的我去掉了一些转发最后内容如下：
```shell
# Generated by iptables-save v1.3.5 on Sat May 31 22:35:12 2014
*filter
:INPUT DROP [18001:1890454]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 4389 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 8080 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 4088 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 22 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 8888 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 8999 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 10001 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 10002 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 1521 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 4389 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 4444 -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 8088 -j ACCEPT 
-A INPUT -s 127.0.0.1 -d 127.0.0.1 -j ACCEPT 
-A INPUT -p tcp -m tcp --dport 8443 -j ACCEPT 
-A INPUT -s 192.168.0.200 -p icmp -j ACCEPT 
-A INPUT -p tcp -m state --state NEW -m tcp --dport 5666 -j ACCEPT 
-A INPUT -d 192.168.0.197 -p tcp -m tcp --dport 9090 -j ACCEPT 
-A INPUT -d 192.168.0.197 -p tcp -m tcp --dport 9091 -j ACCEPT 
-A INPUT -d 192.168.0.197 -p tcp -m tcp --dport 5222 -j ACCEPT 
-A INPUT -d 192.168.0.197 -p tcp -m tcp --dport 5223 -j ACCEPT 
-A OUTPUT -j ACCEPT 
COMMIT
# Completed on Sat May 31 22:35:12 2014
```
然后导入到新的197服务器iptables 
``iptables-restore < /opt/iptables_rules.txt``
最后如果要使这些规则再每次重启的时候都不会消失则可以将规则写入文件/etc/sysconfig/iptables即可

