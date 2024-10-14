let isTabListDisplayed = false; // Track whether the tab list is currently displayed

document.getElementById('listTabs').addEventListener('click', function() {
  let tabListDiv = document.getElementById('tabList');
  
  if (isTabListDisplayed) {
    // Hide the tab list if it is currently visible
    tabListDiv.style.display = 'none';
    isTabListDisplayed = false;
  } else {
    // Show the tab list and list all open tabs
  chrome.tabs.query({}, function(tabs) {
    let tabList = document.getElementById('tabList');
    tabList.innerHTML = ''; // Clear previous list

    tabs.forEach(function(tab) {
      let listItem = document.createElement('div');
      listItem.textContent = tab.title;

      // Tab title (clickable to switch to the tab)
      listItem.style.cursor = 'pointer';
      listItem.addEventListener('click', function() {
        chrome.tabs.update(tab.id, {active: true});
      });

      listItem.style.display = 'flex';
      listItem.style.justifyContent = 'space-between';
      listItem.style.marginBottom = '8px';


      // Close button for each tab
      let closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.marginLeft = '10px';
      closeButton.addEventListener('click', function() {
        chrome.tabs.remove(tab.id);
        listItem.remove();  // Remove from UI
      });

      //listItem.appendChild(tabTitle);
      listItem.appendChild(closeButton);


      tabList.appendChild(listItem);

      // Add a separator line after each tab item
      let separator = document.createElement('hr');
      separator.style.border = 'none';
      separator.style.height = '1px';
      separator.style.backgroundColor = '#333333';
      separator.style.margin = '10px 0';
      tabList.appendChild(separator);

    });

    tabListDiv.style.display = 'block'; // Show the container
      isTabListDisplayed = true;
  });
}
});

document.getElementById('closeTabs').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) {
      alert('No active tab to close.');
    } else {
      chrome.tabs.remove(tabs[0].id);
    }
  });
});


let isGroupedDisplayed = false; // Track whether grouped tabs are currently displayed

document.getElementById('groupTabs').addEventListener('click', function() {
  let groupedTabsDiv = document.getElementById('groupedTabs');

  if (isGroupedDisplayed) {
    // Hide the grouped tabs if they are currently visible
    groupedTabsDiv.style.display = 'none';
    isGroupedDisplayed = false;
  } else {
  // Show the grouped tabs and group them by domain
  chrome.tabs.query({}, function(tabs) {
    let tabGroups = {};
    tabs.forEach(function(tab) {

        try {
        // Filter out tabs with invalid URLs like chrome:// or file://
        let url = new URL(tab.url);
        let domain = url.hostname;

      //let domain = new URL(tab.url).hostname;
      if (!tabGroups[domain]) {
        tabGroups[domain] = [];
      }
      tabGroups[domain].push(tab);

       } catch (e) {
        // Ignore tabs with invalid URLs (e.g., chrome://)
        console.warn('Invalid URL skipped:', tab.url);
      }

    });

     // Display the grouped tabs
    displayTabGroups(tabGroups);
    groupedTabsDiv.style.display = 'block'; // Show the container
      isGroupedDisplayed = true;

  });
}
});


function displayTabGroups(tabGroups) {
  let groupedTabsDiv = document.getElementById('groupedTabs');
  groupedTabsDiv.innerHTML = ''; // Clear previous results

  for (let domain in tabGroups) {
    let domainDiv = document.createElement('div');
    domainDiv.style.marginBottom = '10px';

    // Domain title
    let domainTitle = document.createElement('h4');
    domainTitle.textContent = `Domain: ${domain}`;
    domainDiv.appendChild(domainTitle);

    // List of tabs for this domain
    tabGroups[domain].forEach(function(tab) {
      let tabLink = document.createElement('a');
      tabLink.href = tab.url;
      tabLink.textContent = tab.title || tab.url;
      tabLink.target = '_blank';
      tabLink.style.display = 'block';
      tabLink.style.marginLeft = '10px';

      domainDiv.appendChild(tabLink);
    });

    groupedTabsDiv.appendChild(domainDiv);
  }
}


document.getElementById('closeDomainTabs').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {
    if (activeTabs.length === 0) {
      alert('No active tab found.');
      return;
    }
    let activeTab = activeTabs[0];
    let activeDomain = new URL(activeTab.url).hostname;

    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        let tabDomain = new URL(tab.url).hostname;
        if (tabDomain === activeDomain) {
          chrome.tabs.remove(tab.id);
        }
      });
    });
  });
});

document.getElementById('moveTabsToNewWindow').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {
    if (activeTabs.length === 0) {
      alert('No active tab found.');
      return;
    }
    let activeTab = activeTabs[0];
    let activeDomain = new URL(activeTab.url).hostname;

    chrome.tabs.query({}, function(tabs) {
      let domainTabs = tabs.filter(function(tab) {
        return new URL(tab.url).hostname === activeDomain;
      });

      let tabIds = domainTabs.map(tab => tab.id);

      if (tabIds.length > 0) {
        chrome.windows.create({tabId: tabIds[0]}, function(newWindow) {
          // Move other tabs to the new window
          chrome.tabs.move(tabIds.slice(1), {windowId: newWindow.id, index: -1});
        });
      }
    });
  });
});
