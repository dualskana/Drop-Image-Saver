// 引入本地JSZip库
importScripts('jszip.min.js');

// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 确保content script已经加载
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      return true;
    }
  }).then(() => {
    // 添加重试机制
    const sendMessageWithRetry = (retryCount = 0) => {
      chrome.tabs.sendMessage(tab.id, { type: 'showImageSelector' })
        .catch(error => {
          console.error(`消息发送失败 (尝试 ${retryCount + 1}/3):`, error);
          if (retryCount < 2) {
            // 延迟100ms后重试
            setTimeout(() => sendMessageWithRetry(retryCount + 1), 100);
          } else {
            console.error('消息发送最终失败，请刷新页面后重试');
          }
        });
    };
    
    sendMessageWithRetry();
  }).catch(error => {
    console.error('无法执行content script:', error);
  });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'downloadImage') {
    // 使用chrome.downloads API下载图片
    chrome.downloads.download({
      url: message.url,
      filename: message.fileName,
      saveAs: true  // 显示保存对话框
    });
  } else if (message.type === 'downloadImages') {
    if (message.images.length === 1) {
      // 单张图片直接下载
      chrome.downloads.download({
        url: message.images[0].url,
        filename: message.images[0].fileName,
        saveAs: true
      });
    } else {
      // 多张图片打包下载
      const zip = new JSZip();
      const fetchPromises = message.images.map(image =>
        fetch(image.url)
          .then(response => response.blob())
          .then(blob => {
            zip.file(image.fileName, blob);
          })
      );

      Promise.all(fetchPromises)
        .then(() => zip.generateAsync({type: 'blob'}))
        .then(blob => {
          // 直接使用blob创建下载
          const reader = new FileReader();
          reader.onload = function() {
            chrome.downloads.download({
              url: reader.result,
              filename: 'images.zip',
              saveAs: true
            });
          };
          reader.readAsDataURL(blob);
        });
    }
  }
});