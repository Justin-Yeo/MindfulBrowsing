chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      chrome.storage.sync.get(["websites", "waitTime", "challenge"], (data) => {
        const blockedSites = data.websites || [];
        // Find a site that matches the current URL
        const matchingSite = blockedSites.find(site => tab.url.includes(site));
  
        if (matchingSite) {
          // Check if the user has already passed the challenge for this site
          chrome.storage.local.get([matchingSite], (result) => {
            const challengePassedUntil = result[matchingSite];
            if (challengePassedUntil && Date.now() < challengePassedUntil) {
              // User is within the allowed access period—do nothing.
              return;
            }
  
            // Otherwise, store the original URL and the matching site
            chrome.storage.local.set({
              originalURL: tab.url,
              originalSite: matchingSite
            }, () => {
              // Redirect to the challenge page only if not already there.
              if (!tab.url.includes("challenge.html")) {
                chrome.tabs.update(tabId, { url: chrome.runtime.getURL("challenge.html") });
              }
            });
          });
        }
      });
    }
  });
  