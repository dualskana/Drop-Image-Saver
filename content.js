// 创建拖拽接收区域
let dropZone = document.createElement('div');
dropZone.id = 'image-drop-zone';
dropZone.style.cssText = `
  position: fixed;
  width: 200px;
  height: 200px;
  border: 3px dashed #666;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  display: none;
  z-index: 1000000;
  justify-content: center;
  align-items: center;
  pointer-events: none;
`;
dropZone.innerHTML = '<div style="text-align: center; color: #666;">拖拽至此处<br>下载图片</div>';
document.body.appendChild(dropZone);

// 创建图片选择窗口
let imageSelector = document.createElement('div');
imageSelector.id = 'image-selector';
imageSelector.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 800px;
  height: 80vh;
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  z-index: 10001;
  display: none;
  flex-direction: column;
  padding: 20px;
`;

// 添加筛选器
let filterContainer = document.createElement('div');
filterContainer.style.cssText = `
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
`;

// 文件类型筛选
let typeFilter = document.createElement('div');
typeFilter.style.cssText = `
  display: flex;
  width: 30%;
  gap: 10px;
  flex-wrap: wrap;
`;

const selectedTypes = new Set(['all']);

// 创建标签
function createTypeFilter() {
  // 清空现有标签
  typeFilter.innerHTML = '';
  
  // 获取页面所有图片
  const images = Array.from(document.getElementsByTagName('img'));
  
  // 收集所有图片类型
  const types = new Set(['all']);
  images.forEach(img => {
    const ext = '.' + img.src.split('.').pop().split('?')[0].toLowerCase();
    if (ext.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      types.add(ext);
    }
  });
  
  // 创建标签
  types.forEach(type => {
    const tag = document.createElement('div');
    tag.dataset.type = type;
    tag.textContent = type === 'all' ? '所有' : type;
    tag.style.cssText = `
      padding: 4px 8px;
      font-size: 14px;
      background: ${type === 'all' ? '#4CAF50' : '#e0e0e0'};
      color: ${type === 'all' ? 'white' : '#666'};
      border-radius: 999px;
      cursor: pointer;
      user-select: none;
    `;
    typeFilter.appendChild(tag);
  });
}

// 标签点击事件处理
typeFilter.addEventListener('click', (e) => {
  const tag = e.target;
  if (!tag.dataset.type) return;

  const type = tag.dataset.type;
  if (type === 'all') {
    // 点击"所有"标签时，清除其他选中状态
    selectedTypes.clear();
    selectedTypes.add('all');
    Array.from(typeFilter.children).forEach(tag => {
      tag.style.background = tag.dataset.type === 'all' ? '#4CAF50' : '#e0e0e0';
      tag.style.color = tag.dataset.type === 'all' ? 'white' : '#666';
    });
  } else {
    // 点击其他标签时，移除"所有"选中状态
    selectedTypes.delete('all');
    if (selectedTypes.has(type)) {
      selectedTypes.delete(type);
      tag.style.background = '#e0e0e0';
      tag.style.color = '#666';
    } else {
      selectedTypes.add(type);
      tag.style.background = '#4CAF50';
      tag.style.color = 'white';
    }
    // 如果没有选中任何类型，自动选中"所有"
    if (selectedTypes.size === 0) {
      selectedTypes.add('all');
      const allTag = typeFilter.querySelector('[data-type="all"]');
      allTag.style.background = '#4CAF50';
      allTag.style.color = 'white';
    }
  }
  filterImages();
});

// 尺寸筛选
let sizeFilter = document.createElement('div');
sizeFilter.style.cssText = `
  display: flex;
  flex-direction: column;
  gap: 15px;
  font-size: 16px;
  min-width: 300px;
`;

// 宽度滑块容器
let widthSliderContainer = document.createElement('div');
widthSliderContainer.innerHTML = '<div style="font-size: 14px;">宽度范围: <span id="width-range-display">0 - 无限制</span></div>';
let widthSlider = document.createElement('div');
widthSlider.style.cssText = `
  position: relative;
  height: 4px;
  font-size: 16px;
  background: #ddd;
  border-radius: 2px;
  margin: 10px 0;
`;

let widthMinHandle = document.createElement('div');
widthMinHandle.style.cssText = `
  position: absolute;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  top: -6px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
`;

let widthMaxHandle = document.createElement('div');
widthMaxHandle.style.cssText = widthMinHandle.style.cssText;

widthSlider.appendChild(widthMinHandle);
widthSlider.appendChild(widthMaxHandle);
widthSliderContainer.appendChild(widthSlider);

// 高度滑块容器
let heightSliderContainer = document.createElement('div');
heightSliderContainer.innerHTML = '<div style="font-size: 14px;">高度范围: <span id="height-range-display">0 - 无限制</span></div>';
let heightSlider = document.createElement('div');
heightSlider.style.cssText = widthSlider.style.cssText;

let heightMinHandle = document.createElement('div');
heightMinHandle.style.cssText = widthMinHandle.style.cssText;

let heightMaxHandle = document.createElement('div');
heightMaxHandle.style.cssText = widthMinHandle.style.cssText;

heightSlider.appendChild(heightMinHandle);
heightSlider.appendChild(heightMaxHandle);
heightSliderContainer.appendChild(heightSlider);

sizeFilter.appendChild(widthSliderContainer);
sizeFilter.appendChild(heightSliderContainer);

// 滑块拖动逻辑
let isDragging = false;
let currentHandle = null;
let maxImageWidth = 0;
let maxImageHeight = 0;

// 获取最大图片尺寸
function updateMaxDimensions() {
  const images = Array.from(document.getElementsByTagName('img'));
  maxImageWidth = Math.max(...images.map(img => img.naturalWidth));
  maxImageHeight = Math.max(...images.map(img => img.naturalHeight));
  
  // 更新滑块范围显示
  updateRangeDisplay();
}

function updateRangeDisplay() {
  const widthMinPos = parseInt(widthMinHandle.style.left) || 0;
  const widthMaxPos = parseInt(widthMaxHandle.style.left) || 100;
  const heightMinPos = parseInt(heightMinHandle.style.left) || 0;
  const heightMaxPos = parseInt(heightMaxHandle.style.left) || 100;
  
  const widthMin = Math.round((widthMinPos / 100) * maxImageWidth);
  const widthMax = widthMaxPos === 100 ? '无限制' : Math.round((widthMaxPos / 100) * maxImageWidth);
  const heightMin = Math.round((heightMinPos / 100) * maxImageHeight);
  const heightMax = heightMaxPos === 100 ? '无限制' : Math.round((heightMaxPos / 100) * maxImageHeight);
  
  document.getElementById('width-range-display').textContent = `${widthMin} - ${widthMax}`;
  document.getElementById('height-range-display').textContent = `${heightMin} - ${heightMax}`;
}

function handleDragStart(e, handle) {
  isDragging = true;
  currentHandle = handle;
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
}

function handleDragMove(e) {
  if (!isDragging || !currentHandle) return;
  
  const slider = currentHandle.parentElement;
  const rect = slider.getBoundingClientRect();
  let pos = ((e.clientX - rect.left) / rect.width) * 100;
  pos = Math.max(0, Math.min(100, pos));
  
  const isMinHandle = currentHandle === widthMinHandle || currentHandle === heightMinHandle;
  const otherHandle = isMinHandle ? 
    currentHandle.nextElementSibling : 
    currentHandle.previousElementSibling;
  const otherPos = parseInt(otherHandle.style.left) || (isMinHandle ? 100 : 0);
  
  if (isMinHandle && pos < otherPos) {
    currentHandle.style.left = pos + '%';
  } else if (!isMinHandle && pos > otherPos) {
    currentHandle.style.left = pos + '%';
  }
  
  updateRangeDisplay();
  filterImages();
}

function handleDragEnd() {
  isDragging = false;
  currentHandle = null;
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
}

widthMinHandle.addEventListener('mousedown', (e) => handleDragStart(e, widthMinHandle));
widthMaxHandle.addEventListener('mousedown', (e) => handleDragStart(e, widthMaxHandle));
heightMinHandle.addEventListener('mousedown', (e) => handleDragStart(e, heightMinHandle));
heightMaxHandle.addEventListener('mousedown', (e) => handleDragStart(e, heightMaxHandle));

// 初始化最大值滑块位置
widthMaxHandle.style.left = '100%';
heightMaxHandle.style.left = '100%';


let typeLabel = document.createElement('span');
typeLabel.textContent = '类型：';
typeLabel.style.cssText = `
  font-size: 14px;
`;

filterContainer.appendChild(typeLabel);
filterContainer.appendChild(typeFilter);
filterContainer.appendChild(sizeFilter);

// 按钮容器
let buttonContainer = document.createElement('div');
buttonContainer.style.cssText = `
  display: flex;
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

// 下载按钮
// 创建按钮样式
const buttonStyle = `
  padding: 5px 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

// 全选按钮
let selectAllBtn = document.createElement('button');
selectAllBtn.innerHTML = '全选';
selectAllBtn.style.cssText = buttonStyle;

// 下载选中按钮
let downloadSelectedBtn = document.createElement('button');
downloadSelectedBtn.innerHTML = '下载选中';
downloadSelectedBtn.style.cssText = buttonStyle;

// 下载全部按钮
let downloadAllBtn = document.createElement('button');
downloadAllBtn.innerHTML = '下载全部';
downloadAllBtn.style.cssText = buttonStyle;

// 添加按钮到容器
buttonContainer.appendChild(selectAllBtn);
buttonContainer.appendChild(downloadSelectedBtn);
buttonContainer.appendChild(downloadAllBtn);
filterContainer.appendChild(buttonContainer);

// 全选按钮点击事件
selectAllBtn.addEventListener('click', function() {
  const visibleWrappers = Array.from(imageContainer.children).filter(
    wrapper => wrapper.style.display !== 'none'
  );
  
  // 检查是否所有可见图片都已选中
  const allSelected = visibleWrappers.every(
    wrapper => wrapper.querySelector('input[type="checkbox"]').checked
  );
  
  // 切换选中状态
  visibleWrappers.forEach(wrapper => {
    wrapper.querySelector('input[type="checkbox"]').checked = !allSelected;
  });
  
  // 更新按钮文本
  selectAllBtn.innerHTML = allSelected ? '全选' : '取消全选';
});

// 图片容器
let imageContainer = document.createElement('div');
imageContainer.style.cssText = `
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 5px;
`;

// 创建关闭按钮
let closeButton = document.createElement('button');
// 创建标题栏
let titleBar = document.createElement('div');
titleBar.style.cssText = `
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
  margin: -20px -20px 20px -20px;
`;

// 添加标题
let title = document.createElement('div');
title.textContent = 'Drop Image Saver';
title.style.cssText = `
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

// 修改关闭按钮样式和位置
closeButton.style.cssText = `
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #666;
  transition: color 0.2s;
`;
closeButton.innerHTML = '×';
closeButton.addEventListener('mouseover', () => {
  closeButton.style.color = '#000';
});
closeButton.addEventListener('mouseout', () => {
  closeButton.style.color = '#666';
});
closeButton.addEventListener('click', () => {
  imageSelector.style.display = 'none';
});

titleBar.appendChild(title);
titleBar.appendChild(closeButton);

// 将标题栏添加到imageSelector的最前面
imageSelector.insertBefore(titleBar, imageSelector.firstChild);

imageSelector.appendChild(filterContainer);
imageSelector.appendChild(imageContainer);
document.body.appendChild(imageSelector);

let draggedImage = null;
let draggedImageUrl = null;
let draggedImageFileName = null;

document.addEventListener('dragstart', function(event) {
  const img = event.target;
  if (img.tagName === 'IMG') {
    draggedImage = img;
    draggedImageUrl = img.src;
    draggedImageFileName = draggedImageUrl.split('/').pop();
    
    // 显示拖拽区域
    dropZone.style.display = 'flex';
    
    // 设置拖拽区域位置
    updateDropZonePosition(event);
  }
});

document.addEventListener('drag', function(event) {
  if (draggedImage) {
    updateDropZonePosition(event);
  }
});

document.addEventListener('dragend', function(event) {
  if (draggedImage) {
    const dropZoneRect = dropZone.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // 检查是否在接收区域内释放
    if (mouseX >= dropZoneRect.left && mouseX <= dropZoneRect.right &&
        mouseY >= dropZoneRect.top && mouseY <= dropZoneRect.bottom) {
      // 发送消息给background script处理下载
      chrome.runtime.sendMessage({
        type: 'downloadImage',
        url: draggedImageUrl,
        fileName: draggedImageFileName
      });
    }
    
    // 隐藏拖拽区域
    dropZone.style.display = 'none';
    draggedImage = null;
    draggedImageUrl = null;
    draggedImageFileName = null;
  }
});

// 更新拖拽区域位置
function updateDropZonePosition(event) {
  const x = event.clientX - dropZone.offsetWidth / 2;
  const y = event.clientY - dropZone.offsetHeight - 20; // 在鼠标上方20px
  dropZone.style.left = `${Math.max(0, Math.min(window.innerWidth - dropZone.offsetWidth, x))}px`;
  dropZone.style.top = `${Math.max(0, Math.min(window.innerHeight - dropZone.offsetHeight, y))}px`;
}

// 批量下载功能
// batchDownloadBtn.addEventListener('click', function() {
//   // 显示图片选择窗口
//   imageSelector.style.display = 'flex';
  
//   // 清空现有图片
//   imageContainer.innerHTML = '';
  
//   // 获取页面所有图片
//   const images = Array.from(document.getElementsByTagName('img'));
  
//   // 更新类型筛选器
//   createTypeFilter();
  
//   // 显示图片
//   images.forEach((img, index) => {
//     const wrapper = document.createElement('div');
//     wrapper.style.cssText = `
//       position: relative;
//       aspect-ratio: 1;
//       background: white;
//       padding: 5px;
//       border-radius: 5px;
//     `;
    
//     const checkbox = document.createElement('input');
//     checkbox.type = 'checkbox';
//     checkbox.style.cssText = `
//       position: absolute;
//       top: 5px;
//       left: 5px;
//       z-index: 1;
//     `;
    
//     const thumbnail = document.createElement('img');
//     thumbnail.src = img.src;
//     thumbnail.style.cssText = `
//       width: 100%;
//       height: 100%;
//       object-fit: contain;
//     `;
    
//     const info = document.createElement('div');
//     info.style.cssText = `
//       position: absolute;
//       bottom: 5px;
//       left: 5px;
//       right: 5px;
//       background: rgba(0,0,0,0.7);
//       color: white;
//       font-size: 12px;
//       padding: 2px 5px;
//       border-radius: 3px;
//     `;
//     info.textContent = `${img.naturalWidth}x${img.naturalHeight}`;
    
//     wrapper.appendChild(checkbox);
//     wrapper.appendChild(thumbnail);
//     wrapper.appendChild(info);
//     imageContainer.appendChild(wrapper);
//   });
// });

// 关闭图片选择窗口的点击事件
imageSelector.addEventListener('click', function(event) {
  if (event.target === imageSelector) {
    imageSelector.style.display = 'none';
  }
});

// 筛选功能
function filterImages() {
  const widthMinPos = parseInt(widthMinHandle.style.left) || 0;
  const widthMaxPos = parseInt(widthMaxHandle.style.left) || 100;
  const heightMinPos = parseInt(heightMinHandle.style.left) || 0;
  const heightMaxPos = parseInt(heightMaxHandle.style.left) || 100;
  
  const minWidth = Math.round((widthMinPos / 100) * maxImageWidth);
  const maxWidth = widthMaxPos === 100 ? Infinity : Math.round((widthMaxPos / 100) * maxImageWidth);
  const minHeight = Math.round((heightMinPos / 100) * maxImageHeight);
  const maxHeight = heightMaxPos === 100 ? Infinity : Math.round((heightMaxPos / 100) * maxImageHeight);
  
  Array.from(imageContainer.children).forEach(wrapper => {
    const img = wrapper.querySelector('img');
    const imgExt = '.' + img.src.split('.').pop().split('?')[0].toLowerCase();
    const meetsType = selectedTypes.has('all') || selectedTypes.has(imgExt);
    const meetsWidth = img.naturalWidth >= minWidth && img.naturalWidth <= maxWidth;
    const meetsHeight = img.naturalHeight >= minHeight && img.naturalHeight <= maxHeight;
    
    wrapper.style.display = meetsType && meetsWidth && meetsHeight ? 'block' : 'none';
  });
}

typeFilter.addEventListener('change', filterImages);

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'showImageSelector') {
    // 显示图片选择窗口
    imageSelector.style.display = 'flex';
    
    // 清空现有图片
    imageContainer.innerHTML = '';
    
    // 获取页面所有图片
    const images = Array.from(document.getElementsByTagName('img'));
    
    // 更新类型筛选器
    createTypeFilter();
    
    // 更新最大尺寸
    updateMaxDimensions();
    
    // 显示图片
    images.forEach((img, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: relative;
        aspect-ratio: 1;
        background: white;
        padding: 5px;
        border-radius: 5px;
      `;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.cssText = `
        position: absolute;
        top: 5px;
        left: 5px;
        z-index: 1;
      `;
      
      const thumbnail = document.createElement('img');
      thumbnail.src = img.src;
      thumbnail.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
      `;
      
      const info = document.createElement('div');
      info.style.cssText = `
        position: absolute;
        bottom: 5px;
        left: 5px;
        right: 5px;
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 12px;
        padding: 2px 5px;
        border-radius: 3px;
      `;
      info.textContent = `${img.naturalWidth}x${img.naturalHeight}`;
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(thumbnail);
      wrapper.appendChild(info);
      imageContainer.appendChild(wrapper);
    });
  }
});

// 下载功能
function downloadImages(selectedOnly = false) {
  const wrappers = Array.from(imageContainer.children);
  const imagesToDownload = wrappers
    .filter(wrapper => 
      wrapper.style.display !== 'none' && 
      (!selectedOnly || wrapper.querySelector('input[type="checkbox"]').checked)
    )
    .map(wrapper => ({
      url: wrapper.querySelector('img').src,
      fileName: wrapper.querySelector('img').src.split('/').pop()
    }));
  
  if (imagesToDownload.length > 0) {
    chrome.runtime.sendMessage({
      type: 'downloadImages',
      images: imagesToDownload
    });
  }
}

downloadSelectedBtn.addEventListener('click', () => downloadImages(true));
downloadAllBtn.addEventListener('click', () => downloadImages(false));