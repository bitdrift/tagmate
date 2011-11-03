/**
 * jquery.tagmate.js
 * =================
 * Copyright (c) 2011 Cold Brew Labs Inc., http://coldbrewlabs.com
 * Licenced under MIT (see included LICENSE)
 *
 * Requirements
 * ------------
 * jquery.js (http://jquery.com)
 * jquery.scrollTo.js (http://demos.flesler.com/jquery/scrollTo/)
 * jquery.fieldselection.js - (included)
 */

//
// Global namespace stuff. These are provided as a convenience to plugin users.
//
var Tagmate = (function() { 
    var HASH_TAG_EXPR = "\\w+";
    var NAME_TAG_EXPR = "\\w+(?: \\w+)*"; // allow spaces
    var PRICE_TAG_EXPR = "(?:(?:\\d{1,3}(?:\\,\\d{3})+)|(?:\\d+))(?:\\.\\d{2})?";

    return {
        HASH_TAG_EXPR: HASH_TAG_EXPR,
        NAME_TAG_EXPR: NAME_TAG_EXPR,
        PRICE_TAG_EXPR: PRICE_TAG_EXPR,

        DEFAULT_EXPRS: {
            '@': NAME_TAG_EXPR,
            '#': HASH_TAG_EXPR,
            '$': PRICE_TAG_EXPR
        },

        // Remove options that don't match the filter.
        filterOptions: function(options, term) {
            var filtered = [];
            for (var i = 0; i < options.length; i++) {
                var label_lc = options[i].label.toLowerCase();
                var term_lc = term.toLowerCase();
                if (term_lc.length <= label_lc.length && label_lc.indexOf(term_lc) == 0)
                    filtered.push(options[i]);
            }
            return filtered;
        }
    };
})();

//
// jQuery plugin
//
(function($) {
    // Similar to indexOf() but uses RegExp.
    function regex_index_of(str, regex, startpos) {
        var indexOf = str.substring(startpos || 0).search(regex);
        return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
    }
    
    // Escape special RegExp chars.
    function regex_escape(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    // Parse tags from a textarea (internal).
    function parse_tags(textarea, exprs, sources) {        
        var tags = {};
        for (tok in exprs) {
            if (sources && sources[tok]) {
                // Favor sources to raw tags if available
                var matches = {}, indexes = {};
                for (key in sources[tok]) {
                    var value = sources[tok][key].value;
                    var label = sources[tok][key].label;
                    var tag = regex_escape(tok + label);
                    // This regexp is insane. \b won't work because we allow spaces.
                    var e = ["(?:^(",")$|^(",")\\W|\\W(",")\\W|\\W(",")$)"].join(tag);
                    var i = 0, re = new RegExp(e, "gm");
                    while ((i = regex_index_of(textarea.val(), re, i)) > -1) {
                        var p = indexes[i] ? indexes[i] : null;
                        // Favor longer matches
                        if (!p || matches[p].length < label.length)
                            indexes[i] = value;
                        matches[value] = label;
                        i += label.length + 1;
                    }
                }
                // Keep only longest matches
                for (i in indexes)
                    tags[tok + indexes[i]] = tok;
            } else {
                // Check for raw tags
                var m = null, re = new RegExp("([" + tok + "]" + exprs[tok] + ")", "gm");
                while (m = re.exec(textarea.val()))
                    tags[m[1]] = tok;
            }
        }

        // Keep only uniques
        var results = []
        for (tag in tags)
            results.push(tag);
        return results;
    }

    $.fn.extend({
        getTags: function(exprs, sources) {
            var textarea = $(this);
            exprs = exprs || textarea.data("_tagmate_exprs");
            sources = sources || textarea.data("_tagmate_sources");
            return parse_tags(textarea, exprs, sources);
        },
        tagmate: function(options) {
            var defaults = {
                exprs: Tagmate.DEFAULT_EXPRS,
                sources: null, // { '@': [{label:'foo',value:'bar'}] }
                capture_tag: null, // Callback fired when tags are captured. function(tag) {}
                replace_tag: null, // Callback fired when tag is replaced. function(tag, label) {}
                menu_class: "tagmate-menu",
                menu_option_class: "tagmate-menu-option",
                menu_option_active_class: "tagmate-menu-option-active",
                highlight_tags: false, // EXPERIMENTAL: enable at your own risk!
                highlight_class: 'tagmate-highlight'
            };

            // Get the previous position of tok starting at pos (or -1)
            function prev_tok(str, tok, pos) {
                var re = new RegExp("[" + tok + "]");
                for (; pos >= 0 && !re.test(str[pos]); pos--) {};
                return pos;
            }

            // Get tag value at current cursor position
            function parse_tag(textarea) {
                var text = textarea.val();
                var sel = textarea.getSelection();

                // Search left for closest matching tag token
                var m_pos = -1, m_tok = null;
                for (tok in defaults.exprs) {
                    var pos = prev_tok(text, tok, sel.start);
                    if (pos > m_pos) {
                        m_pos = pos;
                        m_tok = tok;
                    }
                }

                // Match from token to cursor
                var sub = text.substring(m_pos + 1, sel.start);

                // Look for raw matches
                var re = new RegExp("^[" + m_tok + "]" + defaults.exprs[m_tok]);
                if (re.exec(m_tok + sub))
                    return m_tok + sub

                return null;
            }

            // Replace the textarea query text with the suggestion
            function replace_tag(textarea, tag, value) {
                var text = textarea.val();

                // Replace occurrence at cursor position
                var sel = textarea.getSelection();
                var pos = prev_tok(text, tag[0], sel.start);
                var l = text.substr(0, pos);
                var r = text.substr(pos + tag.length);
                textarea.val(l + tag[0] + value + r);

                // Try to move cursor position at end of tag
                var sel_pos = pos + value.length + 1;
                textarea.setSelection(sel_pos, sel_pos);

                // Callback for tag replacement
                if (defaults.replace_tag)
                    defaults.replace_tag(tag, value);
            }

            // Show the menu of options
            function update_menu(menu, options) {
                // Sort results alphabetically
                options = options.sort(function(a, b) {
                    var a_lc = a.label.toLowerCase();
                    var b_lc = b.label.toLowerCase();
                    if (a_lc > b_lc)
                        return 1;
                    else if (a_lc < b_lc)
                        return -1;
                    return 0;
                });

                // Append results to menu
                for (var i = 0; i < options.length; i++) {
                    var label = options[i].label;
                    var value = options[i].value;
                    var image = options[i].image;
                    if (i == 0)
                        menu.html("");
                    var content = "<span>" + label + "</span>";
                    if (image)
                        content = "<img src='" + image + "' alt='" + label + "'/>" + content;
                    var classes = defaults.menu_option_class;
                    if (i == 0)
                        classes += " " + defaults.menu_option_active_class;
                    menu.append("<div class='" + classes + "'>" + content + "</div>");
                }
            }

            // Move up or down in the selection menu
            function scroll_menu(menu, direction) {
                var child_selector = direction == "down" ? ":first-child" : ":last-child";
                var sibling_func = direction == "down" ? "next" : "prev";
                var active = menu.children("." + defaults.menu_option_active_class);

                if (active.length == 0) {
                    active = menu.children(child_selector);
                    active.addClass(defaults.menu_option_active_class);
                } else {
                    active.removeClass(defaults.menu_option_active_class);
                    active = active[sibling_func]().length > 0 ? active[sibling_func]() : active;
                    active.addClass(defaults.menu_option_active_class);
                }

                // Scroll inside menu if necessary
                var i, options = menu.children();
                var n = Math.floor($(menu).height() / $(options[0]).height()) - 1;
                if ($(menu).height() % $(options[0]).height() > 0)
                    n -= 1; // don't scroll if bottom row is only partially visible 
                // Iterate to visible option
                for (i = 0; i < options.length && $(options[i]).html() != $(active).html(); i++) {};
                if (i > n && (i - n) >= 0 && (i - n) < options.length)
                    menu.scrollTo(options[i - n]);
            }

            // TODO: Fix this so that it works.
            function init_hiliter(textarea) {
                textarea.css("background", "transparent");

                var container = $(textarea).wrap("<div class='tagmate-container'/>");

                // Set up highlighter div
                var hiliter = $("<pre class='tagmate-hiliter'></pre>");
                hiliter.css("height", textarea.height() + "px");
                hiliter.css("width", textarea.width() + "px");
                hiliter.css("border", "1px solid #FFF");
                //hiliter.css("position", "inherit");
                //hiliter.css("top", "-" + textarea.outerHeight() + "px");
                hiliter.css("margin", "0");
                //hiliter.css("top", "0");
                //hiliter.css("left", "0");
                hiliter.css("padding-top", textarea.css("padding-top"));
                hiliter.css("padding-bottom", textarea.css("padding-bottom"));
                hiliter.css("padding-left", textarea.css("padding-left"));
                hiliter.css("padding-right", textarea.css("padding-right"));
                hiliter.css("color", "#FFF");
                hiliter.css("z-index", "-1");
                hiliter.css("background", "#FFF");
                hiliter.css("font-family", textarea.css("font-family"));
                hiliter.css("font-size", textarea.css("font-size"));

                // Enable text wrapping in <pre>
                hiliter.css("white-space", "pre-wrap");
                hiliter.css("white-space", "-moz-pre-wrap !important");
                hiliter.css("white-space", "-pre-wrap");
                hiliter.css("white-space", "-o-pre-wrap");
                hiliter.css("word-wrap", "break-word");

                textarea.before(hiliter);
                textarea.css("margin-top", "-" + textarea.outerHeight() + "px");

                return hiliter;
            }

            // TODO: Fix this so that it works.
            function update_hiliter(textarea, hiliter) {
                var html = textarea.val();
                var sources = textarea.data("_tagmate_sources");
                var tags = parse_tags(textarea, defaults.exprs, sources);

                for (var i = 0; i < tags.length; i++) {
                    var expr = tags[i], tok = tags[i][0], term = tags[i].substr(1);
                    if (sources && sources[tok]) {
                        for (var j = 0; j < sources[tok].length; j++) {
                            var option = sources[tok][j];
                            if (option.value == term) {
                                expr = tok + option.label;
                                break;
                            }
                        }
                    }

                    // Wrap tags in highlighter span
                    var re = new RegExp(regex_escape(expr), "g");
                    var span = "<span class='" + defaults.highlight_class + "'>" + expr + "</span>";
                    html = html.replace(re, span);
                }

                hiliter.html(html);
            }

            return this.each(function() {
                if (options)
                    $.extend(defaults, options);

                var textarea = $(this);

                // Optionally enable the hiliter
                var hiliter = null;
                if (defaults.highlight_tags)
                    hiliter = init_hiliter(textarea);

                textarea.data("_tagmate_exprs", defaults.exprs);

                // Initialize static lists of sources
                var sources_holder = {};
                for (var tok in defaults.sources)
                    sources_holder[tok] = [];
                textarea.data("_tagmate_sources", sources_holder);

                // Set up the menu
                var menu = $("<div class=" + defaults.menu_class + "></div>");
                textarea.after(menu);

                var pos = textarea.offset();
                menu.css("position", "absolute");
                menu.hide();

                // Activate menu and fire callbacks if cursor enters a tag
                function tag_check() {
                    menu.hide();

                    // Check for user tag
                    var tag = parse_tag(textarea);
                    if (tag) {
                        // Make sure cursor is within token
                        var tok = tag[0], term = tag.substr(1);
                        var sel = textarea.getSelection();
                        var pos = prev_tok(textarea.val(), tok, sel.start);
                        if ((sel.start - pos) <= tag.length) {
                            (function(done) {
                                if (typeof defaults.sources[tok] === 'object')
                                    done(Tagmate.filterOptions(defaults.sources[tok], term));
                                else if (typeof defaults.sources[tok] === 'function')
                                    defaults.sources[tok]({term:term}, done);
                                else if (typeof defaults.sources[tok] === 'string')
                                    $.getJSON(defaults.sources[tok], {term:term}, function(res) {
                                        done(res.options);
                                    });
                                else
                                    done();
                            })(function(options) {
                                if (options && options.length > 0) {
                                    // Update and show the menu
                                    update_menu(menu, options);
                                    menu.css("top", (textarea.outerHeight() - 1) + "px");
                                    menu.show();

                                    // Store for parse_tags()
                                    var _sources = textarea.data("_tagmate_sources");
                                    for (var i = 0; i < options.length; i++) {
                                        var found = false;
                                        for (var j = 0; !found && j < _sources[tok].length; j++)
                                            found = _sources[tok][j].value == options[i].value;
                                        if (!found)
                                            _sources[tok].push(options[i]);
                                    }
                                }

                                // Fire callback if available
                                if (tag && defaults.capture_tag)
                                    defaults.capture_tag(tag);
                            });
                        }
                    }
                }

                var ignore_keyup = false;

                // Check for tags on keyup, focus and click
                $(textarea)
                    .unbind('.tagmate')
                    .bind('focus.tagmate', function(e) {
                        tag_check();
                    })
                    .bind('blur.tagmate', function(e) {
                        // blur on textarea fires before mouse menu click
                        setTimeout(function() { menu.hide(); }, 300);
                    })
                    .bind('click.tagmate', function(e) {
                        tag_check();
                    })
                    .bind('keydown.tagmate', function(e) {
                        if (menu.is(":visible")) {
                            if (e.keyCode == 40) { // down
                                scroll_menu(menu, "down");
                                ignore_keyup = true;
                                return false;
                            } else if (e.keyCode == 38) { // up
                                scroll_menu(menu, "up");
                                ignore_keyup = true;
                                return false;
                            } else if (e.keyCode == 13) { // enter
                                var value = menu.children("." + defaults.menu_option_active_class).text();
                                var tag = parse_tag(textarea);
                                if (tag && value) {
                                    replace_tag(textarea, tag, value);
                                    menu.hide();
                                    ignore_keyup = true;
                                    return false;
                                }
                            } else if (e.keyCode == 27) { // escape
                                menu.hide();
                                ignore_keyup = true;
                                return false;
                            }
                        }
                    })
                    .bind('keyup.tagmate', function(e) {
                        if (ignore_keyup) {
                            ignore_keyup = false;
                            return true;
                        }
                        tag_check();

                        if (hiliter)
                            update_hiliter(textarea, hiliter);
                    });

                // Mouse menu activation
                //menu.find("." + defaults.menu_option_class) // Doesn't work
                $("." + defaults.menu_class + " ." + defaults.menu_option_class)
                    .die("click.tagmate")
                    .live("click.tagmate", function() {
                        var value = $(this).text();
                        var tag = parse_tag(textarea);
                        replace_tag(textarea, tag, value);
                        textarea.keyup();
                    });
            });
        }
    });
})(jQuery);