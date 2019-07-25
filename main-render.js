// Electron import
const { shell } = require('electron');
const app = require('electron').remote.app;
const { dialog } = require('electron').remote

// electron-store
const Store = require('electron-store');
const store = new Store();

// Node.js imports
const url = require('url');
const compareVersions = require('compare-versions');

// package json
const packagejson = require('./package.json');

// Sites json
const sitesjson = require('./sites.json');

// French words json
const frenchwords = require('./french-words.json');

// Search history electron-store object
let searchhistory = store.get('searchhistory', []);

// Add to search history
function addToSearchHistory(value) {
    searchhistory = searchhistory.filter(elm => {
        return elm !== value;
    });
    searchhistory.unshift(value);
    store.set('searchhistory', searchhistory);
}

// Remove from search history
function removeFromSearchHistory(value) {
    searchhistory = searchhistory.filter(elm => {
        return elm !== value;
    });
    store.set('searchhistory', searchhistory);
}

// loadURL on Webview
function loadURLWebView($webview, loadurl) {
    // Current url
    let webview = $webview[0];
    let currenturl = webview.getURL();

    // Verify loadurl changed
    if (currenturl.startsWith(loadurl)) {
        $webview.data('loadurl', '');
    } else {
        // loadURL
        $webview.data('loadurl', '');
        webview.loadURL(loadurl);

        // Show loading overlay
        let $tabpane = $webview.closest('.tab-pane');
        $tabpane.LoadingOverlay('show', {
            text: "Loading..."
        });

        // Hide loading overlay after 15s
        setTimeout(() => {
            $tabpane.LoadingOverlay('hide');
        }, 15000);
    } 
}

// Set webviews to search input value
function setWebviews(searchinputvalue) {
    // Add to search history
    addToSearchHistory(searchinputvalue);

    // Activated tab id
    let activatedtabid = $('div.tab-pane.active').attr('id');

    // Interate sites
    Object.keys(sitesjson).forEach(key => {
        // Search word with whitespace replaced by site specific char
        let searchword = searchinputvalue.trim().replace(/\s/g, sitesjson[key].spaceconv);

        // Site data
        let url = eval('`' + sitesjson[key].url + '`;');
        let divid = sitesjson[key].divid;

        // Activate webview open in external browser
        let $webviewlink = $(`#${divid}-open-in-external-browser`);
        $webviewlink.removeClass('disabled');
        $webviewlink.prop('href', url);

        // Activate back and foward buttons
        $(`#${divid}-back-button`).removeClass('disabled');
        $(`#${divid}-forward-button`).removeClass('disabled');

        // Html webview set data and loadURL
        let $webview = $(`#${divid}-webview`);
        $webview.data('searchvalue', searchinputvalue);
        if( divid === activatedtabid ) {
            // loadURL on Webview
            loadURLWebView($webview, url);
        } else {
            // Prepare Webview to loadURL on activate tab
            $webview.data('loadurl', url);
        }
    });
}

// Document ready
$(document).ready(() => {
    // Interate sites
    Object.keys(sitesjson).forEach(sitekey => {
        // Site data
        let divid = sitesjson[sitekey].divid;
        let name = sitesjson[sitekey].name;

        // Html nav
        let htmlnav = '<li class="nav-item">' +
            `<a id="${divid}-tab" class="nav-link" data-toggle="tab" data-webviewid="#${divid}-webview" href="#${divid}" role="tab" aria-controls="${divid}" aria-selected="false">${name}</a>` +
            '</li>';
        $("#sitesTab").append(htmlnav);

        // Html tab with webview
        let htmltab = `<div id="${divid}" class="tab-pane fade border p-1" style="height:82vh;" role="tabpanel" aria-labelledby="${divid}-tab">` +
            '<div class="container-fluid d-flex h-100 flex-column">' +
            '<div class="row py-2">' +
            '<div class="col-12">' +
            '<div class="btn-group btn-group-sm mr-2" role="group" aria-label="first group">' +
            `<button id="${divid}-open-in-external-browser" type="button" class="btn btn-primary disabled" title="Open In External Browser" data-webviewid="#${divid}-webview">Open In External Browser</button>` +
            '</div>' +
            '<div class="btn-group btn-group-sm" role="group" aria-label="second group">' +
            `<button id="${divid}-back-button" type="button" class="btn btn-outline-info disabled" title="Back" data-webviewid="#${divid}-webview"><i class="fas fa-arrow-left"></i></button>` +
            `<button id="${divid}-forward-button" type="button" class="btn btn-outline-info disabled" title="Forward" data-webviewid="#${divid}-webview"><i class="fas fa-arrow-right"></i></button>` +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="row flex-grow-1 pb-2">' +
            '<div class="col-12">' +
            `<webview id="${divid}-webview" data-loadurl="" data-sitekey="${sitekey}" data-searchvalue="" style="height:100%;min-height:100%;" preload="./webview-injected.js" src="./blank.html"></webview>` +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        $("#sitesTabContent").append(htmltab);
    });

    // Tab show event
    $('#sitesTab').on('show.bs.tab', function (event) {
        let $activetab = $(event.target);
        let $webview = $($activetab.data('webviewid'));
        let loadurl = $webview.data('loadurl');
        if ((typeof loadurl !== 'undefined') && (loadurl !== '')) {
            // Load url on Webview
            loadURLWebView($webview, loadurl);
        }
    });

    // Add events to webview
    // Must be added by electron.js webview object
    $('webview[id$=webview]').each((index, element) => {
        // Html webview new-window event
        element.addEventListener('new-window', (event) => {
            event.preventDefault();
            // Check if user opens external link
            dialog.showMessageBox(null,
                {
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    title: 'Question',
                    message: 'Open in external web browser?',
                    detail: 'You clicked an external link'
                },
                response => {
                    if( response === 0 ) {
                        let protocol = url.parse(event.url).protocol;
                        if (protocol === 'http:' || protocol === 'https:') {
                            shell.openExternal(event.url);                            
                        }                        
                    }
                }
            );
        });

        // Intercept console messages from webview
        element.addEventListener('console-message', (event) => {
            if( event.message.startsWith('$webview-injected$') ) {
                console.log(event.message);
            }
        });

        // Webview did-finish-load event
        element.addEventListener('did-finish-load', (event) => {
            // Start webview injected script
            let $webview =$(event.target);
            let sitekey = $webview.data('sitekey');
            let sitejsondata = sitesjson[sitekey];
            let searchvalue = $webview.data('searchvalue');
            event.target.send('start-webview-injected', sitejsondata, searchvalue);

            // Hide loading overlay
            let $tabpane = $webview.closest('.tab-pane');
            setTimeout(() => {
                $tabpane.LoadingOverlay('hide');
            }, 1000);
        });
    });

    // Html webview history back button
    $('button[id$=back-button]').click((event) => {
        let $target = $(event.target).is('button') ? $(event.target) : $(event.target).parent();
        let webviewid = $target.data('webviewid');
        let webview = $(webviewid)[0];
        webview.goBack();
    });

    // Html webview history forward button
    $('button[id$=forward-button]').click((event) => {
        let $target = $(event.target).is('button') ? $(event.target) : $(event.target).parent();
        let webviewid = $target.data('webviewid');
        let webview = $(webviewid)[0];
        webview.goForward();
    });

    // Html webview open in external browser
    $('button[id$=open-in-external-browser]').click((event) => {
        event.preventDefault();
        let webviewid = $(event.target).data('webviewid');
        let webview = $(webviewid)[0];
        shell.openExternal(webview.getURL());
    });

    // Open external click
    $('.open-in-browser').click((event) => {
        event.preventDefault();
        shell.openExternal(event.target.href);
    });

    // Show first tab
    $('#sitesTab li:first-child a').tab('show');

    // App version
    let apptitle = `${packagejson.description} ${packagejson.version}`;
    document.title = apptitle;
    $('#about-modal').find('.modal-title').text(apptitle);

    // Github last release
    $.getJSON('https://api.github.com/repos/jfmedeirosneto/FrenchAggregator/releases/latest', data => {
        let githubversion = data.tag_name.substring(1);
        let appversion = packagejson.version;
        // Verify new available version        
        if (compareVersions.compare(githubversion, appversion, '>')) {
            $('#update-current-version').text(`Current Version: ${appversion}`);
            $('#update-avaliable-version').text(`Available Version: ${githubversion}`);
            $('#update-modal').modal('show');
        }
    });

    // French words autocomplete
    $('#searchInput').autocomplete({
        source: frenchwords,
        minLength: 2,
        select: (event, ui) => {
            $('#formSearch').submit();
        }
    });

    // Form submit
    $('#formSearch').submit( event => {
        event.preventDefault();
        let $searchinput = $('#searchInput');
        let searchinputvalue = $searchinput.val();
        
        // Set webviews
        setWebviews(searchinputvalue);

        // Close autocomplete
        setTimeout(() => {
            $searchinput.autocomplete('close');
        }, 500);
    });

    // Search history is opening
    $('#history-modal').on('show.bs.modal', (event) => {
        // History search list group
        let $listgroup = $('#history-list');
        $listgroup.empty();
        searchhistory.forEach((searchvalue) => {
            let historyaction = `<a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" title="Open Hitory Item" data-action="open" data-value="${searchvalue}">${searchvalue}` +
                '<span class="pull-right">' +
                `<button type="button" class="btn btn-sm btn-outline-info" title="Delete Hitory Item" data-action="delete" data-value="${searchvalue}"><i class="far fa-trash-alt"></i> Delete</button>` +
                '</span>' +
                '</a>';
            $listgroup.append(historyaction);
        });

        // History click
        $listgroup.find('a.list-group-item').click((event) => {
            event.preventDefault();
            let $target = $(event.target);
            let historyaction = $target.data('action');
            let historyvalue = $target.data('value');

            // Verify action
            if (historyaction === 'open') {
                // Clear history search list group
                $listgroup.find('a.list-group-item').unbind('click');
                $listgroup.empty();

                // Close history modal
                $('#history-modal').modal('hide');

                // Set searchInput
                $('#searchInput').val(historyvalue);

                // Set webviews
                setWebviews(historyvalue);

                // Close autocomplete
                $('#searchInput').autocomplete('close');
            } else if (historyaction === 'delete') {
                // Remove from search history
                removeFromSearchHistory(historyvalue)

                // Remove a element from DOM
                $target.closest('a').remove();
            }
        });
    });
});
