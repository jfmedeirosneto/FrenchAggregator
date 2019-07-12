// electron import
const { shell } = require('electron');
const app = require('electron').remote.app;

// New electron-store
const Store = require('electron-store');
const store = new Store();

// Search history
let searchhistory = store.get('searchhistory', []);

// package json
const packagejson = require('./package.json');

// Sites Json
const sitesjson = require('./sites.json');

// French words
const frenchwords = require('./french-words.json');

// Set webviews to search input
function setWebviews(value) {
    // Add to search history
    addToSearchHistory(value);

    // Interate sites
    Object.keys(sitesjson).forEach(function (key) {
        // Search word with whitespace replaced by site specific char
        let searchword = value.trim().replace(/\s/g, sitesjson[key].spaceconv);

        // Site data
        let url = eval('`' + sitesjson[key].url + '`;');
        let divid = sitesjson[key].divid;

        // Activate webview link
        let $webviewlink = $(`#${divid}-webview-link`);
        $webviewlink.removeClass('disabled');
        $webviewlink.prop('href', url);

        // Html webview loadURL and set link URL
        $(`#${divid}-webview`)[0].loadURL(url);
    });
}

// Add to search history
function addToSearchHistory(value) {
    searchhistory = searchhistory.filter(function (elm) {
        return elm !== value;
    });
    searchhistory.unshift(value);
    store.set('searchhistory', searchhistory);
}

// Remove from search history
function removeFromSearchHistory(value) {
    searchhistory = searchhistory.filter(function (elm) {
        return elm !== value;
    });
    store.set('searchhistory', searchhistory);
}

// Document ready
$(document).ready(function () {
    // Interate sites
    Object.keys(sitesjson).forEach(function(key) {
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
            `<a id="${divid}-webview-link" href="./blank.html" target="_blank" class="btn btn-primary btn-sm open-in-browser disabled" role="button" aria-disabled="true">Open In External Browser</a>` +
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

        // Html webview did-finish-load
        $(`#${divid}-webview`).on('did-finish-load', function () {
            //let $webview = $(this)[0];
            //Set zero to scroll
            //$webview.executeJavaScript("document.querySelector('body:first-child').scrollTop=0;");
        });

        // Html webview new-window prevent
        $(`#${divid}-webview`).on('new-window', function (evt) {
            evt.preventDefault();
        });
    });                

    // Select first tab
    $('#sitesTab li:first-child a').tab('show');

    // Open External Click
    $('.open-in-browser').click((event) => {
        event.preventDefault();
        shell.openExternal(event.target.href);
    });

    // Versap do app
    let apptitle = `${packagejson.description} ${packagejson.version}`;
    document.title = apptitle;
    $('#about-modal').find('.modal-title').text(apptitle);

    // French words autocomplete
    $('#searchInput').autocomplete({
        source: frenchwords,
        minLength: 2,
        select: function( event, ui ) {
            $('#formSearch').submit();
        }
    });

    // Form submit
    $('#formSearch').submit(function (evt) {
        evt.preventDefault();
        let searchinputvalue = $('#searchInput').val();

        // Close autocomplete
        $('#searchInput').autocomplete('close');
        
        // Set webviews
        setWebviews(searchinputvalue);
    });

    // Search history is opening
    $('#history-modal').on('show.bs.modal', function (e) {
        // History search list group
        let $listgroup = $(this).find("#history-list");
        $listgroup.empty();

        searchhistory.forEach(function(searchInput){
            let historyaction = `<a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" title="Open Hitory Item" data-action="open" data-value="${searchInput}">${searchInput}` +
                '<span class="pull-right">' +
                `<button class="btn btn-sm btn-outline-info" title="Delete Hitory Item" data-action="delete" data-value="${searchInput}"><i class="far fa-trash-alt"></i> Delete</button>` +
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
            } else if (historyaction === 'delete') {
                // Remove from search history
                removeFromSearchHistory(historyvalue)

                // Remove a element from DOM
                $target.closest('a').remove();
            }
        });
    })

});
