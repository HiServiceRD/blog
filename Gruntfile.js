var path = require("path");
var spawn = require('child_process').spawn;
module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      clean: ["publish"],
      initClean: ["_publish", "publish"],
      prePublish: ["_publish"]
    },
    copy: {
      buildToPublish: {
        files: [{
          expand: true,
          cwd: 'publish/',
          src: ['**'],
          dest: '_publish/'
        }]
      }
    },
    gitclone: {
      clone: {
        options: {
          repository: 'git@github.com:HiServiceRD/HiServiceRD.github.io',
          branch: 'master',
          directory: '_publish'
        }
      }
    },
    'gh-pages': {
      options: {
        base: 'public',
        branch: 'master',
        repo: 'git@github.com:HiServiceRD/HiServiceRD.github.io',
        user: {
          name: 'HiServiceRD',
          email: 'lingyucoder@gmail.com'
        },
        clone: "_publish",
        message: '海思机器人自动提交 @ ' + new Date().toLocaleString(),
        publish: true
      },
      publish: {
        src: ['**'],
      }
    }
  });
  grunt.registerTask('hexoGenerate', 'Generate hexo.', function() {
    var done = this.async();
    var gen = spawn("hexo.cmd", ["generate"], {
      stdio: 'inherit'
    });
    gen.on('close', function(code) {
      if (code !== 0) {
        grunt.fail.fatal(new Error("Hexo错误：生成失败"), code);
      }
      done();
    });
  });
  grunt.registerTask('hexoServer', 'Start hexo server.', function() {
    var done = this.async();
    var gen = spawn("hexo.cmd", ["server"], {
      stdio: 'inherit'
    });
    gen.on('close', function(code) {
      if (code !== 0) {
        grunt.fail.fatal(new Error("Hexo错误：服务器启动失败"), code);
      }
      done();
    });
  });
  grunt.registerTask('init', ['clean:initClean', 'gitclone']);
  grunt.registerTask('default', ['clean', 'hexoGenerate']);
  grunt.registerTask('build', ['default']);
  grunt.registerTask('server', ['build', 'hexoServer']);
  grunt.registerTask('publish', ['build', 'copy:buildToPublish', 'gh-pages:publish']);
};