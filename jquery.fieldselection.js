/*
 * jQuery plugin: fieldSelection - v0.1.0 - last change: 2006-12-16
 * (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd
 * 
 * NOTE: This version of the plugin has been heavily modified from its
 * original version here: https://github.com/localhost/jquery-fieldselection
 * for use with the Tagmate plugin here: https://github.com/pinterest/tagmate.
 * Some of the modifications (see setSelection()) were made specifically for
 * the Tagmate plugin, while others were made by an unknown author (authors?).
 *
 * 2011-10-28: Ryan Probasco <ryan@bitdrift.org> - added setSelection()
 */

(function() {
    var fieldSelection = {
        getSelection: function() {
            var e = this.jquery ? this[0] : this;
            
            return (
                /* mozilla / dom 3.0 */
                ('selectionStart' in e && function() {
                    var l = e.selectionEnd - e.selectionStart;
                    return {
                        start: e.selectionStart,
                        end: e.selectionEnd,
                        length: l,
                        text: e.value.substr(e.selectionStart, l)};
                })
                
                /* exploder */
                || (document.selection && function() {
                    e.focus();
                    
                    var r = document.selection.createRange();
                    if (r == null) {
                        return {
                            start: 0,
                            end: e.value.length,
                            length: 0};
                    }
                    
                    var re = e.createTextRange();
                    var rc = re.duplicate();
                    re.moveToBookmark(r.getBookmark());
                    rc.setEndPoint('EndToStart', re);
                    
                    // IE bug - it counts newline as 2 symbols when getting selection coordinates,
                    //  but counts it as one symbol when setting selection
                    var rcLen = rc.text.length,
                        i,
                        rcLenOut = rcLen;
                    for (i = 0; i < rcLen; i++) {
                        if (rc.text.charCodeAt(i) == 13) rcLenOut--;
                    }
                    var rLen = r.text.length,
                        rLenOut = rLen;
                    for (i = 0; i < rLen; i++) {
                        if (r.text.charCodeAt(i) == 13) rLenOut--;
                    }
                    
                    return {
                        start: rcLenOut,
                        end: rcLenOut + rLenOut,
                        length: rLenOut,
                        text: r.text};
                })
                
                /* browser not supported */
                || function() {
                    return {
                        start: 0,
                        end: e.value.length,
                        length: 0};
                }

            )();

        },
        
        // 
        // Adapted from http://stackoverflow.com/questions/401593/javascript-textarea-selection
        // 
        setSelection: function()
        {
            var e = this.jquery ? this[0] : this;
            var start_pos = arguments[0] || 0;
            var end_pos = arguments[1] || 0;

            return (
                //Mozilla and DOM 3.0
                ('selectionStart' in e && function() {
                    e.focus();
                    e.selectionStart = start_pos;
                    e.selectionEnd = end_pos;
                    return this;
                })

                //IE
                || (document.selection && function() {
                    e.focus();
                    var tr = e.createTextRange();
                
                    //Fix IE from counting the newline characters as two seperate characters
                    var stop_it = start_pos;
                    for (i=0; i < stop_it; i++) if( e.value[i].search(/[\r\n]/) != -1 ) start_pos = start_pos - .5;
                    stop_it = end_pos;
                    for (i=0; i < stop_it; i++) if( e.value[i].search(/[\r\n]/) != -1 ) end_pos = end_pos - .5;
                
                    tr.moveEnd('textedit',-1);
                    tr.moveStart('character',start_pos);
                    tr.moveEnd('character',end_pos - start_pos);
                    tr.select();

                    return this;
                })

                //Not supported
                || function() {
                    return this;
                }
            )();
        },
        
        replaceSelection: function() {
            var e = this.jquery ? this[0] : this;
            var text = arguments[0] || '';
            
            return (
                /* mozilla / dom 3.0 */
                ('selectionStart' in e && function() {
                    e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
                    return this;
                })
                
                /* exploder */
                || (document.selection && function() {
                    e.focus();
                    document.selection.createRange().text = text;
                    return this;
                })
                
                /* browser not supported */
                || function() {
                    e.value += text;
                    return this;
                }
            )();
        }
    };
    
    jQuery.each(fieldSelection, function(i) { jQuery.fn[i] = this; });

})();
