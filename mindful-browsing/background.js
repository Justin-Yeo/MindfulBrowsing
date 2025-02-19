chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      chrome.storage.sync.get(["websites", "waitTime", "challenge"], (data) => {
        const blockedSites = data.websites || [];
        const matchingSite = blockedSites.find(site => tab.url.includes(site));
  
        if (matchingSite) {
          // check if the user has already passed the challenge for this site
          chrome.storage.local.get([matchingSite], (result) => {
            const challengePassedUntil = result[matchingSite];
            if (challengePassedUntil && Date.now() < challengePassedUntil) {
              // user is within the grace allowed period
              return;
            }
  
            chrome.storage.local.set({
              originalURL: tab.url,
              originalSite: matchingSite
            }, () => {
              // redirect to the challenge page only if not already there.
              if (!tab.url.includes("challenge.html")) {
                chrome.tabs.update(tabId, { url: chrome.runtime.getURL("challenge.html") });
              }
            });
          });
        }
      });
    }
  });
  