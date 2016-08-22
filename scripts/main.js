"use strict";

$(function() {
  
  var listEndpoint = 'https://www.mangaeden.com/api/list/0/ ';
  var infoEndpoint = 'https://www.mangaeden.com/api/manga/';
  var chapterEndpoint = 'https://www.mangaeden.com/api/chapter/';
  var imgEndpoint = 'https://cdn.mangaeden.com/mangasimg/';
  var mangalist = {};
  
  getMangaList().then(function(data, status) {
    mapMangaFromRawList(data);
    renderNames();
  });
  
  $('body .manga-names ul').delegate('li', 'click', function(e) {
    var clickedElement = $(this);
    var mangaId = clickedElement.data('mangaid');
    
    addInfoToMangalist(mangaId, clickedElement);  
  });
  
  $('body .chapters ul').delegate('li', 'click', function(e) {
    var clickedElement = $(this);
    var mangaId = clickedElement.data('mangaid');
    var chapterIndex = clickedElement.data('chapterid');
    
    
    addPagesToChapters(mangaId, chapterIndex);
  });
  
  $('body .pages').delegate('img','click', function() {
    var $this = $(this);
    var currentPageIndex = parseInt($this.data('ownindex'));
    var maxIndex = parseInt($this.data('maxIndex'));
    
    if(currentPageIndex === maxIndex) {
      $this.parent().empty();
    } else {
      goToNextPage($this, currentPageIndex, maxIndex);
    }
  });
  
  function goToNextPage($currentPage, currentPageIndex, maxIndex) {
    var mangaId = $currentPage.data('mangaid');
    var chapterIndex = $currentPage.data('chapterindex');
    var currentChapter = getChaptersByMangaId(mangaId)[chapterIndex];
    var ownIndex = parseInt($currentPage.data('ownindex'));
    var newIndex = ++ownIndex
    var pageImagePath = currentChapter[4][maxIndex - ownIndex][1];
    
    $currentPage.attr('src', imgEndpoint + pageImagePath);
    $currentPage.data('ownindex', newIndex);
  
  }
  function getChaptersByMangaId(mangaId) {
    return getExtendedMangaInfoById(mangaId)['chapters'];
  }
  function addPagesToChapters(mangaId, chapterIndex) {
    var chapter = mangalist[mangaId].extendedInfo.chapters[chapterIndex]
    var chapterId = chapter[3];
    if(!chapter[4]) {
      fetchChapterInformation(chapterId).then(function(data, status) {
        extendChaptersWithPages(chapter, data);
        renderFirstChapterPage(chapter, chapterIndex, mangaId);
        console.log("extend")
      });
    } else {
      renderFirstChapterPage(chapter, chapterIndex, mangaId);
      console.log("just render")
    }
  }
  function renderFirstChapterPage(chapter, chapterIndex, mangaId) {
    var pagesContainer = $('.pages');
    pagesContainer.empty();
    
    var firstPage = chapter[4][chapter[4].length - 1];
    var page = $('<img>', { 
      src: imgEndpoint + firstPage[1]
    });
    
    page.data({
      'ownindex': firstPage[0],
      'maxIndex': chapter[4].length - 1,
      'chapterindex': chapterIndex,
      'mangaid': mangaId
    }).appendTo(pagesContainer);
  }
  function extendChaptersWithPages(chapter, pages) {
    chapter.push(pages.images);
  }
  function renderChapterNames(mangaId) {
    var chaptersContainer = $('.chapters ul');
    var chapters = getExtendedMangaInfoById(mangaId).chapters;

    chaptersContainer.empty();
    
    for (var i = 0; i < chapters.length; i++) {
      var currentChapter = chapters[i];
      var listElement = $('<li>' + 'Chapter Number: ' + currentChapter[0] + ' - ' + currentChapter[2]  + '</li>');
      
      listElement.data('chapterid', i);
      listElement.data('mangaid', mangaId);
      chaptersContainer.append(listElement);
    }
  }
  function addImageToName(clickedElement, clickedMangaPreviewImgUrl) {
    var previewImage = $('<img src="' + clickedMangaPreviewImgUrl +'"' + '>');
    
    clickedElement.append(previewImage);    
  }
  function addInfoToMangalist(mangaId, clickedElement) {
    var additionalInfo = getExtendedMangaInfoById(mangaId);
    
    if(additionalInfo) {
      renderChapterNames(mangaId); 
      console.log('info already available');
    } else {
      fetchMangaInfo(mangaId).then(function(data, status) {
        mangalist[mangaId]['extendedInfo'] = data;

        var previewImgPath = imgEndpoint + getExtendedMangaInfoById(mangaId).image;

        addImageToName(clickedElement, previewImgPath);

        renderChapterNames(mangaId); 
        console.log('info fetched from Api');
      });
    }
  }
  function fetchChapterInformation(chapterId) {
    return $.get(chapterEndpoint + chapterId);
  }
  function fetchMangaInfo(mangaId) {
    return $.get(infoEndpoint + mangaId);
  }
  function renderNames() {
    var $namesContainer = $('.manga-names ul');
    
    for(var mangaId in mangalist) {
      var currentManga = mangalist[mangaId];
      var $listElement = $('<li>' + currentManga.title + '</li>');
      
      $listElement.data('mangaid', currentManga.Id);
      $namesContainer.append($listElement);
    }
  }
  function getExtendedMangaInfoById(mangaId) {
    return mangalist[mangaId]['extendedInfo'];
  }
  function mapMangaFromRawList(data) {
    for (var i = 0; i < data.manga.length; i++) {
      var currentManga = data.manga[i];
      
      mangalist[currentManga.i] = {
        "title": currentManga.t,
        "Id": currentManga.i,
        "alias": currentManga.a,
        "status": currentManga.s,
        "category": currentManga.c,
        "lastChapterDate": currentManga.ld,
        "hits": currentManga.h,
        "image": currentManga.im
      }
    }    
  }
  function getMangaList() {
    return $.get(listEndpoint);
  }
});