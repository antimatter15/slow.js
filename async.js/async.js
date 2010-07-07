function async(fn){
  var mstr = '('+blockScan(fn.toString())+')';
  console.log(mstr);
  return eval(mstr);
}

async.download = function(url){
  return function(callback){
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4) callback(xhr.responseText);
    }
    xhr.send(null);
  }
}

async.sleep = function(duration){
  return function(callback){
    setTimeout(function(){callback()}, duration);
  }
}

async.require = async(function(module){
  //sorta like Node.JS
  return function(callback){
    var prefix = '(function()\x7bvar exports=\x7b\x7d;', postfix = ';return exports\x7d)()';
    callback(eval(prefix +async.download(module +'.js')+postfix));
  }       
})






function trim(str){
  return str.replace(/^\s+|\s+$/g, '');
}

function findLastLine(str, pos){
  var sl = -1;
  while(pos-- > sl){
    var t = lineBreakTest(str, pos);
    if(t) return t;
  }
  return 0;
}

function lineBreakTest(str, pos){
  var c = str.substr(pos);
  if(c.charAt(0) == ';' ||
    /^[\{\}\)\]A-Za-z0-9$_]\s*\n\s*[A-Za-z0-9$_]/.test(c)){
    return pos  + c.match(/.\s*/)[0].length;
  }
  if(/[\{\}]\s*[A-Za-z0-9$_]/.test(c) ||
    /[A-Za-z0-9$_]\s*[\{\}]/.test(c)){
    return pos + c.match(/.\s*/)[0].length
  }
  return false;
}

function findNextLine(str, pos){
  var sl = str.length;
  while(pos++ < sl){
    var t = lineBreakTest(str, pos);
    if(t) return t;
  }
  return sl-1;
}


function forwardParen(str, start){
  var parenStack = [];
  var inDbl = false, inSgl = false;
  var sl = str.length;
  while(++start < sl){
    var chr = str.charAt(start);
    if(/[\s \t]/.test(chr)) continue;
    if(chr == '"' && !inSgl){
      inDbl = !inDbl;
    }else if(chr == "'" && !inDbl){
      inSgl = !inSgl;
    }else if(inSgl || inDbl){
      //neener neener
    }else if(chr == '('){ //close paren = close
      parenStack.push(start);
    }else if(chr == ')'){ //open paren = open
      parenStack.pop();
    }
    if(parenStack.length == 0) return start;
  }
  throw "This should never happen Paren For";
}


function blockModify(arrstr, str, start, end, parentend){
  var Body = str.substring(start + 1, end);
  
  Body.replace(/(\s*)(async\s*\.\s*\w+)\s*\(/g, function(a, lws, b, c){
      //c = index
      //arrstr[start+c] += 'moo'
      var fp = forwardParen(str, start+c+b.length+lws.length);
      var ep = start+c+lws.length;
      
      console.log('B='+b);
      
      
      var rpl = str.substring(ep+1, fp+1);
      console.log('rpl='+rpl);
      
      var varname = b.replace(/[^a-z0-9A-Z]/g,'');
      
      var lstart = findLastLine(str, start+c);
      var lend = findNextLine(str, start+c);
      var body = str.substring(lstart,lend);
      
      
      console.log('body='+body);
      //arrstr[findLastLine(str, start+c)] += 'A';
      //arrstr[findNextLine(str, start+c)] += 'B';
      for(var q = lstart; q  < lend; q++){
        arrstr[q] = '';
      }
      arrstr[findLastLine(str, start+c)] += rpl;
      console.log(arrstr[findNextLine(str, start+c)] )
      arrstr[fp] += '(function('+varname+'){'+body.replace(rpl, varname);
      while(/\s/.test(arrstr[parentend])) parentend--;
      console.log('parentend', arrstr[parentend]);
      
      arrstr[parentend] = '})' + arrstr[parentend];
      
  });
  console.log(arrstr.join(''));
  console.log(str);
  //console.log(Body);
}




function blockScan(str){
  var blockStack = [];
  var blockLevels = {}; //each is = to blockStack.length
  var inDbl = false, inSgl = false;
  var arrstr = str.split(''); //it's easier to do insertions without worrying about changing order this way
  var arrstr2 = str.split(''); //remove done blcoks, but retains length
  
  
  function blockArray(levels, index, arrstr){
    for(var q = levels.length, b = 0; b < q; b++){
      var lev = levels[b];
      blockModify(arrstr, arrstr2.join(''), lev[0], lev[1], index - 1);
      for(var i = lev[0]+1; i < lev[1]; i++){
        arrstr2[i] = '*';
      }
    }
  }

  //todo: comments, but Function.toString() usually strips comments, but chrome doesnt
  for(var i = 0, l = str.length; i < l; i++){
    var chr = arrstr2[i];
    if(chr == '"' && !inSgl){
      inDbl = !inDbl;
    }else if(chr == "'" && !inDbl){
      inSgl = !inSgl;
    }else if(inSgl || inDbl){
      //neener neener
    }else if(chr == '{'){
      blockStack.push(i);
    }else if(chr == '}'){
      var index = blockStack.pop();
      if(!index) throw "This should never happen";
      var level = blockStack.length;
      if(blockLevels[level+1]){
        blockArray(blockLevels[level+1], i, arrstr);
        console.log('handling block array ',level)
        blockLevels[level+1] = [];
      }
      if(!blockLevels[level]) blockLevels[level] = [];
      blockLevels[level].push([index, i])
    }
  }
  if(blockLevels[0]){
    blockArray(blockLevels[0], i, arrstr);
    console.log('handling block array ',0)
    blockLevels[0] = [];
  }
  return arrstr.join('');
}
