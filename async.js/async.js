
//
blockScan((function(){
var test = {}
var http =async .
  require   (  'http'  ) 
    
  var net = async.require('net')
net.createServer()
}).toString())


function trim(str){
  return str.replace(/^\s+|\s+$/g, '');
}

function findLastLine(str, pos){
  while(pos--){
    var c = str.substr(pos);
    if(c.charAt(0) == ';' ||
      /^[\{\}\)\(\[\]A-Za-z0-9$_]\s*\n\s*[A-Za-z0-9$_]/.test(c)){
      return pos;
    }
  }
  throw 'crap last';
}

function findNextLine(str, pos){
  while(pos++){
    var c = str.substr(pos);
    if(c.charAt(0) == ';' ||
      /^[\{\}\)\(\[\]A-Za-z0-9$_]\s*\n\s*[A-Za-z0-9$_]/.test(c)){
      return pos;
    }
  }
  throw 'crap next';  
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
  /*
  var ArgEnd = reverseParen(str, start); //in while(blahblahblah){} get to where the while( is
  var NameBegin = reverseName(str, ArgEnd);
  var Name = trim(str.substring(NameBegin, ArgEnd));
  var Args = str.substring(ArgEnd, start);
  */
  var Body = str.substring(start + 1, end);
  
  Body.replace(/[^\w](async\s*\.\s*\w+)/g, function(a, b, c){
      //c = index
      //arrstr[start+c] += 'moo'
      var fp = forwardParen(str, start+c+b.length+1);
      var ep = start+c+1;
      
      var rpl = str.substring(ep+1, fp+1);
      console.log(rpl);
      
      var vn = rpl.replace(/[^a-z0-9A-Z]/g,'').substr(5);
      var lstart = 1+findLastLine(str, start+c)+1;
      var lend = findNextLine(str, start+c)+1;
      var body = str.substring(lstart,lend);
      
      for(var q = lstart; q  < lend; q++){
        //console.log(body)
        arrstr[q] = '';
      }
      arrstr[fp] += rpl;
      console.log(rpl);
      //arrstr[findLastLine(str, start+c)] += 'A';
      arrstr[findNextLine(str, start+c)] += '(function('+vn+'){'+body.replace(rpl, vn)+'\n';
      arrstr[parentend] = '})' + arrstr[parentend];
  });
  //console.log(Name, Args)
  console.log(Body);
}

function blockArray(levels, index, arrstr, str){
  for(var q = levels.length, b = 0; b < q; b++){
    var lev = levels[b];
    blockModify(arrstr, str, lev[0], lev[1], index - 1);
  }
}


function blockScan(str){
  var blockStack = [];
  var blockLevels = {}; //each is = to blockStack.length
  var inDbl = false, inSgl = false;
  arrstr = str.split(''); //it's easier to do insertions without worrying about changing order this way
  //todo: comments, but Function.toString() usually strips comments
  for(var i = 0, l = str.length; i < l; i++){
    var chr = str.charAt(i);
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
        blockArray(blockLevels[level+1], i, arrstr, str);
        console.log('handling block array ',level)
        blockLevels[level+1] = [];
      }
      if(!blockLevels[level]) blockLevels[level] = [];
      blockLevels[level].push([index, i])
    }
  }
  if(blockLevels[0]){
    blockArray(blockLevels[0], i, arrstr, str);
    console.log('handling block array ',0)
    blockLevels[0] = [];
  }
  return arrstr.join('');
}
