This is some serious syntactic magic.

This is all automatic, no need to learn anything new. No new syntax, no new operators, functions or such.

Everything sort of just works, or at least, I want to draw you into this project by making it sound as if it was some magical box where parentheses and curly brackets go in and out comes ponies on butterflies that flutter across the clear azure sky. In reality it's not that magical unicorn dust I'm trying to convince you that it is.

This project is somewhat similar to the js deferred, async.js, coffescript defer, and the other ones. However, there are a few differences.

This one is pretty much automatic. You theoretically just wrap a function like slow(function(){}) and magically the insides run async and non-blocking.

In practice, it's not nearly as awesome.


There are a few significant bugs in the runtime, especially in for loops. Also, in general, it's not possible for it work if you omit the curly brackets in a block.

It automagically magicalates every part of the loop, so you really have no choice which loop to optimize for. If you're trying to do a SHA1 hash of a 6 megabyte string using this, it's going to be very very slow.

Every operation takes at least 1ms on Google Chrome's developer builds. At that rate, with a conservative estimate, it should take around 1.7 hours to finish with a result. On Firefox, it would take roughly 10ms at least, so around 17 hours to calculate the sha1 hash of a 6MB string. Versus what? three seconds to do a md5sum on my 600mb Ubuntu torrent? WebWorkers FTW, you should use that instead. I can not stress enough how slow this is. I even freaking named the entire project "slow.js", if that's not enough of a deterrent, I don't know what is.

In fact, even though by design, it *should* work on all browsers, in practice, it doesn't. I haven't tested it in any browser other than firefox and chrome, so I have no clue. If someone would like to add support for browsers (shouldn't be too hard, even IE shouldn't be that hard).

Anyway, how does it work? Well, lets start with a simple infinite loop.

  var a = 0;
  while(true){
    console.log(a++);
  }
  alert('the world has ended');
  
Running it would usually lock your browser, but if you wrap it in the magical slow() tags, something magical happens.

  slow(function(){
    var a = 0;
    while(true){
      console.log(a++);
    }
    alert('the world has ended');
  })
  
It doesn't freeze! Everything happens awesomely, but slower and non-blockingly. And the world still doesn't end!

To, say animate a box:
  <div id="blah" style="background-color: red; position: absolute; width: 40px; height: 30px; top: 32px; left: 0px"></div>
  <script>
    slow(function(){
      for(var i = 0; i < 1000; i++){
        document.getElementbyId('blah').style.left = i+'px';
      }
    })
  </script>
  
And you see it fly off, quickly, but still animated. Now, how do we slow it down (even more?)

  <div id="blah" style="background-color: red; position: absolute; width: 40px; height: 30px; top: 32px; left: 0px"></div>
  <script>
    slow(function(){
      for(var i = 0; i < 1000; i++){
        document.getElementbyId('blah').style.left = i+'px';
        slow.sleep(100);
      }
    })
  </script>
  
Neato, there's a sleep function, as expected. What if I want to download something?

  slow(function(){
    var xhrobj = new XMLHttpRequest();
    xhrobj.open('get','/',true);
    xhrobj.send(null);
    while(xhrobj.readyState != 4){};
    console.log(xhrobj.responseText);
  })
  
  
Sure, it's not that awesome, but hey, it works. And though there's a slow.download function, it probably doesn't work.
