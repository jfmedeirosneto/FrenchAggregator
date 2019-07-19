// electron import
const { shell } = require('electron');
const app = require('electron').remote.app;
const { dialog } = require('electron').remote

// New electron-store
const Store = require('electron-store');
const store = new Store();

// Node.js import
const url = require('url');

// Search history
let searchhistory = store.get('searchhistory', []);

// package json
const packagejson = require('./package.json');

// Sites Json
const sitesjson = require('./sites.json');

// French words
const frenchwords = require('./french-words.json');

// Compare semantic versions
const compareVersions = require('compare-versions');

// Set webviews to search input
function setWebviews(value) {
    // Add to search history
    addToSearchHistory(value);

    // Interate sites
    Object.keys(sitesjson).forEach(key => {
        // Search word with whitespace replaced by site specific char
        let searchword = value.trim().replace(/\s/g, sitesjson[key].spaceconv);

        // Site data
        let url = eval('`' + sitesjson[key].url + '`;');
        let divid = sitesjson[key].divid;

        // Activate webview link
        let $webviewlink = $(`#${divid}-webview-link`);
        $webviewlink.removeClass('disabled');
        $webviewlink.prop('href', url);

        // Activate back and foward buttons
        $(`#${divid}-back-button`).removeClass('disabled');
        $(`#${divid}-forward-button`).removeClass('disabled');

        // Html webview loadURL and set link URL
        $(`#${divid}-webview`)[0].loadURL(url);
    });
}

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

// Document ready
$(document).ready(function () {
    // Interate sites
    Object.keys(sitesjson).forEach(key => {
        // Site data
        let divid = sitesjson[key].divid;
        let name = sitesjson[key].name;

        // Html nav
        let htmlnav = '<li class="nav-item">' +
            `<a id="${divid}-tab" class="nav-link" data-toggle="tab" href="#${divid}" role="tab" aria-controls="${divid}" aria-selected="false">${name}</a>` +
            '</li>';
        $("#sitesTab").append(htmlnav);

        // Html tab with webview
        let htmltab = `<div id="${divid}" class="tab-pane fade border p-1" style="height:82vh;" role="tabpanel" aria-labelledby="${divid}-tab">` +
            '<div class="container-fluid d-flex h-100 flex-column">' +
            '<div class="row py-2">' +
            '<div class="col-12">' +
            '<div class="btn-group btn-group-sm mr-2" role="group" aria-label="first group">' +
            `<a id="${divid}-webview-link" role="button" href="./blank.html" target="_blank" class="btn btn-primary open-in-browser disabled" title="Open In External Browser" aria-disabled="true">Open In External Browser</a>` +
            '</div>' +
            '<div class="btn-group btn-group-sm" role="group" aria-label="second group">' +
            `<button id="${divid}-back-button" type="button" class="btn btn-outline-info disabled" title="Back" data-value="${divid}-webview"><i class="fas fa-arrow-left"></i></button>` +
            `<button id="${divid}-forward-button" type="button" class="btn btn-outline-info disabled" title="Forward" data-value="${divid}-webview"><i class="fas fa-arrow-right"></i></button>` +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="row flex-grow-1 pb-2">' +
            '<div class="col-12">' +
            `<webview id="${divid}-webview" style="height:100%;min-height:100%;" src="./blank.html"></webview>` +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        $("#sitesTabContent").append(htmltab);
    });                

    // Add events to webview
    // Must be added by electron.js webview object
    $('webview[id$=webview]').each(function (index) {
        let webview = $(this)[0];
        // Html webview new-window event
        webview.addEventListener('new-window', (event) => {
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
                    console.log(response);
                }
            );
        });
        // Webview did-finish-load event
        webview.addEventListener('did-finish-load', () => {
            //let webview = $(this)[0];
            //Set zero to scroll
            //webview.executeJavaScript("document.querySelector('body:first-child').scrollTop=0;");
        });
    });        

    // Html webview history back button
    $('button[id$=back-button]').click((event) => {
        let $target = $(event.target).is('button') ? $(event.target) : $(event.target).parent();
        let webviewid = $target.data('value');
        let webview = $(`#${webviewid}`)[0];
        webview.goBack();
    });

    // Html webview history forward button
    $('button[id$=forward-button]').click((event) => {
        let $target = $(event.target).is('button') ? $(event.target) : $(event.target).parent();
        let webviewid = $target.data('value');
        let webview = $(`#${webviewid}`)[0];
        webview.goForward();
    });

    // Select first tab
    $('#sitesTab li:first-child a').tab('show');

    // Open External Click
    $('.open-in-browser').click((event) => {
        event.preventDefault();
        shell.openExternal(event.target.href);
    });

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
        let searchinputvalue = $('#searchInput').val();
        
        // Set webviews
        setWebviews(searchinputvalue);

        // Close autocomplete
        $('#searchInput').autocomplete('close');
    });

    // Search history is opening
    $('#history-modal').on('show.bs.modal', event => {
        // History search list group
        let $listgroup = $(this).find("#history-list");
        $listgroup.empty();
        searchhistory.forEach(searchInput => {
            let historyaction = `<a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" title="Open Hitory Item" data-action="open" data-value="${searchInput}">${searchInput}` +
                '<span class="pull-right">' +
                `<button type="button" class="btn btn-sm btn-outline-info" title="Delete Hitory Item" data-action="delete" data-value="${searchInput}"><i class="far fa-trash-alt"></i> Delete</button>` +
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
