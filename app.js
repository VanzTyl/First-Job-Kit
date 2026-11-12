/* Tailor mockup behaviour.
   No framework, no build step, no network. Classic script so it runs from file://.
   The ranking and the change proposals are sample output; the upload, the section scan,
   the decisions, the ledger and the download are real interactions in this browser. */

(function () {
  "use strict";

  var DATA = window.TAILOR_DATA;
  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  var state = {
    screen: "01",
    sections: clone(DATA.resume.sections),
    discarded: [],
    unclassified: clone(DATA.resume.unclassified),
    terms: flattenTerms(),
    selectedListing: "J01",
    gapDecisions: {},
    changes: clone(DATA.changes).map(function (c) { c.decision = null; c.edited = null; return c; }),
    history: [],
    generated: false,
    parseTimer: null,
    tailorTimer: null,
    forced: null,
    forcedPanels: []
  };

  var SECTION_LABELS = {
    contact: "Contact", summary: "Summary", skills: "Skills", experience: "Experience",
    projects: "Projects", education: "Education", certifications: "Certifications"
  };

  /* ---------------------------------------------------------------- helpers */

  function flattenTerms() {
    var out = [];
    DATA.keywordGroups.forEach(function (group) {
      group.terms.forEach(function (term) {
        out.push({ term: term.term, count: term.count, where: term.where, group: group.name,
                   missing: !!term.missing, added: false, removed: false });
      });
    });
    return out;
  }

  function announce(message) {
    var region = $("#live-region");
    region.textContent = "";
    window.setTimeout(function () { region.textContent = message; }, 30);
  }

  function goTo(screenId, options) {
    options = options || {};
    state.screen = screenId;
    $$(".screen").forEach(function (section) {
      section.hidden = section.dataset.screen !== screenId;
    });
    $$(".step").forEach(function (button) {
      var active = button.dataset.goto === screenId;
      if (active) { button.setAttribute("aria-current", "step"); }
      else { button.removeAttribute("aria-current"); }
    });
    clearForced();
    var screen = $("#screen-" + screenId);
    if (!options.silent) {
      var heading = $("h2", screen);
      if (heading) { heading.focus(); }
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    if (screenId === "07") { renderResult(); }
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    return blob.size;
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  /* ---------------------------------------------------------------- upload */

  var ACCEPTED = [".md", ".txt", ".pdf", ".docx"];
  var MAX_BYTES = 2 * 1024 * 1024;

  function showUploadError(message, fix) {
    $("#upload-error").hidden = false;
    $("#upload-error-message").textContent = message;
    $("#upload-error-fix").textContent = "Next action: " + fix;
    $("#upload-progress").hidden = true;
    $("#upload-done").hidden = true;
    $("#upload-cancelled").hidden = true;
    announce("File rejected. " + message + " " + fix);
  }

  function resetUploadPanels() {
    $("#upload-error").hidden = true;
    $("#upload-progress").hidden = true;
    $("#upload-done").hidden = true;
    $("#upload-cancelled").hidden = true;
  }

  function validateFile(file) {
    var name = file.name || "the file";
    var dot = name.lastIndexOf(".");
    var ext = dot === -1 ? "" : name.slice(dot).toLowerCase();

    if (ACCEPTED.indexOf(ext) === -1) {
      return { ok: false, message: name + " is " + (ext || "a file with no extension") +
        ", which this page cannot read.",
        fix: "Save or export it as .md or .txt and choose the new file." };
    }
    if (file.size === 0) {
      return { ok: false, message: name + " is empty.", fix: "Save the resume again and check it has text in it." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, message: name + " is " + (file.size / 1048576).toFixed(1) + " MB, over the 2 MB limit.",
        fix: "Export a smaller copy, or paste the text into .md, then choose it again." };
    }
    if (ext === ".pdf") {
      return { ok: false, message: name + " is a PDF. This page has no PDF text extractor, so it will not guess at the words.",
        fix: "Open the PDF, copy the text into a .md file, and choose that. The notebook can read a text-based PDF." };
    }
    if (ext === ".docx") {
      return { ok: false, message: name + " is a Word document and this page has no Word loader.",
        fix: "Use File > Save As in Word to make a .txt, then choose that." };
    }
    return { ok: true, ext: ext };
  }

  function readFile(file) {
    var check = validateFile(file);
    if (!check.ok) {
      showUploadError(check.message, check.fix);
      $("#file-hint").textContent = "Rejected: " + file.name;
      return;
    }
    resetUploadPanels();
    $("#file-hint").textContent = "Chosen: " + file.name + " (" + Math.max(1, Math.round(file.size / 1024)) + " KB)";

    var reader = new FileReader();
    reader.onerror = function () {
      showUploadError("The browser could not read " + file.name + ".",
        "Try choosing the file again, or copy the text into a new .md file.");
    };
    reader.onload = function () {
      var text = String(reader.result || "");
      if (text.trim().length < 40) {
        showUploadError(file.name + " opened but there was not enough text to work with.",
          "Check that you chose the resume and not an empty template.");
        return;
      }
      startParse(text, file.name);
    };
    reader.readAsText(file);
  }

  function startParse(text, fileName) {
    resetUploadPanels();
    $("#upload-progress").hidden = false;
    $("#upload-done").hidden = true;
    state.parseStage = 0;
    state.parsedText = text;
    state.parsedName = fileName;

    var stages = DATA.stages.parse;
    var stageEl = $("#upload-stage");
    stageEl.textContent = stages[0];
    announce("Parsing. " + stages[0]);

    state.parseTimer = window.setInterval(function () {
      state.parseStage += 1;
      if (state.parseStage < stages.length) {
        stageEl.textContent = stages[state.parseStage];
        announce(stages[state.parseStage]);
        return;
      }
      window.clearInterval(state.parseTimer);
      state.parseTimer = null;
      finishParse();
    }, 650);
  }

  function finishParse() {
    var parsed = parseSections(state.parsedText || "");
    $("#upload-progress").hidden = true;

    if (!parsed.sections.length) {
      $("#upload-done").hidden = true;
      showUploadError("No sections could be found in " + (state.parsedName || "that file") + ".",
        "Check that the resume has short heading lines such as EXPERIENCE or EDUCATION above each block, then choose it again.");
      return;
    }

    state.sections = parsed.sections;
    state.discarded = [];
    state.unclassified = parsed.unclassified;
    var lowCount = parsed.sections.filter(function (s) { return s.confidence < 0.6; }).length;
    $("#upload-done").hidden = false;
    $("#upload-done").innerHTML =
      '<p class="status-line"><span class="status-icon" aria-hidden="true">✓</span>' +
      "<strong>Sections detected.</strong> " + parsed.sections.length + " sections, " +
      lowCount + " of them low confidence. " + parsed.placed + " lines placed, " +
      parsed.aside + " kept aside as unclassified, " + parsed.headingLines + " heading lines.</p>" +
      '<p class="muted">' + (parsed.unaccounted
        ? parsed.unaccounted + " non-empty line(s) sit above the first heading and are treated as the file header."
        : "Every non-empty line in the file is accounted for.") +
      " Nothing has been matched yet. The next screen shows what was detected so it can be corrected first.</p>";
    announce("Sections detected. " + parsed.sections.length + " sections, " + lowCount + " low confidence, " +
      parsed.placed + " lines placed.");
    renderSections();
  }

  /* A small heading scan. Deliberately simpler than the notebook: it has no lexicon of
     synonyms, no content sniffing beyond an email test, and it never guesses a section
     that is not in the list below. */
  var HEADINGS = {
    contact: ["contact", "contact information", "contact details", "personal details"],
    summary: ["summary", "profile", "objective", "about", "about me"],
    skills: ["skills", "core skills", "technical skills", "competencies"],
    experience: ["experience", "work experience", "employment", "employment history", "work history"],
    projects: ["projects", "personal projects", "selected projects", "portfolio"],
    education: ["education", "academic background", "qualifications"],
    certifications: ["certifications", "certificates", "licenses", "training"]
  };

  function headingKey(line) {
    var clean = line.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
    for (var key in HEADINGS) {
      if (HEADINGS[key].indexOf(clean) !== -1) { return key; }
    }
    return null;
  }

  function looksLikeHeading(line) {
    var text = line.trim();
    if (!text || text.length > 60) { return false; }
    if (/^[-*•]/.test(text)) { return false; }
    if (/[.,;:]$/.test(text)) { return false; }
    if (/[|@]/.test(text) || text.indexOf("http") !== -1) { return false; }
    if (text.split(/\s+/).length > 6) { return false; }
    if (/\b(19|20)\d{2}\b/.test(text)) { return false; }
    var upper = /^[^a-z]*$/.test(text.replace(/[^A-Za-z]/g, ""));
    var title = text.split(/\s+/).every(function (word) { return /^[A-Z]/.test(word) || word.length < 3; });
    return upper || title;
  }

  function parseSections(text) {
    var lines = text.replace(/\r\n?/g, "\n").split("\n");
    var heads = [];
    lines.forEach(function (line, index) {
      if (!looksLikeHeading(line)) { return; }
      var previous = index === 0 ? "" : lines[index - 1];
      var known = headingKey(line);
      if (known || !previous.trim()) {
        heads.push({ index: index, line: line.trim(), key: known });
      }
    });

    var sections = [];
    var unknown = { heading: null, lines: [] };
    heads.forEach(function (head, position) {
      var end = position + 1 < heads.length ? heads[position + 1].index : lines.length;
      var body = lines.slice(head.index + 1, end).filter(function (line) { return line.trim(); });
      if (!head.key) {
        unknown.heading = unknown.heading || head.line;
        unknown.lines = unknown.lines.concat(body);
        return;
      }
      if (sections.some(function (s) { return s.key === head.key; })) {
        var existing = sections.filter(function (s) { return s.key === head.key; })[0];
        existing.lines = existing.lines.concat(body);
        return;
      }
      var confidence = 0.30;
      var reasons = ["+0.30 base: a block boundary was found"];
      var upper = /^[^a-z]*$/.test(head.line.replace(/[^A-Za-z]/g, ""));
      if (head.key) {
        confidence += 0.30;
        reasons.push("+0.30 heading: '" + head.line + "' is in the heading list");
      }
      if (upper) {
        confidence += 0.12;
        reasons.push("+0.12 shape: all upper case");
      } else {
        confidence += 0.08;
        reasons.push("+0.08 shape: title case, six words or fewer");
      }
      if (head.line.split(/\s+/).length <= 3) {
        confidence += 0.05;
        reasons.push("+0.05 shape: three words or fewer");
      }
      if (body.length) {
        confidence += 0.10;
        reasons.push("+0.10 content: " + body.length + " line(s) sit under it");
      } else {
        confidence -= 0.15;
        reasons.push("-0.15 content: nothing sits under the heading");
      }
      if (head.key === "contact" && body.length && !/[\w.+-]+@[\w-]+\./.test(body.join(" "))) {
        confidence -= 0.15;
        reasons.push("-0.15 content: no email address in the contact block");
      }
      // An empty section is never allowed to look confident, whatever the shape signals said.
      if (!body.length && confidence > 0.45) {
        confidence = 0.45;
        reasons.push("capped at 0.45: an empty section is flagged for a person, not trusted");
      }
      sections.push({
        id: "sec-" + head.key + "-" + position,
        key: head.key,
        label: SECTION_LABELS[head.key],
        heading: head.line,
        confidence: Math.round(Math.min(Math.max(confidence, 0.05), 0.95) * 100) / 100,
        lines: body,
        reasons: reasons
      });
    });

    // a file with no headings at all is not silently invented into sections
    if (!sections.length) {
      var body = lines.filter(function (line) { return line.trim(); });
      if (body.length) {
        sections.push({
          id: "sec-unclassified", key: "unclassified", label: "Unclassified",
          heading: null, confidence: 0.2, lines: body,
          reasons: ["no heading line was found anywhere in this file",
                    "the text is kept as one block rather than guessed into sections"]
        });
      }
    }

    var assigned = sections.reduce(function (total, s) { return total + s.lines.length; }, 0);
    var headingLines = heads.length;
    var totalLines = lines.filter(function (line) { return line.trim(); }).length;
    return {
      sections: sections,
      placed: assigned,
      aside: unknown.lines.length,
      headingLines: headingLines,
      totalLines: totalLines,
      unaccounted: Math.max(0, totalLines - assigned - unknown.lines.length - headingLines),
      unclassified: {
        heading: unknown.heading,
        lines: unknown.lines.slice(0, 6),
        message: unknown.heading
          ? "Headed “" + unknown.heading + "”, which is not one of the seven modelled sections. Kept and shown, never used as evidence."
          : "No unrecognised headings found."
      }
    };
  }

  /* ---------------------------------------------------------------- sections */

  function confidenceChip(section) {
    if (section.confidence < 0.6) {
      return '<span class="chip chip-low"><span aria-hidden="true">!</span> Check this — ' +
        Math.round(section.confidence * 100) + "% confident</span>";
    }
    return '<span class="chip chip-high"><span aria-hidden="true">✓</span> Detected — ' +
      Math.round(section.confidence * 100) + "% confident</span>";
  }

  function renderSections() {
    var list = $("#section-list");
    list.innerHTML = "";

    state.sections.forEach(function (section) {
      var item = document.createElement("li");
      item.className = "card";
      var options = state.sections
        .filter(function (s) { return s.id !== section.id; })
        .map(function (s) { return '<option value="' + s.id + '">' + s.label + "</option>"; })
        .join("");

      item.innerHTML =
        '<div class="card-head"><span class="card-title">' + section.label + "</span>" +
        confidenceChip(section) + "</div>" +
        '<p class="hint">Heading as written: “' + (section.heading || "no heading") + "” · " +
        section.lines.length + " line" + (section.lines.length === 1 ? "" : "s") + "</p>" +
        '<pre class="section-lines">' + (section.lines.join("\n") || "(nothing under this heading)") + "</pre>" +
        '<details><summary class="button button-quiet" style="display:inline-flex;margin-top:10px">Why this confidence, and edit it</summary>' +
        '<ul class="term-list" style="margin-top:10px">' +
        section.reasons.map(function (reason) { return '<li class="term">' + reason + "</li>"; }).join("") +
        "</ul>" +
        '<div class="inline-form">' +
        '<label for="rename-' + section.id + '">Section name</label>' +
        '<input id="rename-' + section.id + '" type="text" value="' + section.label + '" data-rename="' + section.id + '">' +
        "</div>" +
        '<div class="row">' +
        '<label class="visually-hidden" for="merge-' + section.id + '">Merge ' + section.label + " into another section</label>" +
        '<select id="merge-' + section.id + '" data-merge="' + section.id + '">' +
        '<option value="">Merge into…</option>' + options + "</select>" +
        '<button type="button" class="button" data-merge-go="' + section.id + '">Merge</button>' +
        '<label class="visually-hidden" for="split-' + section.id + '">Split ' + section.label + " at line number</label>" +
        '<input id="split-' + section.id + '" type="number" min="1" max="' + Math.max(1, section.lines.length) +
        '" value="1" style="width:88px" data-split-at="' + section.id + '">' +
        '<button type="button" class="button" data-split="' + section.id + '">Split at line</button>' +
        '<button type="button" class="button button-danger" data-discard="' + section.id + '">Discard</button>' +
        "</div></details>";

      if (section.lines.length === 0 && !section.acknowledged) {
        var empty = document.createElement("div");
        empty.className = "panel panel-warn";
        empty.innerHTML =
          '<p class="status-line"><span class="status-icon" aria-hidden="true">!</span><strong>No ' +
          section.label.toLowerCase() + " found.</strong></p>" +
          '<p class="muted">Add one yourself, or continue without it. The system will not fill this section in.</p>' +
          '<div class="inline-form">' +
          '<label for="add-' + section.id + '">Add a line to ' + section.label + "</label>" +
          '<input id="add-' + section.id + '" type="text" data-empty-add="' + section.id + '">' +
          '<button type="button" class="button" data-empty-save="' + section.id + '">Add this line</button>' +
          '<button type="button" class="button button-quiet" data-empty-skip="' + section.id + '">Continue without it</button>' +
          "</div>";
        item.appendChild(empty);
      }
      if (section.lines.length === 0 && section.acknowledged) {
        var ack = document.createElement("p");
        ack.className = "hint";
        ack.textContent = "You chose to continue without " + section.label.toLowerCase() +
          ". It stays empty and is not used as matching evidence.";
        item.appendChild(ack);
      }
      list.appendChild(item);
    });

    var unclassified = $("#unclassified-card");
    if (state.unclassified.lines && state.unclassified.lines.length) {
      unclassified.hidden = false;
      unclassified.innerHTML =
        '<p class="status-line"><span class="status-icon" aria-hidden="true">?</span><strong>Unclassified: ' +
        (state.unclassified.heading || "no heading") + "</strong></p>" +
        '<p class="muted">' + state.unclassified.message + "</p>" +
        '<pre class="section-lines">' + state.unclassified.lines.join("\n") + "</pre>" +
        '<p class="hint">A person can relabel this into one of the seven sections above. Until then it is not used for matching.</p>';
    } else {
      unclassified.hidden = true;
      unclassified.innerHTML = "";
    }

    if (state.discarded.length) {
      var bin = document.createElement("li");
      bin.className = "panel panel-quiet";
      bin.innerHTML = '<p><strong>Discarded sections</strong> — kept here so nothing disappears by accident.</p>' +
        state.discarded.map(function (section) {
          return '<button type="button" class="button" data-restore="' + section.id + '">Restore ' + section.label + "</button>";
        }).join(" ");
      list.appendChild(bin);
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-goto]");
    if (target) { goTo(target.dataset.goto); return; }

    var discard = event.target.closest("[data-discard]");
    if (discard) {
      var index = state.sections.findIndex(function (s) { return s.id === discard.dataset.discard; });
      if (index !== -1) {
        var removed = state.sections.splice(index, 1)[0];
        state.discarded.push(removed);
        renderSections();
        announce(removed.label + " discarded. It can be restored from the list below the sections.");
      }
      return;
    }

    var restore = event.target.closest("[data-restore]");
    if (restore) {
      var at = state.discarded.findIndex(function (s) { return s.id === restore.dataset.restore; });
      if (at !== -1) {
        var back = state.discarded.splice(at, 1)[0];
        state.sections.push(back);
        renderSections();
        announce(back.label + " restored.");
      }
      return;
    }

    var mergeGo = event.target.closest("[data-merge-go]");
    if (mergeGo) {
      var fromId = mergeGo.dataset.mergeGo;
      var select = $('[data-merge="' + fromId + '"]');
      var toId = select ? select.value : "";
      if (!toId) { announce("Choose a section to merge into first."); if (select) { select.focus(); } return; }
      var from = state.sections.filter(function (s) { return s.id === fromId; })[0];
      var to = state.sections.filter(function (s) { return s.id === toId; })[0];
      if (!from || !to) { return; }
      to.lines = to.lines.concat(from.lines);
      to.confidence = Math.min(to.confidence + 0.05, 0.95);
      state.sections = state.sections.filter(function (s) { return s.id !== fromId; });
      renderSections();
      announce(from.label + " merged into " + to.label + ".");
      return;
    }

    var split = event.target.closest("[data-split]");
    if (split) {
      var section = state.sections.filter(function (s) { return s.id === split.dataset.split; })[0];
      var input = $('[data-split-at="' + split.dataset.split + '"]');
      var at = parseInt(input ? input.value : "1", 10);
      if (!section || !at || at < 1 || at >= section.lines.length) {
        announce("Give a line number between 1 and " + (section ? section.lines.length : 1) + " to split at.");
        if (input) { input.focus(); }
        return;
      }
      var copy = clone(section);
      copy.id = section.id + "-b";
      copy.label = section.label + " (part 2)";
      copy.lines = section.lines.slice(at);
      copy.confidence = Math.min(section.confidence, 0.55);
      section.lines = section.lines.slice(0, at);
      var indexOf = state.sections.indexOf(section);
      state.sections.splice(indexOf + 1, 0, copy);
      renderSections();
      announce(section.label + " split at line " + at + ".");
      return;
    }

    var saveEmpty = event.target.closest("[data-empty-save]");
    if (saveEmpty) {
      var targetSection = state.sections.filter(function (s) { return s.id === saveEmpty.dataset.emptySave; })[0];
      var field = $('[data-empty-add="' + saveEmpty.dataset.emptySave + '"]');
      var value = field ? field.value.trim() : "";
      if (!value) { announce("Type the line first, or continue without it."); if (field) { field.focus(); } return; }
      targetSection.lines = [value + "  [added by you]"];
      renderSections();
      announce("Line added by you to " + targetSection.label + ".");
      return;
    }

    var skipEmpty = event.target.closest("[data-empty-skip]");
    if (skipEmpty) {
      var skipped = state.sections.filter(function (s) { return s.id === skipEmpty.dataset.emptySkip; })[0];
      if (skipped) { skipped.acknowledged = true; }
      renderSections();
      announce("Continuing without " + (skipped ? skipped.label : "that section") + ". It stays empty.");
    }
  });

  document.addEventListener("change", function (event) {
    var rename = event.target.closest("[data-rename]");
    if (rename) {
      var section = state.sections.filter(function (s) { return s.id === rename.dataset.rename; })[0];
      if (!section) { return; }
      var value = rename.value.trim();
      if (!value) { rename.value = section.label; announce("A section needs a name. Nothing changed."); return; }
      section.label = value;
      announce("Section renamed to " + value + ".");
      renderSections();
    }
  });

  /* ---------------------------------------------------------------- keywords */

  function renderKeywords(quiet) {
    var host = $("#keyword-groups");
    host.innerHTML = "";
    var groups = {};
    state.terms.forEach(function (term) {
      if (term.removed) { return; }
      groups[term.group] = groups[term.group] || [];
      groups[term.group].push(term);
    });

    Object.keys(groups).forEach(function (name) {
      var block = document.createElement("section");
      block.className = "kw-group";
      block.innerHTML = "<h3>" + name + "</h3><ul class=\"kw-list\">" + groups[name].map(function (term) {
        var remove = term.missing
          ? ""
          : '<button type="button" data-remove-term="' + term.term + '" aria-label="Remove ' + term.term +
            ' from the terms"><span aria-hidden="true">×</span></button>';
        var label = term.added ? " <em>(added by you)</em>" : "";
        var count = term.missing ? "not present" : term.count + " mention" + (term.count === 1 ? "" : "s");
        return '<li class="kw' + (term.missing ? " kw-missing" : "") + '">' +
          '<span class="kw-name">' + term.term + label + "</span>" +
          '<span class="kw-count">' + count + "</span>" + remove +
          '<span class="kw-where">Found in: ' + term.where + "</span></li>";
      }).join("") + "</ul>";
      host.appendChild(block);
    });
    if (!quiet) {
      announce(state.terms.filter(function (t) { return !t.removed; }).length + " terms in use.");
    }
  }

  $("#keyword-groups").addEventListener("click", function (event) {
    var remove = event.target.closest("[data-remove-term]");
    if (!remove) { return; }
    var term = state.terms.filter(function (t) { return t.term === remove.dataset.removeTerm; })[0];
    if (term) {
      term.removed = true;
      renderKeywords();
      announce(term.term + " removed from the terms. It will not be used in a match.");
    }
  });

  $("#add-term-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var input = $("#new-term");
    var value = input.value.trim();
    if (!value) { input.focus(); return; }
    if (state.terms.some(function (t) { return !t.removed && t.term.toLowerCase() === value.toLowerCase(); })) {
      announce(value + " is already in the list.");
      input.select();
      return;
    }
    state.terms.push({ term: value, count: 1, where: "added by you, not found in the file",
                       group: "Added by you", missing: false, added: true, removed: false });
    input.value = "";
    renderKeywords();
    announce(value + " added by you. It is labelled as yours, not as something the system found.");
  });

  /* ---------------------------------------------------------------- matches */

  function listingGaps(listing) {
    return listing.requirements.filter(function (r) { return !r.evidence && r.must; });
  }

  function renderMatches() {
    var filter = $("#filter-reason").value;
    var query = $("#filter-search").value.trim().toLowerCase();
    var list = $("#match-list");
    list.innerHTML = "";

    var shown = DATA.listings.filter(function (listing) {
      if (query && (listing.title + " " + listing.company).toLowerCase().indexOf(query) === -1) { return false; }
      if (filter === "gaps") { return listingGaps(listing).length > 0; }
      if (filter === "five") { return listing.matched.length >= 5; }
      if (filter === "nine") { return listing.matched.length >= 9; }
      return true;
    });

    $("#match-empty").hidden = shown.length > 0;
    $("#result-count").textContent = shown.length + " listing" + (shown.length === 1 ? "" : "s") + " shown of " + DATA.listings.length + ".";

    shown.forEach(function (listing) {
      var gaps = listingGaps(listing);
      var item = document.createElement("li");
      item.className = "card";
      item.innerHTML =
        '<div class="card-head"><div><span class="card-title">' + listing.title + "</span>" +
        '<span class="hint"> · ' + listing.company + "</span></div>" +
        '<span class="score">' + listing.score + "% match</span></div>" +
        '<div class="row" style="margin:8px 0 0">' +
        '<span class="chip chip-neutral">' + listing.matched.length + " shared terms</span>" +
        '<span class="chip chip-neutral">' + listing.missing.length + " missing</span>" +
        (gaps.length ? '<span class="chip chip-low"><span aria-hidden="true">!</span> ' + gaps.length +
          " must-have gap" + (gaps.length === 1 ? "" : "s") + "</span>" : "") +
        "</div>" +
        '<p class="muted" style="margin-top:10px">' + listing.reason + "</p>" +
        '<div class="card-actions">' +
        '<button type="button" class="button" data-why="' + listing.id + '" aria-expanded="false" aria-controls="why-' +
        listing.id + '">Why this match</button>' +
        '<button type="button" class="button button-primary" data-choose="' + listing.id + '">Open this listing</button>' +
        "</div>" +
        '<div class="why" id="why-' + listing.id + '" hidden>' +
        "<h4>Terms this resume shares</h4>" +
        '<ul class="term-list">' + (listing.matched.length
          ? listing.matched.map(function (t) { return '<li class="term term-yes"><span aria-hidden="true">✓</span>' + t + "</li>"; }).join("")
          : '<li class="term term-no">none</li>') + "</ul>" +
        "<h4>Terms it asks for and the resume does not show</h4>" +
        '<ul class="term-list">' + (listing.missing.length
          ? listing.missing.map(function (t) { return '<li class="term term-no">' + t + "</li>"; }).join("")
          : '<li class="term term-no">nothing missing</li>') + "</ul>" +
        "</div>";
      list.appendChild(item);
    });
  }

  $("#match-list").addEventListener("click", function (event) {
    var why = event.target.closest("[data-why]");
    if (why) {
      var panel = $("#why-" + why.dataset.why);
      var open = panel.hidden;
      panel.hidden = !open;
      why.setAttribute("aria-expanded", String(open));
      why.textContent = open ? "Hide the reason" : "Why this match";
      return;
    }
    var choose = event.target.closest("[data-choose]");
    if (choose) {
      state.selectedListing = choose.dataset.choose;
      state.gapDecisions = {};
      renderRequirements();
      goTo("05");
    }
  });

  $("#filter-reason").addEventListener("change", renderMatches);
  $("#filter-search").addEventListener("input", renderMatches);
  $("#widen-search").addEventListener("click", function () {
    $("#filter-reason").value = "all";
    $("#filter-search").value = "";
    renderMatches();
    announce("Filter cleared. " + DATA.listings.length + " listings are shown again.");
  });

  /* ---------------------------------------------------------------- requirements */

  function renderRequirements() {
    var listing = DATA.listings.filter(function (l) { return l.id === state.selectedListing; })[0];
    $("#listing-header").innerHTML =
      "<p><strong>" + listing.title + "</strong> — " + listing.company + "</p>" +
      '<p class="muted">' + listing.score + "% of this listing's terms appear in the resume. " +
      listing.matched.length + " shared, " + listing.missing.length + " missing.</p>" +
      '<p class="hint">Requirement set shown exactly as the listing states it. Synthetic listing.</p>';

    var host = $("#requirement-list");
    host.innerHTML = "";
    listing.requirements.forEach(function (req) {
      var item = document.createElement("li");
      var evidenced = !!req.evidence && req.evidence !== "not present";
      item.className = "req " + (evidenced ? "req-evidenced" : "req-gap");
      var decision = state.gapDecisions[req.id];
      item.innerHTML =
        '<span class="req-mark" aria-hidden="true">' + (evidenced ? "✓" : "!") + "</span>" +
        '<div><span class="req-text">' + req.text + "</span>" +
        '<p class="req-meta">' + (evidenced
          ? "Evidenced — " + req.evidence
          : "No evidence in your resume for " + req.term + ". " + (req.must ? "This is a must-have." : "This is nice-to-have.")) +
        "</p>" + (evidenced ? "" : "" ) +
        "</div>" +
        (evidenced ? "" :
          '<div class="req-decisions"><fieldset><legend>Your decision for ' + req.term + "</legend>" +
          ["leave_out", "add_later", "dismiss"].map(function (value) {
            var label = value === "leave_out" ? "Leave it out" : value === "add_later" ? "Add it later myself" : "Dismiss as not relevant";
            return '<label class="radio"><input type="radio" name="gap-' + req.id + '" value="' + value + '"' +
              (decision === value ? " checked" : "") + " data-gap=\"" + req.id + "\"> " + label + "</label>";
          }).join("") + "</fieldset></div>");
      host.appendChild(item);
    });

    updateGapSummary();
  }

  function updateGapSummary() {
    var listing = DATA.listings.filter(function (l) { return l.id === state.selectedListing; })[0];
    var gaps = listing.requirements.filter(function (r) { return !r.evidence || r.evidence === "not present"; });
    if (!gaps.length) {
      $("#gap-summary").textContent = "Every requirement has evidence in your resume. Nothing to decide.";
      $("#gap-summary").className = "hint";
      return;
    }
    var decided = gaps.filter(function (g) { return !!state.gapDecisions[g.id]; }).length;
    var musts = gaps.filter(function (g) { return g.must; }).length;
    var left = gaps.length - decided;
    $("#gap-summary").textContent = gaps.length + " gap" + (gaps.length === 1 ? "" : "s") + " (" + musts +
      " must-have). " + (left ? left + " still without a decision." : "Every gap has a decision.");
    $("#gap-summary").className = left ? "hint" : "hint";
  }

  $("#requirement-list").addEventListener("change", function (event) {
    var radio = event.target.closest("[data-gap]");
    if (!radio) { return; }
    state.gapDecisions[radio.dataset.gap] = radio.value;
    updateGapSummary();
    announce("Decision recorded: " + radio.value.replace("_", " ") + ".");
  });

  $("#to-tailoring").addEventListener("click", function () {
    var listing = DATA.listings.filter(function (l) { return l.id === state.selectedListing; })[0];
    var gaps = listing.requirements.filter(function (r) { return !r.evidence || r.evidence === "not present"; });
    var undecided = gaps.filter(function (g) { return !state.gapDecisions[g.id]; });
    if (undecided.length) {
      announce(undecided.length + " gap still needs a decision before the review can start.");
      var first = $('[data-gap="' + undecided[0].id + '"]');
      if (first) { first.focus(); }
      $("#gap-summary").textContent = undecided.length + " gap" + (undecided.length === 1 ? "" : "s") +
        " still without a decision. Decide each one, then continue.";
      $("#gap-summary").className = "fix";
      return;
    }
    goTo("06");
  });

  /* ---------------------------------------------------------------- tailoring */

  function startTailoring() {
    $("#tailor-idle").hidden = true;
    $("#tailor-cancelled").hidden = true;
    $("#tailor-review").hidden = true;
    $("#tailor-progress").hidden = false;
    state.tailorStage = 0;
    var stages = DATA.stages.tailor;
    $("#tailor-stage").textContent = stages[0];
    announce("Generating proposals. " + stages[0] + " The duration is not known in advance.");

    state.tailorTimer = window.setInterval(function () {
      state.tailorStage += 1;
      if (state.tailorStage < stages.length) {
        $("#tailor-stage").textContent = stages[state.tailorStage];
        announce(stages[state.tailorStage]);
        return;
      }
      window.clearInterval(state.tailorTimer);
      state.tailorTimer = null;
      finishTailoring();
    }, 700);
  }

  function finishTailoring() {
    state.generated = true;
    $("#tailor-progress").hidden = true;
    $("#tailor-review").hidden = false;
    renderChanges();
    announce(state.changes.length + " proposals ready. Nothing has been applied.");
  }

  function renderChanges() {
    var host = $("#change-list");
    host.innerHTML = "";
    state.changes.forEach(function (change) {
      var item = document.createElement("li");
      item.className = "card";
      var decided = change.decision;
      var proposed = change.edited || change.after;
      var tag = decided === "accepted"
        ? '<span class="decision-tag decision-accepted">✓ Accepted</span>'
        : decided === "rejected"
          ? '<span class="decision-tag decision-rejected">✕ Rejected</span>'
          : '<span class="decision-tag decision-pending">! Not reviewed</span>';

      item.innerHTML =
        '<div class="card-head"><div><span class="card-title">' + change.id + " · " + change.kind + "</span>" +
        '<span class="hint"> · ' + change.location + "</span></div><div>" + tag + "</div></div>" +
        '<div class="card-body">' +
        '<span class="change-label">Before — from your resume</span>' +
        '<pre class="change-before">' + change.before + "</pre>" +
        '<span class="change-label">Proposed' + (change.edited ? " (edited by you)" : "") + "</span>" +
        '<pre class="change-after">' + proposed + "</pre>" +
        '<p class="muted">' + change.reason + "</p>" +
        '<p class="hint">Source: ' + change.span + "</p>" +
        (change.planted
          ? '<div class="panel panel-warn"><p class="status-line"><span class="status-icon" aria-hidden="true">!</span>' +
            "<strong>A proposal the check cannot catch.</strong></p>" +
            '<p class="muted">Its kind, <code>drop_qualifier</code>, is not one of the five the notebook permits — that is the point. ' +
            "It deletes the word “(basic)” from your own description of TypeScript, and the integrity test compares " +
            "tokens, so a deleted qualifier leaves nothing new for it to find. Reject it, or accept it knowingly.</p></div>"
          : "") +
        "</div>" +
        '<div class="card-actions">' +
        '<button type="button" class="button button-primary" data-accept="' + change.id + '">Accept</button>' +
        '<button type="button" class="button" data-reject="' + change.id + '">Reject</button>' +
        '<button type="button" class="button button-quiet" data-edit="' + change.id + '">Edit the wording</button>' +
        "</div>" +
        '<div data-edit-panel="' + change.id + '" hidden style="margin-top:12px">' +
        '<label for="edit-' + change.id + '">Your version of this text</label>' +
        '<textarea class="edit-area" id="edit-' + change.id + '" data-edit-text="' + change.id + '">' + proposed + "</textarea>" +
        '<p class="hint">Text you write here is yours. The integrity check covers the proposals, not your own edits.</p>' +
        '<div class="row"><button type="button" class="button button-primary" data-edit-save="' + change.id + '">Save my wording and accept</button>' +
        '<button type="button" class="button button-quiet" data-edit-cancel="' + change.id + '">Cancel the edit</button></div>' +
        "</div>";
      host.appendChild(item);
    });
    updateCounter();
  }

  function updateCounter() {
    var reviewed = state.changes.filter(function (c) { return !!c.decision; }).length;
    $("#review-counter").textContent = reviewed + " of " + state.changes.length + " reviewed" +
      (reviewed < state.changes.length ? " — " + (state.changes.length - reviewed) + " still unreviewed" : " — all reviewed");
  }

  function decide(id, decision) {
    var change = state.changes.filter(function (c) { return c.id === id; })[0];
    if (!change) { return; }
    state.history.push({ id: id, previous: change.decision, previousEdit: change.edited });
    change.decision = decision;
    renderChanges();
    announce(change.id + " " + (decision === "accepted" ? "accepted" : "rejected") + ".");
  }

  $("#change-list").addEventListener("click", function (event) {
    var accept = event.target.closest("[data-accept]");
    if (accept) { decide(accept.dataset.accept, "accepted"); return; }
    var reject = event.target.closest("[data-reject]");
    if (reject) { decide(reject.dataset.reject, "rejected"); return; }

    var edit = event.target.closest("[data-edit]");
    if (edit) {
      var panel = $('[data-edit-panel="' + edit.dataset.edit + '"]');
      panel.hidden = false;
      var field = $('[data-edit-text="' + edit.dataset.edit + '"]');
      if (field) { field.focus(); }
      return;
    }
    var cancel = event.target.closest("[data-edit-cancel]");
    if (cancel) {
      $('[data-edit-panel="' + cancel.dataset.editCancel + '"]').hidden = true;
      return;
    }
    var save = event.target.closest("[data-edit-save]");
    if (save) {
      var id = save.dataset.editSave;
      var text = $('[data-edit-text="' + id + '"]').value;
      var change = state.changes.filter(function (c) { return c.id === id; })[0];
      state.history.push({ id: id, previous: change.decision, previousEdit: change.edited });
      change.edited = text;
      change.decision = "accepted";
      renderChanges();
      announce(change.id + " edited by you and accepted. Your wording is now the proposal.");
    }
  });

  $("#generate").addEventListener("click", startTailoring);
  $("#resume-tailor").addEventListener("click", startTailoring);
  $("#cancel-tailor").addEventListener("click", function () {
    if (state.tailorTimer) { window.clearInterval(state.tailorTimer); state.tailorTimer = null; }
    $("#tailor-progress").hidden = true;
    $("#tailor-cancelled").hidden = false;
    announce("Generation cancelled. No proposals were kept.");
  });

  /* ---------------------------------------------------------------- result */

  /* A change belongs to a section by key, not by the name a person may have typed over. */
  function belongsTo(change, section) {
    if (change.sectionKey && section.key) { return change.sectionKey === section.key; }
    return change.section === section.label;
  }

  function acceptedFor(section) {
    return state.changes.filter(function (change) {
      return change.decision === "accepted" && belongsTo(change, section);
    });
  }

  function proposedTextFor(section) {
    var text = section.lines.join("\n");
    var order = { surface: 0, rephrase: 1, label: 1, rebuild_summary: 2 };
    var unapplied = [];
    var changes = acceptedFor(section).slice().sort(function (a, b) {
      return (order[a.kind] || 0) - (order[b.kind] || 0);
    });
    changes.forEach(function (change) {
      if (text.indexOf(change.before) === -1) { unapplied.push(change.id); return; }
      text = text.replace(change.before, change.edited || change.after);
    });
    return { text: text, unapplied: unapplied };
  }

  function renderResult() {
    var host = $("#compare");
    host.innerHTML = "";
    state.sections.forEach(function (section) {
      var original = section.lines.join("\n") || "(empty)";
      var proposed = proposedTextFor(section);
      var text = proposed.text || "(empty)";
      var accepted = acceptedFor(section).length;
      var rejected = state.changes.filter(function (c) {
        return c.decision === "rejected" && belongsTo(c, section);
      }).length;
      var tag = accepted ? '<span class="tag tag-changed">changed</span>'
        : rejected ? '<span class="tag tag-skipped">rejected</span>'
          : '<span class="tag tag-kept">unchanged</span>';

      var row = document.createElement("div");
      row.className = "compare-row";
      row.innerHTML =
        '<div class="compare-head"><strong>' + section.label + "</strong>" + tag + "</div>" +
        '<div class="compare-body">' +
        '<div class="compare-cell"><h4>Original</h4>' + original + "</div>" +
        '<div class="compare-cell"><h4>Proposed</h4>' + text +
        (proposed.unapplied.length
          ? '<p class="fix">' + proposed.unapplied.length + " accepted change(s) could not be applied: " +
            proposed.unapplied.join(", ") + ". The section text was edited after the proposal was made, " +
            "so this column shows the section without it. The ledger still records the decision.</p>"
          : "") +
        "</div></div>";
      host.appendChild(row);
    });

    var body = $("#ledger-body");
    body.innerHTML = "";
    state.changes.forEach(function (change) {
      var tr = document.createElement("tr");
      var decision = change.decision === "accepted" ? "Accepted"
        : change.decision === "rejected" ? "Rejected" : "Not reviewed";
      tr.innerHTML = "<td>" + change.id + "</td><td>" + change.kind + "</td><td>" + change.location +
        "</td><td>" + decision + "</td><td>" + change.reason + "</td><td>" + change.span + "</td>";
      body.appendChild(tr);
    });
  }

  function buildResumeMarkdown() {
    var listing = DATA.listings.filter(function (l) { return l.id === state.selectedListing; })[0];
    var parts = [
      "# Tailored resume — SYNTHETIC",
      "",
      "<!-- " + DATA.meta.byline + ". -->",
      "<!-- Written by the Tailor interface mockup from synthetic data. -->",
      "<!-- Downloaded to the device that ran this page. Nothing was sent anywhere. -->",
      "",
      "Target listing: " + listing.title + " at " + listing.company + " (synthetic)",
      ""
    ];
    var unapplied = [];
    state.sections.forEach(function (section) {
      var result = proposedTextFor(section);
      if (result.unapplied.length) { unapplied = unapplied.concat(result.unapplied); }
      if (!result.text.trim()) { return; }
      parts.push("## " + section.label.toUpperCase(), "", result.text.trim(), "");
    });
    if (unapplied.length) {
      parts.push("<!-- Accepted but not applied, because the section text was edited after the proposal: " +
        unapplied.join(", ") + " -->");
    }
    var rejected = state.changes.filter(function (c) { return c.decision === "rejected"; });
    if (rejected.length) {
      parts.push("<!-- Rejected proposals, kept here as a record: " +
        rejected.map(function (c) { return c.id; }).join(", ") + " -->");
    }
    return parts.join("\n");
  }

  function buildLedgerCsv() {
    var rows = [["id", "kind", "location", "decision", "reason", "source", "before", "after"]];
    state.changes.forEach(function (change) {
      rows.push([change.id, change.kind, change.location, change.decision || "not_reviewed",
                 change.reason, change.span, change.before, change.edited || change.after]);
    });
    return rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
  }

  $("#export-md").addEventListener("click", function () {
    try {
      var size = download("tailored-resume-SYNTHETIC.md", buildResumeMarkdown(), "text/markdown");
      $("#export-status").hidden = false;
      $("#export-failed").hidden = true;
      $("#export-detail").textContent = "tailored-resume-SYNTHETIC.md · " + size + " bytes · " +
        state.changes.filter(function (c) { return c.decision === "accepted"; }).length +
        " accepted change(s) · " + state.changes.filter(function (c) { return c.decision === "rejected"; }).length +
        " rejected.";
      announce("Downloaded to your device. Nothing was sent anywhere.");
    } catch (error) {
      $("#export-failed").hidden = false;
      $("#export-status").hidden = true;
      announce("The download did not start. Allow downloads for this page and try again.");
    }
  });

  $("#export-csv").addEventListener("click", function () {
    try {
      var size = download("change-ledger-SYNTHETIC.csv", buildLedgerCsv(), "text/csv");
      $("#export-status").hidden = false;
      $("#export-failed").hidden = true;
      $("#export-detail").textContent = "change-ledger-SYNTHETIC.csv · " + size + " bytes · every proposal, its decision, and its source.";
      announce("Ledger downloaded. Nothing was sent anywhere.");
    } catch (error) {
      $("#export-failed").hidden = false;
      $("#export-status").hidden = true;
    }
  });

  $("#undo-change").addEventListener("click", function () {
    var last = state.history.pop();
    if (!last) { announce("There is nothing to undo yet."); return; }
    var change = state.changes.filter(function (c) { return c.id === last.id; })[0];
    change.decision = last.previous;
    change.edited = last.previousEdit;
    renderChanges();
    renderResult();
    announce("Undid the last decision on " + last.id + ". It is awaiting review again.");
  });

  $("#start-over").addEventListener("click", function () {
    state.sections = clone(DATA.resume.sections);
    state.discarded = [];
    state.unclassified = clone(DATA.resume.unclassified);
    state.terms = flattenTerms();
    state.gapDecisions = {};
    state.changes = clone(DATA.changes).map(function (c) { c.decision = null; c.edited = null; return c; });
    state.history = [];
    state.generated = false;
    state.selectedListing = "J01";
    $("#export-status").hidden = true;
    $("#export-failed").hidden = true;
    $("#tailor-review").hidden = true;
    $("#tailor-idle").hidden = false;
    $("#tailor-progress").hidden = true;
    $("#tailor-cancelled").hidden = true;
    resetUploadPanels();
    $("#file-input").value = "";
    $("#file-hint").textContent = "No file chosen yet.";
    renderSections();
    renderKeywords(true);
    renderMatches();
    renderRequirements();
    goTo("01");
    announce("Started over. Nothing was kept from the previous session.");
  });

  /* ---------------------------------------------------------------- upload wiring */

  $("#file-input").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (file) { readFile(file); }
  });

  var dropzone = $("#dropzone");
  ["dragenter", "dragover"].forEach(function (name) {
    dropzone.addEventListener(name, function (event) {
      event.preventDefault();
      dropzone.classList.add("is-over");
    });
  });
  ["dragleave", "drop"].forEach(function (name) {
    dropzone.addEventListener(name, function (event) {
      event.preventDefault();
      if (name === "dragleave") { dropzone.classList.remove("is-over"); }
    });
  });
  dropzone.addEventListener("drop", function (event) {
    dropzone.classList.remove("is-over");
    var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) { readFile(file); }
  });

  $("#use-sample").addEventListener("click", function () {
    state.parsedText = DATA.resume.sections.map(function (section) {
      return (section.heading || section.label.toUpperCase()) + "\n" + section.lines.join("\n");
    }).join("\n\n");
    state.parsedName = DATA.resume.file;
    $("#file-hint").textContent = "Using the synthetic sample: " + DATA.resume.file;
    startParse(state.parsedText, DATA.resume.file);
  });

  $("#cancel-parse").addEventListener("click", function () {
    if (state.parseTimer) { window.clearInterval(state.parseTimer); state.parseTimer = null; }
    $("#upload-progress").hidden = true;
    $("#upload-cancelled").hidden = false;
    announce("Parsing cancelled. The file was not kept.");
  });

  $("#resume-parse").addEventListener("click", function () {
    $("#upload-cancelled").hidden = true;
    startParse(state.parsedText || "", state.parsedName || DATA.resume.file);
  });

  /* ---------------------------------------------------------------- dev panel */

  var FORCED_TARGETS = {
    "01": { processing: "upload-progress", success: "upload-done", failed: "upload-error", cancelled: "upload-cancelled" },
    "06": { processing: "tailor-progress", success: "tailor-review", failed: null, cancelled: "tailor-cancelled" },
    "07": { processing: null, success: "export-status", failed: "export-failed", cancelled: null }
  };

  function clearForced() {
    $$(".state-banner").forEach(function (banner) { banner.remove(); });
    state.forcedPanels.forEach(function (panel) { panel.remove(); });
    state.forcedPanels = [];
    document.body.dataset.demoState = "";
    state.forced = null;
    $("#forced-note").hidden = true;
  }

  function primaryControl(screen) {
    return $(".button-primary", screen) || $("button", screen) || $("input", screen);
  }

  function forceState(screenId, which) {
    clearForced();
    var screen = $("#screen-" + screenId);
    if (!screen) { return; }
    state.forced = which;
    document.body.dataset.demoState = which;
    var notes = (DATA.devStates[screenId] || {});
    var IDLE_NOTE = "The screen as it looks before anyone acts. No status is implied.";
    var message = which === "idle" ? IDLE_NOTE
      : (notes[which] || "No example text is defined for this state on this screen.");

    var banner = document.createElement("div");
    banner.className = "state-banner";
    banner.setAttribute("role", "status");
    banner.innerHTML = "FORCED STATE: " + which + " — screen " + screenId +
      "<span>" + message + "</span>";
    screen.insertBefore(banner, screen.firstChild.nextSibling);

    if (which === "idle") { return; }
    if (which === "focused") {
      var control = primaryControl(screen);
      if (control) { control.focus(); }
      announce("Focus moved to the main control of screen " + screenId + ".");
      return;
    }
    if (which === "pressed") {
      var pressed = primaryControl(screen);
      if (pressed) {
        pressed.classList.add("is-pressed");
        window.setTimeout(function () { pressed.classList.remove("is-pressed"); }, 1400);
      }
      return;
    }

    var targets = FORCED_TARGETS[screenId] || {};
    var targetId = targets[which];
    if (targetId) {
      var panel = $("#" + targetId);
      if (panel) {
        panel.hidden = false;
        if (panel.hasAttribute("data-was-hidden")) { panel.removeAttribute("data-was-hidden"); }
        if (which === "failed" && targetId === "upload-error") {
          $("#upload-error-message").textContent = "The file could not be read. It is a scan with no text layer.";
          $("#upload-error-fix").textContent = "Next action: copy the text out of the PDF into a .md file, then choose it again.";
        }
        if (which === "success" && targetId === "tailor-review") { renderChanges(); }
      }
      return;
    }

    var generic = document.createElement("div");
    generic.className = which === "failed" ? "panel panel-error" : which === "success" ? "panel panel-success" : "panel panel-plain";
    generic.innerHTML =
      '<p class="status-line"><span class="status-icon" aria-hidden="true">' +
      (which === "failed" ? "!" : which === "success" ? "✓" : which === "cancelled" ? "■" : "◐") +
      "</span><strong>" + message + "</strong></p>" +
      '<p class="muted">' + (which === "failed"
        ? "Nothing you entered was lost. The next action is named above."
        : "This panel exists so the state can be inspected without editing code.") + "</p>";
    screen.appendChild(generic);
    state.forcedPanels.push(generic);
    announce("Forced state " + which + " on screen " + screenId + ". " + message);
  }

  $$("[data-force]").forEach(function (button) {
    button.addEventListener("click", function () {
      forceState($("#dev-screen").value, button.dataset.force);
      $("#forced-note").hidden = false;
      $("#forced-note").textContent = "Forcing " + button.dataset.force + " on screen " + $("#dev-screen").value + ".";
    });
  });

  $("#dev-screen").addEventListener("change", function (event) {
    goTo(event.target.value);
  });

  $("#dev-toggle").addEventListener("click", function (event) {
    var panel = $("#dev-panel");
    var collapsed = panel.dataset.collapsed === "true";
    panel.dataset.collapsed = collapsed ? "false" : "true";
    event.target.setAttribute("aria-expanded", String(collapsed));
    event.target.textContent = collapsed ? "Hide" : "Show";
  });

  /* ---------------------------------------------------------------- boot */

  $$(".step").forEach(function (button) {
    button.addEventListener("click", function () { goTo(button.dataset.goto); });
  });

  renderSections();
  renderKeywords(true);
  renderMatches();
  renderRequirements();
  renderChanges();
  goTo("01", { silent: true });
  $("#h-01").focus();
})();
