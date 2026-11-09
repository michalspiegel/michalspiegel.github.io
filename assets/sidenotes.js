// Turns kramdown footnotes ([^name]) into margin sidenotes when the window is
// wide enough. Otherwise the regular footnotes at the bottom of the post stay
// visible. The Markdown source is unchanged either way.
(function () {
  var body = document.querySelector(".article-body");
  if (!body) return;

  var refs = body.querySelectorAll('sup[id^="fnref:"]');
  if (!refs.length) return;

  var GAP_BELOW = 14; // minimum vertical space between stacked sidenotes (px)
  var EDGE = 16; // keep this much space between a note and the window edge (px)
  var pending = false;

  function cssPx(name, fallback) {
    var v = parseFloat(getComputedStyle(body).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }

  function clear() {
    body.querySelectorAll(".sidenote").forEach(function (n) {
      n.remove();
    });
    body.classList.remove("has-sidenotes");
    refs.forEach(function (r) {
      r.classList.remove("is-active");
    });
  }

  function layout() {
    pending = false;
    clear();

    var noteWidth = cssPx("--sidenote-width", 220);
    var noteGap = cssPx("--sidenote-gap", 28);
    var room =
      document.documentElement.clientWidth - body.getBoundingClientRect().right;
    if (room < noteWidth + noteGap + EDGE) return; // not enough margin: footnotes at bottom

    var bodyTop = body.getBoundingClientRect().top + window.scrollY;
    var notes = [];

    refs.forEach(function (ref) {
      var id = ref.id.replace("fnref:", "");
      var item = document.getElementById("fn:" + id);
      if (!item) return;

      var note = document.createElement("aside");
      note.className = "sidenote";
      note.dataset.ref = ref.id;

      var num = document.createElement("span");
      num.className = "sidenote-num";
      num.textContent = ref.textContent.trim();
      note.appendChild(num);

      var content = item.cloneNode(true);
      content.querySelectorAll(".reversefootnote").forEach(function (a) {
        a.remove();
      });
      // Duplicate ids would break anchors and KaTeX; drop them from the copy.
      content.querySelectorAll("[id]").forEach(function (el) {
        el.removeAttribute("id");
      });
      while (content.firstChild) note.appendChild(content.firstChild);

      body.appendChild(note);
      var top = ref.getBoundingClientRect().top + window.scrollY - bodyTop;
      notes.push({ el: note, ref: ref, top: top });
    });

    body.classList.add("has-sidenotes");

    // Align each note with its reference; push down notes that would overlap.
    var floor = 0;
    notes.forEach(function (n) {
      var top = Math.max(n.top, floor);
      n.el.style.top = top + "px";
      floor = top + n.el.offsetHeight + GAP_BELOW;
    });
  }

  // Highlight a reference and its note together on hover (delegated, so it
  // survives re-layouts without piling up listeners).
  function setActive(target, on) {
    var ref = target.closest && target.closest('sup[id^="fnref:"]');
    var note = target.closest && target.closest(".sidenote");
    if (!body.classList.contains("has-sidenotes") || (!ref && !note)) return;
    var refId = ref ? ref.id : note.dataset.ref;
    var r = document.getElementById(refId);
    var n = body.querySelector('.sidenote[data-ref="' + refId + '"]');
    if (r) r.classList.toggle("is-active", on);
    if (n) n.classList.toggle("is-active", on);
  }
  body.addEventListener("mouseover", function (e) {
    setActive(e.target, true);
  });
  body.addEventListener("mouseout", function (e) {
    setActive(e.target, false);
  });

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(layout);
  }

  // With sidenotes on, clicking a reference should highlight the note, not
  // jump to the (hidden) bottom list.
  body.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a.footnote");
    if (!link || !body.classList.contains("has-sidenotes")) return;
    e.preventDefault();
    var note = body.querySelector('.sidenote[data-ref="' + link.parentNode.id + '"]');
    if (note) note.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  // Run after KaTeX (loaded with defer) has typeset math in the footnotes,
  // and again whenever fonts, images or the window change the layout.
  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  body.querySelectorAll("img").forEach(function (img) {
    if (!img.complete) img.addEventListener("load", schedule);
  });
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(body);
})();
