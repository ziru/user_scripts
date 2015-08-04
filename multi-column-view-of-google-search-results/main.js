// ==UserScript==
// @name           Multi-Column View of Google Search Results 
// @namespace      http://twitter.com/ziru
// @include        http://www.google.*/*
// @include        https://www.google.*/*
// ==/UserScript==

var gLastUsedNumOfColumns = "mcv.google.lastUsedNumOfCols";
var gMinWidthForTwoColumns = 950;
var gMinWidthForThreeColumns = 1100;
var gDefaultNumOfColumns = 2;
var gResTableWidth = '98%';
var gCellPadding = 10;
var gCellSpacing = 3;

// ==============  HACK for Google Chrome ============= 
if (window.localStorage) {
  console.log('Override GM_getValue()/GM_setValue()/GM_deleteValue()');
  window.GM_getValue=function (key,def) {
      return localStorage[key] || def;
  };
  window.GM_setValue=function (key,value) {
      return localStorage[key]=value;
  };
  window.GM_deleteValue=function (key) {
      return delete localStorage[key];
  };
}
// ==============  HACK for Google Chrome ============= 

// utility function, taken from web
function getElementsByClass(searchClass,node,tag) {
  var classElements = new Array();
  if ( node == null )
    node = document;
  if ( tag == null )
    tag = '*';
  var els = node.getElementsByTagName(tag);
  var elsLen = els.length;
  var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
  for (i = 0, j = 0; i < elsLen; i++) {
    if ( pattern.test(els[i].className) ) {
      classElements[j] = els[i];
      j++;
    }
  }
  return classElements;
}

function removeElem(elem) {
  if (elem) elem.parentNode.removeChild(elem);
}

function removeAds() {
  removeElem(document.getElementById('tads'));
  removeElem(document.getElementById('leqr'));
  removeElem(document.getElementById('leoi'));
  removeElem(document.getElementById('tpa1'));
  removeElem(document.getElementById('tpa2'));
  removeElem(document.getElementById('tpa3'));
  removeElem(document.getElementById('mbEnd'));
  var sheet = document.createElement('style')
  sheet.innerHTML = ".ads-ad { display: none; }";
  document.body.appendChild(sheet);
}

function getResDivContainer(theRes) {
  var iresElem = document.getElementById('ires');
  if (iresElem) return iresElem;
  var divElemsByClassSrg = getElementsByClass('srg', theRes, 'div');
  if (divElemsByClassSrg.length > 0) return divElemsByClassSrg[0].parentNote;
  var divElemsByClassG = getElementsByClass('g', theRes, 'div');
  if (divElemsByClassG.length > 0) return divElemsByClassG[0].parentNode;
  var liElemsByClassG = getElementsByClass('g', theRes, 'li');
  if (liElemsByClassG.length > 0) return liElemsByClassG[0].parentNode;
}

function getResDivArray(theRes) {
  var srgElems = getElementsByClass('srg', theRes, 'div');
  if (srgElems.length > 0) {
    var result = [];
    for (var i = 0; i < srgElems.length; i++) {
      var gElems = getElementsByClass('g', srgElems[i], 'div');
      result = result.concat(gElems);
    }
    return result;
  } else {
    return getElementsByClass('g', theRes, null);
  }
}

function displaySearchResultsInColumns(inNumOfColumns) {
  var theRes = document.getElementById('res');
  theRes.parentNode.setAttribute('style', 'max-width: 200em !important');

  var numOfColumns = inNumOfColumns;
  if (inNumOfColumns == 0) {
    var v = GM_getValue(gLastUsedNumOfColumns);
    console.log('gLastUsedNumOfColumns = ' + gLastUsedNumOfColumns);
    console.log('v = ' + v);
    numOfColumns = v ? v : gDefaultNumOfColumns;
  } else {
    GM_setValue(gLastUsedNumOfColumns, numOfColumns);
  }
  console.log('[before] numOfColumns = ' + numOfColumns);
  console.log('document.body.clientWidth = ' + document.body.clientWidth);
  console.log('window.innerWidth = ' + window.innerWidth);
  console.log('gMinWidthForTwoColumns = ' + gMinWidthForTwoColumns);
  console.log('gMinWidthForThreeColumns = ' + gMinWidthForThreeColumns);

  if (window.innerWidth < gMinWidthForTwoColumns)
    numOfColumns = 1;
  else if ((window.innerWidth < gMinWidthForThreeColumns) && (numOfColumns >= 3))
    numOfColumns = 2;

  console.log('[after] numOfColumns = ' + numOfColumns);

  var theResDivContainer = document.getElementById('multi_column_view');
  if (theResDivContainer) {
    if (numOfColumns == theResDivContainer.firstChild.getElementsByTagName('td').length) {
      return;
    }
  } else {
    if (numOfColumns == 1) {
      return;
    }
    theResDivContainer = getResDivContainer(theRes);
  }

  var theResDivArray = getResDivArray(theRes);
  var numOfResults = theResDivArray.length;
  var totalHeight = 0;
  var theResDivHeight = new Array();
  for (var i = 0; i < numOfResults; i++) {
    theResDivHeight[i] = theResDivArray[i].clientHeight;
    totalHeight += theResDivHeight[i];
  }
  var avgHeight = totalHeight / numOfColumns;

  var theNewResDiv = document.createElement('div');
  theNewResDiv.setAttribute('id', 'multi_column_view');
  theNewResDiv.setAttribute('align', 'center');
  theNewResDiv.setAttribute('style', 'list-style:none;');

  var theNewResTable = document.createElement('table');
  theNewResTable.setAttribute('width', gResTableWidth);
  theNewResTable.setAttribute('cellspacing', gCellSpacing);
  theNewResTable.setAttribute('cellpadding', gCellPadding);
  var theOnlyRow = document.createElement('tr');
  theOnlyRow.setAttribute('valign', 'top');

  var columns = new Array();

  var columnWidth = '' + parseInt(100 / numOfColumns) + '%';
  var idxResDiv = 0;
  for (var i = 0; i < numOfColumns; i++) {
    columns[i] = document.createElement('td');
    columns[i].setAttribute('width', columnWidth);
    theOnlyRow.appendChild(columns[i]);
  }

  var columnHeight = 0;
  var idxColumn = 0;
  for (var i = 0; i < numOfResults; i++) {
    columns[idxColumn].appendChild(theResDivArray[i]);
    
    columnHeight += theResDivHeight[i];
    // alert('columnHeight: ' + columnHeight + ', avgHeight: ' + avgHeight);
    if ((columnHeight > avgHeight - 30) && (idxColumn < numOfColumns - 1)) {
      idxColumn++;
      columnHeight = 0;
    }
  }

  theNewResTable.appendChild(theOnlyRow);
  theNewResDiv.appendChild(theNewResTable);

  console.log('replace: numOfColumns = ' + numOfColumns);
  theResDivContainer.parentNode.replaceChild(theNewResDiv, theResDivContainer);
}

function keyDownHandler(e) {
  if (!e.altKey) return;
    
  if (e.keyIdentifier == 'U+0031' || e.which == e.DOM_VK_1) { // 1 pressed
    displaySearchResultsInColumns(1);
  } else if (e.keyIdentifier == 'U+0032' || e.which == e.DOM_VK_2) { // 2 pressed
    displaySearchResultsInColumns(2);
  } else if (e.keyIdentifier == 'U+0033' || e.which == e.DOM_VK_3) { // 3 pressed
    displaySearchResultsInColumns(3);
  }
}

function onWinResize(e) {
  displaySearchResultsInColumns(0);
}

function onWinHashChange(e) {
  gLayoutChanged = false;
  gCheckAttempts = 0;
  tryChangeLayout();
}

function checkURL() {
  var re = new RegExp("https?://www\.google\.[a-z\.]*/.*");
  return re.test(document.location.href) && document.getElementById('res');
}

var gLayoutChanged = false;
function changeLayout() {
  if (gLayoutChanged) return;
  if (!checkURL()) return;
  removeAds();

  console.log('change');
  displaySearchResultsInColumns(0);
  gLayoutChanged = true;
}
function readyForLayoutChange() {
  var iresElem = document.getElementById('ires');
  if (!iresElem) {
    return false;
  }
  var gElems = document.getElementsByClassName('g');
  if (gElems.length == 0) {
    return false;
  }
  console.log('gElems.length = ' + gElems.length);
  return true;
}
var gCheckAttempts = 0;
function tryChangeLayout() {
  if (readyForLayoutChange()) {
    setTimeout(changeLayout, 700);
    return;
  }
  if (gCheckAttempts >= 10) {
    console.log('Give up after ' + gCheckAttempts + ' attempts');
    return;
  }
  gCheckAttempts += 1;
  setTimeout(tryChangeLayout, 300);
}

(function() {
  document.addEventListener('DOMAttrModified', function (event) {
    if (event.target.id == 'foot') {
      if (document.getElementById('foot').style.visibility == 'visible' ) {
        changeLayout();
      } else {
        gLayoutChanged = false;
      }
    }
  }, false);

  document.addEventListener('keydown', keyDownHandler, false);
  window.addEventListener('resize', onWinResize, false);
  window.addEventListener('hashchange', onWinHashChange, false);

  if (document.readyState == "complete" || document.readySate == "loaded" || document.readyState == "interactive") {
    tryChangeLayout();
  } else {
    document.addEventListener(
      'DOMContentLoaded', tryChangeLayout, false
    );
  }
})();

