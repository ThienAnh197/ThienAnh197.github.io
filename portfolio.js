(function(){
  var root=document.documentElement,btn=document.getElementById('theme');
  try{var s=localStorage.getItem('theme');if(s)root.setAttribute('data-theme',s)}catch(e){}
  btn.addEventListener('click',function(){
    var dark=root.getAttribute('data-theme')==='dark'||(!root.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);
    var next=dark?'light':'dark';root.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next)}catch(e){}
  });
  var links=[].slice.call(document.querySelectorAll('nav a'));
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting)links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})
  })},{rootMargin:'-45% 0px -50% 0px'});
  document.querySelectorAll('section[id]').forEach(function(s){io.observe(s)});
})();