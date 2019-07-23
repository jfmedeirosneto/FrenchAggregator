document.addEventListener('DOMContentLoaded', (event) => {
    // Webview injected log message
    let log = (message) => { console.log('$webview-injected$ ' + message); };

    // Electron import
    const { ipcRenderer } = require('electron');

    // Start webview injection
    ipcRenderer.on('start-webview-injected', (event, sitejsondata, searchvalue) => {
        // Inject jquery
        let script = document.createElement('script');
        script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
        script.crossorigin = 'anonymous';
        script.onload = script.onreadystatechange = () => {
            $(document).ready(() => {
                // Avoiding jQuery conflicts
                let $wi = jQuery.noConflict(true);

                // Inject CSS
                let $injectedcssrules = $wi('<style type="text/css"></style>').appendTo('head');
                $injectedcssrules.append('.webview-injected-highlight { background-color: lightyellow; }');

                // Search on page
                //$wi(`body > *:contains("${searchvalue}"):first`).addClass("webview-injected-highlight");

                // Scroll to result
                if ((typeof sitejsondata.resultscroll !== 'undefined') && (sitejsondata.resultscroll !== '')) {
                    $wi('body,html').animate(
                        {
                            scrollTop: $wi(sitejsondata.resultscroll).offset().top
                        },
                        800
                    );
                } else {
                    $wi('body,html').animate(
                        {
                            scrollTop: 0
                        },
                        800
                    );
                }

                // Highlight result
                if ((typeof sitejsondata.resulthighlight !== 'undefined') && (sitejsondata.resulthighlight !== '')) {
                    $wi(sitejsondata.resulthighlight).addClass("webview-injected-highlight");
                }
            });
        };
        document.body.appendChild(script);
    });
});
