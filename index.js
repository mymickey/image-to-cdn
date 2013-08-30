 var cig =require('./cssimagego');
 var igo = cig.cssImageGo;
 var replace = cig.replace;
module.exports = function(att){
	att.register('igo', 'publish image to cdn', function(){
		var path = require('path');
        var uploader = require('node-uploader');

        var attutil = att.util;
        var fileutil = att.file;

		 /**
		    att插件的终端帮助提示，在att终端中输入`att imagego -h`可以显示此提示
		    @method help
		    **/
        this.help = function() {
            var str = [  'options:','暂无','Examples:', ' #直接上传到线上,测试,预发三个环境并替换本地路径为线上路径', ' att igo ~/css/style.css'].join("\n").green;

            require('util').puts(str);
        };
         /**
    上传某个文件到远端服务器指定的地址
    @method _copyToServer
    @private
    @static
    @param {String} url 上传服务地址
    @param {String} file 本地文件路径
    @param {String} identity 文件上传的标识
    @param {Object} params 上传的参数
    @param {Function} callback 上传的回调函数
    **/
        this._copyToServer = function(url, file, identity, params, callback) {
            var files = {};
            files[identity] = file;
            uploader.upload({
                url: url,
                files: files,
                data: params
            }, function(e, data) {
                if (e) {
                    return callback(e);
                }
                var json;
                try {
                    json = JSON.parse(data);
                } catch (err) {
                    att.log.error(data);
                    return callback(err);
                }
                if (json.code != 200) {
                    return callback(new Error(json.msgs));
                }
                callback && callback(null, json);
            });
        };

         /**
    根据依赖上传静态资源文件到服务器。
    一般来说，如果要上传文件到production CDN, 应该先把文件上传到QA CDN, Staging CDN。
    该方法会通过`att.json`中配置的依赖信息，以此上传CDN服务器。
    @method copyToServer
    @static
    @protected
    @param {String} file 资源文件的路径
    @param {Object} options 压缩时的参数
        @param {Boolean} options.datauri 压缩css时是否使用`datauri`
        @param {String} options.flag 上传的服务器标识，默认是`test`
        @param {String} filepath 上传到服务器相对于workspace的路径
    @example

        var att = require('att');
        var cdn = require('cdn');
        cdn.copyToServer('/path/to/file.png');
    **/
        this.copyToServer = function(file, callback, options) {
            var flag = options.flag ? options.flag : 'test';
            var identify = options.identify || 'file';

            //上传单个文件
            var doUploadOne = (function(url, flag, uploadComplete) {
                var params = {
                    filename: path.basename(file),
                    filepath: options.filepath,
                    target: (flag === "production") ? "cdn_home" : "test_home",
                    overwrite: (flag === "production") ? "no" : "yes"
                }
                this._copyToServer(url, file, identify, params, function(e, response) {
                    if (!e) {
                        att.log.info('upload ' + flag + ' site succeed');
                    } else {
                        att.log.error('upload ' + flag + ' site failed: ' + e.message);
                    }
                    uploadComplete(e);
                });
            }).bind(this);

            //通过依赖上传文件
            var doUpload = (function(flag, uploadComplete) {
                var data = this.options.flags[flag];
                if (!data || !data.url) {
                    return uploadComplete(new Error('No service endpoint find by upload flag ' + flag));
                }
                if (data.depend) {
                    doUpload(data.depend, function() {
                        doUploadOne(data.url, flag, uploadComplete);
                    });
                } else {
                    doUploadOne(data.url, flag, uploadComplete);
                }
            }).bind(this);

            doUpload(flag, callback);
        }
        /**
        将某个文件上传到CDN
        @method uploadFile
        @static
        @param {String} file 本地文件路径
        @param {String} output 输出文件路径，该参数此处无意义
        @param {Function} callback 上传后的回调函数
        @param {Object} 上传过程中的配置参数
        **/
        this.uploadFile = function(file, callback, options) {
            var opts = attutil.merge(this.options, options);
            var minify = att.load('minify');
            var basename = path.basename(file);
            var fileNewName;
            var outputPath;
            var dirInTmp;
            var filepath = file;
            var UUID_MODE_PATH = '/x';
            var MINIFY_SUPPORT = /\.(png|jpg|jpeg|gif)$/i

            //开始上传到CDN
            var startUpload = function() {
                this.copyToServer(outputPath, function(e) {
                    var url;
                    if (!e) {
                        var cdnHost = host ? host : 'http://CDN';
                        url = host + ( UUID_MODE_PATH) + "/" + fileNewName;
                        console.log('----------------------');
                        att.log.debug('upload:'+outputPath)
                        att.log.debug('file in CDN: ' + url);
                        console.log('----------------------');
                    }
                    callback(e,outputPath,url);
                }, opts);
            }.bind(this);

            //上传前，执行压缩优化
            var beforeUpload = function() {
              
                //如果忽略压缩，或者文件不支持压缩
                if (opts.ignoreMinify || !basename.match(MINIFY_SUPPORT)) {
                    //转换成绝对路径
                    startUpload();
                } else {
                    //先压缩，再上传
                    var minifyOptions = {
                        workspace: opts.workspace,
                        host: host,
                        pathPrefix: opts.pathPrefix
                    };

                    minify.minifyFile(outputPath, outputPath, function(e, data) {
                        if (e) {
                            callback(e)
                        } else {
                            startUpload();
                        }
                    }.bind(this), minifyOptions);
                }
            }.bind(this);


            opts.filepath = filepath;
            basename = path.basename(file);
            dirInTmp = path.normalize(tmpDir + path.sep + filepath);
            fileNewName = basename;
            outputPath = file;
           
            if (opts.upload ) {                
                
                return startUpload();
            }

            
            
            beforeUpload();
            



        }
        this.igo=function(argv){
          var cssFile = argv['_'][1];
         
          var opt = igo(cssFile);
          var files = opt.files;
          var argvs = [];
          files.forEach(function(v,k){
            argvs.push(att.util.merge(argv,{
              '_':['cdn',v.path],
              'glob':v.path
            }))
          });
          opt.argvs = argvs;
          opt.cssFile = cssFile;
          return opt
        }
      
          /**
	    att插件初的初始化函数
	    @method initialize
	    **/
        this.initialize = function(options) {
            this.config = attutil.getConfig() || {}
            this.options = {
                "css2absolute": true,
                "host": "http://m.alicdn.com",
                "flags": {
                    "test": {
                        "url": "http://10.125.14.134/system/att/upload.php"
                    },
                    "staging": {
                        "url": "http://10.125.14.135/system/att/upload.php",
                        "depend": "test"
                    },
                    "production": {
                        "url": "http://m-source.aliyun.com/att_server/upload.php",
                        "depend": "staging"
                    }
                },
                'workspace':'cssimagego/'
            };
            var json = this.config.data || {};
            if (this.config.dir) {
                this.options.workspace = this.config.dir;
                if (json.cdnPath) {
                    this.options.pathPrefix = json.cdnPath.replace(/^\/|\/$/g, "");
                }
            }

            tmpDir = json.tempdir || this.options.tmpDir;
            if (!tmpDir) {
                tmpDir = path.join(__dirname, '..', 'tmp');
            }
            host = json.host || this.options.host;
        };
        
            /**
    执行cdn，上传静态资源到CDN
    @method execute
    @static
    @param {String} argv 使用optimist模块解析出来的对象
    @param {Function} callback 执行完的回调函数
    @example
      
    **/
        this.execute = function(argv, callback) {
           
            var opts = {
                matchFunction: function(name) {
                    if (!fileutil.isFile(name)) {
                        return false;
                    }
                    var supportedFile = this.options.supportedFile;
                    if (!supportedFile) {
                        return true;
                    }
                    var extname = fileutil.extname(name).toLowerCase();
                    return supportedFile.indexOf(extname) != -1;
                }.bind(this),
                question: function(name) {
                    return 'transfer to ' + opts.flag + ' cdn ' + name + '? ';
                },
                silent: argv.i || argv.silent
            }
            //flag
            if (argv.flag) {
                opts.flag = argv.flag
            } else {
                opts.flag = 'production';
             }

            //是否略过压缩、文件名加版本号等预处理
            //TODO:如果压缩的话 会报错Illegal instruction: 4
            opts.upload = true// argv.upload ;
            //是否略过minify
            if (argv.ignore || argv['ingore-minify']) {
                opts.ignoreMinify = true;
            } else {
                opts.ignoreMinify = false;
            }
            var opt= this.igo(argv);
            var argvs =opt.argvs;
            var files = [opt.files[0]];
            var me= this;
            console.log('files:',files);
            //return;
            if (files.length) {
                files.forEach(function(v,k){
                    me.uploadFile(v.path, function(e,filePath,url){
                            v.path = url;
                            if(files.length -1 ==k){
                                //console.log('ok:',files);
                                replace(opt.cssFile,null,files,true)
                            }
                        }, opts);
                });
            }
            else{
                att.log.info('No reference to local image in '+opt.cssFile)
            }

        }
	});
}