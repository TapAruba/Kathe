// Numera capítulos, arma el índice con números de página y pone el pie en cada página.
(function () {
  var FOOT = 'Silver House Barber · Guía del dashboard';
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var toc = document.getElementById('toc');
  var n = 0;
  pages.forEach(function (pg, i) {
    var num = i + 1;
    var title = pg.getAttribute('data-ch');
    if (title) {
      n++;
      var span = pg.querySelector('.ch .n'); if (span) span.textContent = n;
      if (toc) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="tn">' + n + '</span><span class="tt"></span><span class="tp">pág. ' + num + '</span>';
        li.querySelector('.tt').textContent = title;
        toc.appendChild(li);
      }
    }
    var f = document.createElement('div');
    f.className = pg.hasAttribute('data-nofoot') ? 'foot-cover' : 'foot';
    f.innerHTML = '<span></span><span></span>';
    f.firstChild.textContent = FOOT; f.lastChild.textContent = num;
    pg.appendChild(f);
  });
  // Imagen que falta: recuadro punteado en lugar de un ícono roto.
  Array.prototype.forEach.call(document.querySelectorAll('img'), function (im) {
    im.addEventListener('error', function () {
      var fig = im.closest('figure'); if (fig) { fig.classList.add('missing'); im.replaceWith(document.createTextNode('Captura pendiente: ' + im.getAttribute('src'))); }
    });
  });
})();
