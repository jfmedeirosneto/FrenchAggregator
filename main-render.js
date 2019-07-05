// electron import
const { shell } = require('electron');
const app = require('electron').remote.app;

// package json
const packagejson = require('./package.json');

// Sites Json
const sitesjson = require('./sites.json');

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
            //let webview = $(this)[0];
            //Set zero to scroll
            //webview.executeJavaScript("document.querySelector('body:first-child').scrollTop=0;");
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
});

// Form submit
$('#formSearch').submit(function (evt) {
    evt.preventDefault();
    let searchInput = $('#searchInput').val();

    // Interate sites
    Object.keys(sitesjson).forEach(function(key) {
        // Search word with whitespace replaced by site specific char
        let searchword = searchInput.trim().replace(/\s/g, sitesjson[key].spaceconv);

        // Site data
        let url = eval('`' + sitesjson[key].url + '`;');
        let divid = sitesjson[key].divid;

        // Activate webview link
        let webviewlink = $(`#${divid}-webview-link`);
        webviewlink.removeClass('disabled');
        webviewlink.prop('href', url);

        // Html webview loadURL and set link URL
        $(`#${divid}-webview`)[0].loadURL(url);
    });
});