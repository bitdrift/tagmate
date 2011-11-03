TAGMATE!
========
A jQuery plugin for capturing tags within textareas (Facebook / Twitter style).


AUTHORS
-------
* Ryan Probasco <ryan@bitdrift.org>


FEATURES
--------
* Supports #hash tags, @name tags, and $price tags out of the box.
* Inline autocomplete similar to jQuery UI autocomplete plugin.
* reate custom tag parsing rules.
* *EXPERIMENTAL* inline tag higlighting mode.


REQUIRES
--------
- jquery.js (http://jquery.com)
- jquery.scrollTo.js (http://demos.flesler.com/jquery/scrollTo/)
- jquery.fieldselection.js (*must* use included version)


EXAMPLE
-------
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
    <script type="text/javascript" src="./jquery.fieldselection.js"></script>
    <script type="text/javascript" src="./jquery.scrollTo.js"></script>
    <script type="text/javascript" src="./jquery.tagmate.js"></script>
    <script type="text/javascript">
        $(function() {
            $("#myTextarea").tagmate();
            $("#myForm").submit(function() {
                var tags = $("#myTextarea").getTags();
                alert(tags);
                return false;
            });
        });
    </script>
    <form id="myForm">
        <textarea id="myTextarea"></textarea>
        <input type="submit"/>
    </form>


OPTIONS
-------
* `exprs` - Mapping of tag keys to regular expression rules.
  - Example: `{ '#': '\\w+' }`
  - Default: `Tagmate.DEFAULT_EXPRS`
* `sources` - Mapping of tag keys to autocomplete suggestions. Value can be an array 
  or a function.
  - Example: `{ '@': [{label:'Mr. Foo',value:'foo'}] }`
* `capture_tag` - Callback fired when tags are captured.
  - Example: `function(tag) { alert('Got tag: ' + tag); }`
* `replace_tag` - Callback fired when tag is replaced.
  - Example: `function(tag, label) { alert('replaced:' + tag + ' with: ' + label); }`
* `menu_class` - CSS class to add to the menu.
  - Default: "tagmate-menu".
* `menu_option_class` - CSS class to add to menu options.
  - Default: `"tagmate-menu-option"`
* `menu_option_active_class` - CSS class to use when menu option is active. 
  - Default: `"tagmate-menu-option-active"`
* `highlight_tags` - *EXPERIMENTAL!* Enable at your own risk! Highlights tags by 
  placing a div behind the transparent textarea.
  - Default: `false`
* `highlight_class` - CSS class to use for highlighted tags.
  - Default: `"tagmate-highlight"`

