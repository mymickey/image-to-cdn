var hesher = require('./lib/getHash').hesher;
var fileutil = require('fileutil')
var cii = require('css-inner-image')
var fs = require('fs')
var path = require('path')

/**
 * 要上传的文件路径
 * @param  {String} filePath path
 * @return {String}          重命名后的文件
 */
module.exports.cssImageGo=function(filePath){
	var opt = cii.parse(filePath);
	//console.log('cssImageGo -opt:',opt);
	var sizeOf = require('image-size');
	var tmpDir = path.join(__dirname, '..', 'tmp');
	tmpDir = path.normalize(tmpDir + path.sep )
	var files = opt.files;
	var paths = [];
	var indexs =[]
	files.forEach(function(v,k){
		var dimensions = sizeOf(v.path);
		var newName =  hesher()+'-'+dimensions.width +'-'+ dimensions.height +'.'+fileutil.extname(v.path);
		var saveTmpDir = path.join(tmpDir,newName);
		fileutil.mkdir(tmpDir);
		fileutil.copy(v.path,tmpDir,newName);
		v.path = saveTmpDir;
		if(paths.indexOf(v.path) !== -1){
			indexs.push(k)
		}
		paths.push(v.path)

	});
	indexs.forEach(function(v,k){
		files.splice(v,1)
	})
	return opt;
}
module.exports.replace =function(){
	return cii.replace.apply(this,arguments)
}
