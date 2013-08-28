var hesher = require('../lib/getHash').hesher;
var fileutil = require('fileutil')

var fs = require('fs')
var path = require('path')
var filePath = path.resolve('./1.png')
console.log(filePath);
var sizeOf = require('image-size');
var dimensions = sizeOf(filePath);
fileutil.mkdir('./tmp');
fileutil.copy(filePath,'./tmp', hesher()+'-'+dimensions.width +'-'+ dimensions.height +'.'+fileutil.extname(filePath)) 
//console.log(hesher());